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
 */

import { eq } from "drizzle-orm";
import {
  db,
  executionsTable,
  executionCheckpointsTable,
  workflowsTable,
  dlqEntriesTable,
  approvalTasksTable,
} from "@longox/db";
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
    executionId: number;
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
  }): Promise<number> {
    const [row] = await db
      .insert(executionCheckpointsTable)
      .values({
        executionId: opts.executionId,
        nodeId: opts.nodeId,
        nodeName: opts.nodeName,
        nodeType: opts.nodeType,
        status: opts.status,
        attemptNumber: opts.attemptNumber,
        inputData: opts.inputData as any,
        outputData: opts.outputData as any ?? null,
        errorMessage: opts.errorMessage ?? null,
        durationMs: opts.durationMs ?? null,
        metadata: opts.metadata as any ?? null,
        startedAt: new Date(),
      } as any)
      .returning({ id: executionCheckpointsTable.id });
    return row.id;
  }

  async loadCompleted(executionId: number): Promise<Array<{ nodeId: string; outputData: Record<string, unknown> }>> {
    const rows = await db
      .select({
        nodeId: executionCheckpointsTable.nodeId,
        outputData: executionCheckpointsTable.outputData,
      })
      .from(executionCheckpointsTable)
      .where(
        eq(executionCheckpointsTable.executionId, executionId),
      );

    return rows
      .filter((r) => r.outputData !== null)
      .map((r) => ({
        nodeId: r.nodeId,
        outputData: (r.outputData ?? {}) as Record<string, unknown>,
      }));
  }

  async update(checkpointId: number, updates: {
    status: "success" | "failed" | "paused";
    outputData?: Record<string, unknown>;
    errorMessage?: string;
    durationMs?: number;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await db
      .update(executionCheckpointsTable)
      .set({
        status: updates.status,
        outputData: updates.outputData as any ?? null,
        errorMessage: updates.errorMessage ?? null,
        durationMs: updates.durationMs ?? null,
        completedAt: new Date(),
      } as any)
      .where(eq(executionCheckpointsTable.id, checkpointId));
  }
}

// ─── Idempotency store (DB-backed via checkpoints) ────────────────────────────

export class DbIdempotencyStore implements IdempotencyStore {
  private readonly successfulIds = new Map<string, Record<string, unknown>>();

  async isComplete(executionId: number, nodeId: string): Promise<boolean> {
    const key = `${executionId}:${nodeId}`;
    if (this.successfulIds.has(key)) return true;

    const [row] = await db
      .select({ id: executionCheckpointsTable.id, outputData: executionCheckpointsTable.outputData })
      .from(executionCheckpointsTable)
      .where(eq(executionCheckpointsTable.executionId, executionId))
      .limit(1);

    if (row) {
      this.successfulIds.set(key, (row.outputData ?? {}) as Record<string, unknown>);
      return true;
    }
    return false;
  }

  async markComplete(executionId: number, nodeId: string, output: Record<string, unknown>): Promise<void> {
    this.successfulIds.set(`${executionId}:${nodeId}`, output);
  }

  async getOutput(executionId: number, nodeId: string): Promise<Record<string, unknown> | null> {
    const key = `${executionId}:${nodeId}`;
    return this.successfulIds.get(key) ?? null;
  }
}

// ─── Main DAG execution function ──────────────────────────────────────────────

export async function runWorkflowDAG(opts: {
  executionId: number;
  workflowId: number;
  workflowName: string;
  tenantId?: number;
  graph: WorkflowGraph;
  triggerPayload?: Record<string, unknown>;
  triggerType?: string;
  parentExecutionId?: number;
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
        await db
          .update(executionsTable)
          .set({ status: "running", startedAt: new Date() })
          .where(eq(executionsTable.id, executionId));
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
        await db.insert(dlqEntriesTable).values({
          executionId,
          workflowId,
          workflowName,
          nodeId: event.nodeId,
          nodeType: "unknown",
          nodeName: event.nodeId,
          errorMessage: event.error,
          attempts: 3,
          jobData: {},
        } as any);
        sseExecutionBus.broadcast({ executionId, eventType: "dlq", data: {
          executionId,
          nodeId: event.nodeId,
          error: event.error,
        }});
        break;

      case "execution.completed":
        await db
          .update(executionsTable)
          .set({
            status: "success",
            finishedAt: new Date(),
            durationMs: event.durationMs,
          })
          .where(eq(executionsTable.id, executionId));
        await db
          .update(workflowsTable)
          .set({ lastRunStatus: "success", lastRunAt: new Date() })
          .where(eq(workflowsTable.id, workflowId));
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
        await db
          .update(executionsTable)
          .set({
            status: "failed",
            finishedAt: new Date(),
            errorMessage: event.error,
          })
          .where(eq(executionsTable.id, executionId));
        await db
          .update(workflowsTable)
          .set({ lastRunStatus: "failed", lastRunAt: new Date() })
          .where(eq(workflowsTable.id, workflowId));
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
        executionId: number;
        nodeId: string;
        config: ApprovalGateConfig;
        input: Record<string, unknown>;
      }) => {
        const [task] = await db
          .insert(approvalTasksTable)
          .values({
            executionId: gateOpts.executionId,
            workflowId,
            nodeId: gateOpts.nodeId,
            status: "pending",
            config: gateOpts.config as any,
            note: gateOpts.config.message ?? null,
          } as any)
          .returning({ id: approvalTasksTable.id });
        return task.id;
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);

    await db
      .update(executionsTable)
      .set({
        status: "failed",
        finishedAt: new Date(),
        errorMessage: msg,
      })
      .where(eq(executionsTable.id, executionId));

    sseExecutionBus.broadcast({ executionId, eventType: "execution", data: {
      executionId,
      status: "failed",
      error: msg,
    }});

    throw err;
  }
}
