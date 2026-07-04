/**
 * DAG-based execution worker.
 *
 * Upgrades the legacy sequential runner (bullmq-queue.ts) to the
 * architecture-compliant DAG execution engine from @longox/workflow-engine.
 *
 * Features:
 *   ✓ Topological fan-out (parallel independent nodes)
 *   ✓ Bounded loops (node.loop config)
 *   ✓ Checkpoint/resume (loads completed nodes from DB, skips them)
 *   ✓ Idempotency (DB-backed via execution_checkpoints)
 *   ✓ Exponential backoff retry with jitter
 *   ✓ Saga compensation on failure
 *   ✓ Child workflow spawn
 *   ✓ Human approval gate pause/resume
 *   ✓ SSE event broadcasting via broadcastExecutionEvent()
 *
 * Migrated from Drizzle to Prisma per ADR-013 Phase 3.
 */

import { prisma } from "@longox/db/prisma";
import IORedis from "ioredis";
import {
  DAGRunner,
  InMemoryLeaseStore,
  RedisLeaseStore,
  type CheckpointStore,
  type IdempotencyStore,
  type DAGEvent,
  type ExecutionContext,
  type ChildWorkflowConfig,
  type ApprovalGateConfig,
  type WorkflowGraph,
  type LeaseStore,
} from "@longox/workflow-engine";
import { createExecutors } from "../executors/registry";
import { sseExecutionBus } from "@longox/shared-realtime";
import { writeAudit } from "../queue/bullmq-queue";

// ─── Node lease store ──────────────────────────────────────────────────────
// Redis-backed when REDIS_URL is set (multi-worker safety — prevents two
// BullMQ workers from double-executing the same node); falls back to an
// in-memory store for single-process dev setups.
function createLeaseStore(): LeaseStore {
  const redisUrl = process.env["REDIS_URL"];
  if (!redisUrl) return new InMemoryLeaseStore();

  const client = new IORedis(redisUrl, { maxRetriesPerRequest: null, enableReadyCheck: false });
  return new RedisLeaseStore({
    set: (key, value, option, ms, cond) => client.set(key, value, option, ms, cond),
    del: (key) => client.del(key),
    get: (key) => client.get(key),
  });
}

const leaseStore = createLeaseStore();

// ─── Checkpoint store (DB-backed) ─────────────────────────────────────────────

export class DbCheckpointStore implements CheckpointStore {
  async save(opts: {
    executionId: string;
    nodeId: string;
    nodeName: string;
    nodeType: string;
    status: "running" | "success" | "failed" | "paused";
    attemptNumber: number;
    inputData: Record<string, unknown>;
    outputData?: Record<string, unknown>;
    errorMessage?: string;
    durationMs?: number;
    metadata?: Record<string, unknown>;
  }): Promise<string> {
    const row = await prisma.nodeExecutionCheckpoint.create({
      data: {
        executionId: opts.executionId,
        nodeId: opts.nodeId,
        attempt: opts.attemptNumber,
        stateJson: {
          nodeName: opts.nodeName,
          nodeType: opts.nodeType,
          status: opts.status,
          attemptNumber: opts.attemptNumber,
          inputData: opts.inputData,
          outputData: opts.outputData ?? null,
          errorMessage: opts.errorMessage ?? null,
          durationMs: opts.durationMs ?? null,
          metadata: opts.metadata ?? null,
          startedAt: new Date(),
        } as any,
      } as any,
      select: { id: true } as any,
    });
    return row.id;
  }

  async loadCompleted(executionId: string): Promise<Array<{ nodeId: string; outputData: Record<string, unknown> }>> {
    const rows = await prisma.nodeExecutionCheckpoint.findMany({
      where: { executionId },
      select: { nodeId: true, stateJson: true } as any,
    });

    return rows
      .map((r: any) => ({
        nodeId: r.nodeId,
        outputData: ((r.stateJson as any)?.outputData ?? null) as Record<string, unknown> | null,
      }))
      .filter((r) => r.outputData !== null)
      .map((r) => ({
        nodeId: r.nodeId,
        outputData: (r.outputData ?? {}) as Record<string, unknown>,
      }));
  }

  async update(checkpointId: string, updates: {
    status: "success" | "failed" | "paused";
    outputData?: Record<string, unknown>;
    errorMessage?: string;
    durationMs?: number;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    const existing = await prisma.nodeExecutionCheckpoint.findUnique({
      where: { id: checkpointId },
    });
    const currentState = (existing?.stateJson ?? {}) as Record<string, unknown>;

    const patch: Record<string, unknown> = {
      status: updates.status,
      outputData: updates.outputData ?? null,
      errorMessage: updates.errorMessage ?? null,
      durationMs: updates.durationMs ?? null,
      completedAt: new Date(),
    };
    if (updates.metadata !== undefined) patch.metadata = updates.metadata;

    await prisma.nodeExecutionCheckpoint.update({
      where: { id: checkpointId },
      data: {
        stateJson: { ...currentState, ...patch } as any,
      } as any,
    });
  }
}

// ─── Idempotency store (DB-backed via checkpoints) ────────────────────────────

export class DbIdempotencyStore implements IdempotencyStore {
  private readonly successfulIds = new Map<string, Record<string, unknown>>();

  async isComplete(executionId: string, nodeId: string): Promise<boolean> {
    const key = `${executionId}:${nodeId}`;
    if (this.successfulIds.has(key)) return true;

    const row = await prisma.nodeExecutionCheckpoint.findFirst({
      where: { executionId } as any,
      select: { id: true, stateJson: true } as any,
    });

    if (row) {
      this.successfulIds.set(
        key,
        ((row as any).stateJson?.outputData ?? {}) as Record<string, unknown>,
      );
      return true;
    }
    return false;
  }

  async markComplete(executionId: string, nodeId: string, output: Record<string, unknown>): Promise<void> {
    this.successfulIds.set(`${executionId}:${nodeId}`, output);
  }

  async getOutput(executionId: string, nodeId: string): Promise<Record<string, unknown> | null> {
    const key = `${executionId}:${nodeId}`;
    return this.successfulIds.get(key) ?? null;
  }
}

// ─── Main DAG execution function ──────────────────────────────────────────────

export async function runWorkflowDAG(opts: {
  executionId: string;
  workflowId: string;
  workflowName: string;
  tenantId?: string;
  graph: WorkflowGraph;
  triggerPayload?: Record<string, unknown>;
  triggerType?: string;
  parentExecutionId?: string;
}): Promise<void> {
  const {
    executionId,
    workflowId,
    workflowName,
    tenantId,
    graph,
    triggerPayload = {},
    triggerType = "manual",
    parentExecutionId,
  } = opts;

  const runner = new DAGRunner();

  // Register all executors
  const executors = createExecutors();
  for (const executor of executors) {
    runner.registerExecutor(executor);
  }

  const context: ExecutionContext = {
    executionId,
    workflowId,
    workflowName,
    triggerType,
    triggerPayload,
    variables: {},
    startedAt: new Date(),
    parentExecutionId,
  };

  const checkpointStore = new DbCheckpointStore();
  const idempotencyStore = new DbIdempotencyStore();

  // ── Event handler: DB updates + SSE broadcast ───────────────────────────────

  const handleEvent = async (event: DAGEvent): Promise<void> => {
    switch (event.type) {
      case "execution.started":
        await prisma.workflowExecution.update({
          where: { id: executionId },
          data: { status: "running", startedAt: new Date() } as any,
        });
        break;

      case "node.started":
        sseExecutionBus.broadcast({ executionId, eventType: "node", data: {
          executionId,
          nodeId: event.nodeId,
          nodeName: event.nodeName,
          status: "running",
          attempt: event.attempt,
        }});
        break;

      case "node.completed":
        sseExecutionBus.broadcast({ executionId, eventType: "node", data: {
          executionId,
          nodeId: event.nodeId,
          status: "success",
          durationMs: event.durationMs,
        }});
        break;

      case "node.failed":
        sseExecutionBus.broadcast({ executionId, eventType: "node", data: {
          executionId,
          nodeId: event.nodeId,
          status: "failed",
          error: event.error,
          attempt: event.attempt,
        }});
        break;

      case "node.retrying":
        sseExecutionBus.broadcast({ executionId, eventType: "retry", data: {
          executionId,
          nodeId: event.nodeId,
          attempt: event.attempt,
          delayMs: event.delayMs,
        }});
        break;

      case "node.paused":
        sseExecutionBus.broadcast({ executionId, eventType: "approval", data: {
          executionId,
          nodeId: event.nodeId,
          approvalTaskId: event.approvalTaskId,
          status: "pending",
        }});
        break;

      case "dlq.entry":
        await prisma.deadLetterQueue.create({
          data: {
            executionId,
            nodeId: event.nodeId,
            reason: event.error,
            payloadJson: {
              workflowId,
              workflowName,
              nodeId: event.nodeId,
              nodeType: "unknown",
              nodeName: event.nodeId,
              errorMessage: event.error,
              attempts: 3,
              jobData: {},
            } as any,
          } as any,
        });
        sseExecutionBus.broadcast({ executionId, eventType: "dlq", data: {
          executionId,
          nodeId: event.nodeId,
          error: event.error,
        }});
        break;

      case "execution.completed":
        await prisma.workflowExecution.update({
          where: { id: executionId },
          data: {
            status: "success",
            finishedAt: new Date(),
            durationMs: event.durationMs,
          } as any,
        });
        await prisma.workflow.update({
          where: { id: workflowId },
          data: { lastRunStatus: "success", lastRunAt: new Date() } as any,
        });
        sseExecutionBus.broadcast({ executionId, eventType: "execution", data: {
          executionId,
          status: "success",
          durationMs: event.durationMs,
        }});
        await writeAudit("execution.completed", "execution", String(executionId), {
          workflowId,
          durationMs: event.durationMs,
        });
        break;

      case "execution.failed":
        await prisma.workflowExecution.update({
          where: { id: executionId },
          data: {
            status: "failed",
            finishedAt: new Date(),
            errorMessage: event.error,
          } as any,
        });
        await prisma.workflow.update({
          where: { id: workflowId },
          data: { lastRunStatus: "failed", lastRunAt: new Date() } as any,
        });
        sseExecutionBus.broadcast({ executionId, eventType: "execution", data: {
          executionId,
          status: "failed",
          error: event.error,
        }});
        await writeAudit("execution.failed", "execution", String(executionId), {
          workflowId,
          error: event.error,
        });
        break;

      default:
        break;
    }
  };

  // ── Run the DAG ─────────────────────────────────────────────────────────────

  try {
    await runner.run(graph, context, {
      checkpointStore,
      idempotencyStore,
      leaseStore,
      enableSaga: true,
      onEvent: handleEvent,
      timeoutMs: graph.timeoutMs ?? 30 * 60 * 1000, // 30 min default

      // ── Child workflow spawner ───────────────────────────────────────────────
      spawnChildWorkflow: async (
        config: ChildWorkflowConfig,
        input: Record<string, unknown>,
        _ctx: ExecutionContext,
      ) => {
        // Import lazily to avoid circular deps with bullmq-queue
        const { enqueueWorkflow } = await import("../queue/bullmq-queue");
        const childExecId = await enqueueWorkflow({
          workflowId: config.workflowId,
          triggerPayload: input,
          triggerType: "child_workflow",
          parentExecutionId: executionId,
        });
        return childExecId;
      },

      // ── Approval gate writer ─────────────────────────────────────────────────
      writeApprovalGate: async (gateOpts: {
        executionId: string;
        nodeId: string;
        config: ApprovalGateConfig;
        input: Record<string, unknown>;
      }) => {
        const task = await prisma.approvalTask.create({
          data: {
            workflowId,
            requesterId: "system",
            status: "pending",
            comment: (gateOpts.config as any).message ?? null,
            // Drizzle-compat fields stored alongside canonical Prisma fields.
            ...({
              executionId: gateOpts.executionId,
              nodeId: gateOpts.nodeId,
              note: (gateOpts.config as any).message ?? null,
              config: gateOpts.config as any,
            } as any),
          } as any,
          select: { id: true } as any,
        });
        return task.id;
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);

    await prisma.workflowExecution.update({
      where: { id: executionId },
      data: {
        status: "failed",
        finishedAt: new Date(),
        errorMessage: msg,
      } as any,
    });

    sseExecutionBus.broadcast({ executionId, eventType: "execution", data: {
      executionId,
      status: "failed",
      error: msg,
    }});

    throw err;
  }
}
