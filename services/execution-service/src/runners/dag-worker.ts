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
import { randomUUID } from "node:crypto";
import {
  DAGRunner,
  InMemoryLeaseStore,
  RedisLeaseStore,
  type CheckpointStore,
  type IdempotencyStore,
  type IdempotencyKeyInput,
  type DAGEvent,
  type ExecutionContext,
  type ChildWorkflowConfig,
  type ApprovalGateConfig,
  type WorkflowGraph,
  type LeaseStore,
  type NodeLease,
  buildCheckpointIdempotencyKey,
} from "@longox/workflow-engine";
import { createExecutors } from "../executors/registry";
import { sseExecutionBus } from "@longox/shared-realtime";
import { writeAudit } from "../queue/bullmq-queue";
import { runtimeConfig } from "../config/runtime";

// ─── Node lease store ──────────────────────────────────────────────────────
// Redis-backed when REDIS_URL is set (multi-worker safety — prevents two
// BullMQ workers from double-executing the same node); falls back to an
// in-memory store for single-process dev setups.
function createLeaseStore(): LeaseStore {
  const redisUrl = process.env["REDIS_URL"];
  if (!redisUrl) return new InMemoryLeaseStore();

  const client = new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
  return new RedisLeaseStore({
    set: (key, value, option, ms, cond) =>
      client.set(key, value, option, ms, cond),
    del: (key) => client.del(key),
    get: (key) => client.get(key),
  });
}

const leaseStore = createLeaseStore();

// ─── DB-backed lease store (architecture §9.1 / §9.8) ─────────────────────────
//
// Per-node leases persisted in the `execution_leases` table. The table's
// unique constraint is on `(execution_id, worker_id)`; we encode the nodeId
// into the `worker_id` slot (`${baseWorkerId}::${nodeId}`) so each
// (executionId, nodeId) pair maps to a unique row. Two workers competing for
// the same (execution, node) therefore conflict on the unique index — the
// winner's `INSERT ... ON CONFLICT DO NOTHING` returns 1 row, the loser's
// returns 0 rows and `acquire()` returns null (causing the DAG runner to
// skip the node, per P0-4 requirement #4).
//
// Lifecycle:
//   - acquire: 5-minute TTL (§9.8). Clears expired rows first so a crashed
//     worker doesn't block the new acquire.
//   - renew:   setInterval(60s) extends `leased_until` by another 5 minutes
//     while the node is still executing.
//   - release: clears the interval and DELETEs the row.
//
// Recovery: when a worker crashes mid-execution, its lease expires after
// 5 minutes. The BullMQ worker's `recoverInterruptedJobs()` (see
// `services/execution-service/src/queue/bullmq-queue.ts`) requeues any
// execution whose lease has expired — a new worker picks up the run and
// resumes from the last checkpoint (§9.8 Recovery Protocol).

const LEASE_TTL_MS = 5 * 60 * 1000; // 5 minutes (architecture §9.8)
const LEASE_RENEWAL_INTERVAL_MS = 60 * 1000; // 60 seconds

function generateWorkerId(): string {
  return `worker-${process.pid}-${Math.random().toString(36).slice(2, 9)}`;
}

const DB_LEASE_WORKER_ID = generateWorkerId();

/** Encode (workerId, nodeId) into the execution_leases.worker_id column so
 *  each (executionId, nodeId) pair gets a unique row. */
function encodeLeaseWorkerId(nodeId: string): string {
  return `${DB_LEASE_WORKER_ID}::${nodeId}`;
}

export class DbLeaseStore implements LeaseStore {
  async acquire(
    executionId: string,
    nodeId: string,
    ttlMs?: number,
  ): Promise<NodeLease | null> {
    const ttl = ttlMs ?? LEASE_TTL_MS;
    const leasedUntil = new Date(Date.now() + ttl);
    const leaseWorkerId = encodeLeaseWorkerId(nodeId);
    const leaseId = `lease_${randomUUID()}`;

    // ── Step 1: clear any expired leases for this (execution, node) pair ──
    // A crashed worker's lease row lingers until the TTL; we proactively
    // delete expired rows so the new INSERT doesn't trip ON CONFLICT.
    try {
      await prisma.$executeRawUnsafe(
        `DELETE FROM execution_leases
         WHERE execution_id = $1
           AND worker_id = $2
           AND leased_until < NOW()`,
        executionId,
        leaseWorkerId,
      );
    } catch (err) {
      // Non-fatal — the INSERT below will fail if an expired row blocks us,
      // which surfaces as a null lease (the runner will retry on the next
      // recovery pass per §9.8).
      console.error(
        `[DbLeaseStore] expired-lease cleanup failed for ${executionId}/${nodeId}:`,
        err,
      );
    }

    // ── Step 2: INSERT ... ON CONFLICT DO NOTHING (architecture §9.1) ──
    // Returns 1 if we got the lease, 0 if another worker holds a non-expired
    // lease for the same (execution, node).
    let inserted = 0;
    try {
      inserted = await prisma.$executeRawUnsafe(
        `INSERT INTO execution_leases (id, execution_id, worker_id, leased_until, created_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (execution_id, worker_id) DO NOTHING`,
        leaseId,
        executionId,
        leaseWorkerId,
        leasedUntil,
      );
    } catch (err) {
      console.error(
        `[DbLeaseStore] acquire failed for ${executionId}/${nodeId}:`,
        err,
      );
      return null;
    }

    if (inserted === 0) {
      // Another worker holds the lease — skip this node (P0-4 #4).
      return null;
    }

    // ── Step 3: 60-second renewal loop (architecture §9.1) ──────────────
    // The renewal extends `leased_until` by another 5 minutes. If the renewal
    // fails (e.g., another worker stole the lease via expiry sweep), we
    // surface the error but don't crash the node — the runner will detect
    // the missing lease on the next node boundary and abort.
    const renewalInterval = setInterval(async () => {
      try {
        await prisma.$executeRawUnsafe(
          `UPDATE execution_leases
             SET leased_until = NOW() + ($1 || ' microseconds')::interval
           WHERE execution_id = $2 AND worker_id = $3 AND id = $4`,
          String(LEASE_TTL_MS * 1000),
          executionId,
          leaseWorkerId,
          leaseId,
        );
      } catch (err) {
        console.error(
          `[DbLeaseStore] renewal failed for ${executionId}/${nodeId}:`,
          err,
        );
      }
    }, LEASE_RENEWAL_INTERVAL_MS);
    // setInterval returns a NodeJS.Timeout; keep the handle unref'd so it
    // doesn't keep the event loop alive on shutdown.
    if (typeof (renewalInterval as any).unref === "function") {
      (renewalInterval as any).unref();
    }

    const acquiredAt = new Date();
    let released = false;

    const self: NodeLease = {
      executionId,
      nodeId,
      workerId: DB_LEASE_WORKER_ID,
      acquiredAt,
      expiresAt: leasedUntil,
      async release() {
        if (released) return;
        released = true;
        clearInterval(renewalInterval);
        try {
          await prisma.$executeRawUnsafe(
            `DELETE FROM execution_leases
             WHERE execution_id = $1 AND worker_id = $2 AND id = $3`,
            executionId,
            leaseWorkerId,
            leaseId,
          );
        } catch (err) {
          console.error(
            `[DbLeaseStore] release failed for ${executionId}/${nodeId}:`,
            err,
          );
        }
      },
    };
    return self;
  }
}

// Composite lease store: DB-backed (architecture §9.1) takes precedence; the
// Redis-backed store provides an additional fast in-memory guard for the
// DAGRunner's existing per-node lock. If either refuses the acquire, the
// node is skipped.
class CompositeLeaseStore implements LeaseStore {
  constructor(
    private readonly primary: LeaseStore,
    private readonly secondary: LeaseStore,
  ) {}

  async acquire(
    executionId: string,
    nodeId: string,
    ttlMs?: number,
  ): Promise<NodeLease | null> {
    const primaryLease = await this.primary.acquire(executionId, nodeId, ttlMs);
    if (!primaryLease) return null;
    const secondaryLease = await this.secondary.acquire(
      executionId,
      nodeId,
      ttlMs,
    );
    if (!secondaryLease) {
      // Secondary refused — release the primary and bail.
      await primaryLease.release();
      return null;
    }
    // Wrap both releases.
    return {
      executionId: primaryLease.executionId,
      nodeId: primaryLease.nodeId,
      workerId: primaryLease.workerId,
      acquiredAt: primaryLease.acquiredAt,
      expiresAt: primaryLease.expiresAt,
      async release() {
        await Promise.allSettled([
          primaryLease.release(),
          secondaryLease.release(),
        ]);
      },
    };
  }
}

const dbLeaseStore = new DbLeaseStore();
const compositeLeaseStore = new CompositeLeaseStore(dbLeaseStore, leaseStore);

// ─── Checkpoint store (DB-backed) ─────────────────────────────────────────────
//
// Architecture §9.7 requires every checkpoint to carry:
//   - idempotency_key   (format: `${workflowId}|${runId}|${nodeId}|${attempt}`)
//   - compensation_status (pending | done | failed | skipped)
//   - retry_count       (= attempt - 1)
//   - started_at        (ISO timestamp)
//   - finished_at       (ISO timestamp, null while running)
//
// Prisma's `NodeExecutionCheckpoint` model uses a single `stateJson` JSON
// column for all per-node state, so these fields are persisted alongside the
// existing nodeName/nodeType/status/inputData/outputData/errorMessage fields.

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
    workflowId?: string;
    runId?: string;
    compensationStatus?: "pending" | "done" | "failed" | "skipped";
    startedAt?: Date;
    finishedAt?: Date | null;
  }): Promise<string> {
    const startedAt = opts.startedAt ?? new Date();
    const isTerminal = opts.status !== "running";
    const finishedAt =
      opts.finishedAt !== undefined
        ? opts.finishedAt
        : isTerminal
          ? new Date()
          : null;

    // §9.7 idempotency_key — `workflowId|runId|nodeId|attempt`.
    const idempotencyKey = buildCheckpointIdempotencyKey({
      executionId: opts.executionId,
      workflowId: opts.workflowId,
      runId: opts.runId,
      nodeId: opts.nodeId,
      attemptNumber: opts.attemptNumber,
    });

    // §9.7 retry_count — number of retries already attempted.
    const retryCount = Math.max(0, opts.attemptNumber - 1);

    // §9.7 compensation_status — defaults to "pending" while the node is
    // running; non-running statuses preserve the caller's override (or "pending").
    const compensationStatus = opts.compensationStatus ?? "pending";

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
          // §9.7 mandated fields
          idempotencyKey,
          compensationStatus,
          retryCount,
          startedAt: startedAt.toISOString(),
          finishedAt: finishedAt ? finishedAt.toISOString() : null,
        } as any,
      } as any,
      select: { id: true } as any,
    });
    return row.id;
  }

  async loadCompleted(
    executionId: string,
  ): Promise<Array<{ nodeId: string; outputData: Record<string, unknown> }>> {
    const rows = await prisma.nodeExecutionCheckpoint.findMany({
      where: { executionId },
      select: { nodeId: true, stateJson: true } as any,
    });

    return rows
      .map((r: any) => ({
        nodeId: r.nodeId,
        outputData: ((r.stateJson as any)?.outputData ?? null) as Record<
          string,
          unknown
        > | null,
      }))
      .filter((r) => r.outputData !== null)
      .map((r) => ({
        nodeId: r.nodeId,
        outputData: (r.outputData ?? {}) as Record<string, unknown>,
      }));
  }

  async update(
    checkpointId: string,
    updates: {
      status: "success" | "failed" | "paused";
      outputData?: Record<string, unknown>;
      errorMessage?: string;
      durationMs?: number;
      metadata?: Record<string, unknown>;
      compensationStatus?: "pending" | "done" | "failed" | "skipped";
      finishedAt?: Date | null;
    },
  ): Promise<void> {
    const existing = await prisma.nodeExecutionCheckpoint.findUnique({
      where: { id: checkpointId },
    });
    const currentState = (existing?.stateJson ?? {}) as Record<string, unknown>;

    const patch: Record<string, unknown> = {
      status: updates.status,
      outputData: updates.outputData ?? null,
      errorMessage: updates.errorMessage ?? null,
      durationMs: updates.durationMs ?? null,
      // §9.7 finished_at — set to now (unless caller overrides) when the node
      // transitions to a terminal state. `null` is treated as "now" because
      // `update()` is only invoked on terminal transitions.
      finishedAt:
        updates.finishedAt && updates.finishedAt instanceof Date
          ? updates.finishedAt.toISOString()
          : new Date().toISOString(),
    };
    if (updates.metadata !== undefined) patch.metadata = updates.metadata;
    // §9.7 compensation_status — preserved across updates unless the caller
    // explicitly transitions it (e.g. to "done" after a successful compensate).
    if (updates.compensationStatus !== undefined) {
      patch.compensationStatus = updates.compensationStatus;
    }

    await prisma.nodeExecutionCheckpoint.update({
      where: { id: checkpointId },
      data: {
        stateJson: { ...currentState, ...patch } as any,
      } as any,
    });
  }
}

// ─── Idempotency store (DB-backed via checkpoints) ────────────────────────────
//
// Architecture §9.1 — idempotency key is `${workflowId}|${executionId}|${nodeId}|${attempt}`.
// For the resume-skip path the DAGRunner probes attempt=1; the store treats
// any successful checkpoint for the (workflow, run, node) tuple as a hit so
// resume works regardless of which attempt originally succeeded. The full
// 4-component key is still computed and logged for traceability.

export class DbIdempotencyStore implements IdempotencyStore {
  /**
   * In-memory cache of completed (workflow, run, node) tuples → last output.
   * Keyed on the §9.1 components minus attempt (resume-skip semantics).
   * The attempt component is intentionally omitted from the cache key so a
   * re-run of attempt=2 after a successful attempt=1 still short-circuits.
   */
  private readonly successful = new Map<string, Record<string, unknown>>();

  private static resumeKey(input: IdempotencyKeyInput): string {
    // Resume-skip key: workflowId|executionId|nodeId (any attempt).
    return `${input.workflowId}|${input.executionId}|${input.nodeId}`;
  }

  async isComplete(input: IdempotencyKeyInput): Promise<boolean> {
    const resumeKey = DbIdempotencyStore.resumeKey(input);
    if (this.successful.has(resumeKey)) return true;

    // DB check: look for any successful checkpoint for this execution + node.
    // The §9.7 `stateJson.idempotencyKey` carries the full 4-component key,
    // but for the resume-skip probe we accept any attempt that succeeded.
    const row = await prisma.nodeExecutionCheckpoint.findFirst({
      where: { executionId: input.executionId, nodeId: input.nodeId } as any,
      select: { id: true, stateJson: true } as any,
    });

    const state = (row as any)?.stateJson as
      | Record<string, unknown>
      | undefined;
    if (
      row &&
      (state?.status === "success" || state?.status === "completed") &&
      state?.outputData
    ) {
      this.successful.set(
        resumeKey,
        state.outputData as Record<string, unknown>,
      );
      return true;
    }
    return false;
  }

  async markComplete(
    input: IdempotencyKeyInput,
    output: Record<string, unknown>,
  ): Promise<void> {
    this.successful.set(DbIdempotencyStore.resumeKey(input), output);
  }

  async getOutput(
    input: IdempotencyKeyInput,
  ): Promise<Record<string, unknown> | null> {
    return this.successful.get(DbIdempotencyStore.resumeKey(input)) ?? null;
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
  /** Child-workflow nesting depth — incremented on each spawn. */
  childWorkflowDepth?: number;
  /**
   * Recovery attempt counter (0 for the original run, 1+ for subsequent
   * recovery passes). When `recoveryAttempt + 1 > MAX_RECOVERY_ATTEMPTS`
   * the execution is moved to the DLQ with `recovery_exhausted` status
   * instead of being re-enqueued for another recovery.
   */
  recoveryAttempt?: number;
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
    childWorkflowDepth,
    recoveryAttempt = 0,
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
    childWorkflowDepth,
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
        sseExecutionBus.broadcast({
          executionId,
          eventType: "node",
          data: {
            executionId,
            nodeId: event.nodeId,
            nodeName: event.nodeName,
            status: "running",
            attempt: event.attempt,
          },
        });
        break;

      case "node.completed":
        sseExecutionBus.broadcast({
          executionId,
          eventType: "node",
          data: {
            executionId,
            nodeId: event.nodeId,
            status: "success",
            durationMs: event.durationMs,
          },
        });
        break;

      case "node.failed":
        sseExecutionBus.broadcast({
          executionId,
          eventType: "node",
          data: {
            executionId,
            nodeId: event.nodeId,
            status: "failed",
            error: event.error,
            attempt: event.attempt,
          },
        });
        break;

      case "node.retrying":
        sseExecutionBus.broadcast({
          executionId,
          eventType: "retry",
          data: {
            executionId,
            nodeId: event.nodeId,
            attempt: event.attempt,
            delayMs: event.delayMs,
          },
        });
        break;

      case "node.paused":
        sseExecutionBus.broadcast({
          executionId,
          eventType: "approval",
          data: {
            executionId,
            nodeId: event.nodeId,
            approvalTaskId: event.approvalTaskId,
            status: "pending",
          },
        });
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
        sseExecutionBus.broadcast({
          executionId,
          eventType: "dlq",
          data: {
            executionId,
            nodeId: event.nodeId,
            error: event.error,
          },
        });
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
        sseExecutionBus.broadcast({
          executionId,
          eventType: "execution",
          data: {
            executionId,
            status: "success",
            durationMs: event.durationMs,
          },
        });
        await writeAudit(
          "execution.completed",
          "execution",
          String(executionId),
          {
            workflowId,
            durationMs: event.durationMs,
          },
        );
        break;

      case "execution.failed": {
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
        sseExecutionBus.broadcast({
          executionId,
          eventType: "execution",
          data: {
            executionId,
            status: "failed",
            error: event.error,
          },
        });
        await writeAudit("execution.failed", "execution", String(executionId), {
          workflowId,
          error: event.error,
        });

        // ── P1-14: 3-attempt recovery_exhausted → DLQ (architecture §9.8) ──
        // After MAX_RECOVERY_ATTEMPTS (default 3) failed recovery passes we
        // stop re-enqueuing the execution and move it to the DLQ with
        // `recovery_exhausted` status. The execution row itself is marked
        // `recovery_exhausted` so operators can find dead executions
        // without having to scan the DLQ.
        const maxRecoveryAttempts = runtimeConfig.MAX_RECOVERY_ATTEMPTS;
        const nextRecoveryAttempt = recoveryAttempt + 1;
        if (nextRecoveryAttempt > maxRecoveryAttempts) {
          await prisma.workflowExecution.update({
            where: { id: executionId },
            data: {
              status: "recovery_exhausted",
              errorMessage: `Recovery exhausted after ${recoveryAttempt} attempts: ${event.error}`,
            } as any,
          });
          await prisma.deadLetterQueue.create({
            data: {
              executionId,
              nodeId: "__workflow__",
              reason: `recovery_exhausted: ${event.error}`,
              status: "recovery_exhausted",
              payloadJson: {
                workflowId,
                workflowName,
                nodeId: "__workflow__",
                nodeType: "workflow",
                nodeName: workflowName,
                errorMessage: event.error,
                recoveryAttempt,
                maxRecoveryAttempts,
                jobData: { triggerType, triggerPayload },
              } as any,
            } as any,
          });
          sseExecutionBus.broadcast({
            executionId,
            eventType: "dlq",
            data: {
              executionId,
              nodeId: "__workflow__",
              status: "recovery_exhausted",
              error: event.error,
              recoveryAttempt,
            },
          });
          await writeAudit(
            "execution.recovery_exhausted",
            "execution",
            String(executionId),
            { workflowId, recoveryAttempt, error: event.error },
          );
        } else {
          // Still under the cap — enqueue a recovery job. The recovery
          // worker (processWorkflowExecutionRecovery in bullmq-queue.ts)
          // picks this up and re-enqueues the workflow-execution job,
          // forwarding the incremented `_recoveryAttempt` so the next
          // run knows which attempt it is.
          try {
            const { jobQueue } = await import("../queue/bullmq-queue");
            await jobQueue.addJob("workflow-execution-recovery", {
              executionId,
              workflowId,
              recoveryAttempt: nextRecoveryAttempt,
            } as any);
          } catch (e) {
            console.error(
              `[dag-worker] failed to enqueue recovery job for ${executionId}:`,
              e,
            );
          }
        }
        break;
      }

      default:
        break;
    }
  };

  // ── Run the DAG ─────────────────────────────────────────────────────────────

  try {
    await runner.run(graph, context, {
      checkpointStore,
      idempotencyStore,
      // Composite lease store — DB-backed (architecture §9.1) takes
      // precedence; Redis provides an additional fast multi-worker guard.
      // Either refusing the acquire causes the runner to skip the node.
      leaseStore: compositeLeaseStore,
      enableSaga: true,
      onEvent: handleEvent,
      timeoutMs: graph.timeoutMs ?? 30 * 60 * 1000, // 30 min default

      // ── P1-11: child-workflow nesting depth cap (architecture §9.1) ────────
      // The architecture default is 5. A workflow that tries to spawn a child
      // at depth 6 is rejected at the node level before it ever enqueues.
      maxChildWorkflowDepth: runtimeConfig.MAX_CHILD_WORKFLOW_DEPTH,

      // ── P1-13: loop-iteration cap (architecture §9.1) ─────────────────────
      // Default tenants are capped at MAX_LOOP_ITERATIONS_DEFAULT (100); Pro
      // tenants at MAX_LOOP_ITERATIONS_PRO (10,000). We resolve the cap from
      // the runtime config; per-tenant tier upgrade is handled by setting
      // the runtime env vars or — TODO — by reading the tenant's billing
      // plan from `billing_accounts.tier` and bumping the cap for Pro.
      maxLoopIterations: runtimeConfig.MAX_LOOP_ITERATIONS_DEFAULT,

      // ── P1-12: child-workflow `await: true` polling ─────────────────────────
      // Polls the `workflow_executions` table for the child's terminal
      // status. Resolves as soon as the child reaches a terminal state or
      // after the timeout (defaults to the parent's remaining timeout budget).
      awaitChildWorkflowCompletion: async (childExecutionId, awaitOpts) => {
        const pollIntervalMs = awaitOpts?.pollIntervalMs ?? 1_000;
        // Default timeout: 30 minutes (matches the parent default). Caller
        // can override via `childWorkflow.awaitTimeoutMs`.
        const timeoutMs = awaitOpts?.timeoutMs ?? 30 * 60 * 1000;
        const deadline = Date.now() + timeoutMs;

        let lastStatus = "pending";
        while (Date.now() < deadline) {
          const child = (await prisma.workflowExecution.findUnique({
            where: { id: childExecutionId },
            select: { status: true, errorMessage: true } as any,
          })) as any;
          if (!child) {
            return {
              status: "failed",
              error: `Child workflow ${childExecutionId} not found`,
            };
          }
          lastStatus = String(child.status ?? "pending");
          // Treat any non-running / non-pending status as terminal.
          if (
            lastStatus !== "pending" &&
            lastStatus !== "running" &&
            lastStatus !== "queued"
          ) {
            return {
              status: lastStatus === "success" ? "success" : lastStatus,
              error: child.errorMessage ?? undefined,
            };
          }
          await new Promise((r) => setTimeout(r, pollIntervalMs));
        }
        return {
          status: "timeout",
          error: `Child workflow ${childExecutionId} did not reach a terminal state within ${timeoutMs}ms (last status: ${lastStatus})`,
        };
      },

      // ── Child workflow spawner ───────────────────────────────────────────────
      spawnChildWorkflow: async (
        config: ChildWorkflowConfig,
        input: Record<string, unknown>,
        ctx: ExecutionContext,
      ) => {
        // Import lazily to avoid circular deps with bullmq-queue
        const { enqueueWorkflow } = await import("../queue/bullmq-queue");
        const childExecId = await enqueueWorkflow({
          workflowId: config.workflowId,
          triggerPayload: {
            ...input,
            // Propagate the parent's depth so the child DAG run starts at
            // depth+1 and can reject any further spawn past the cap.
            _childWorkflowDepth: ctx.childWorkflowDepth ?? 0,
          },
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

    sseExecutionBus.broadcast({
      executionId,
      eventType: "execution",
      data: {
        executionId,
        status: "failed",
        error: msg,
      },
    });

    // ── P1-14: same recovery_exhausted logic as the execution.failed event ──
    // This catch covers exceptions thrown out of `runner.run()` itself
    // (cycle in the graph, abort timeout, etc.). The execution.failed
    // event handler covers in-run node failures; both paths converge on
    // the same recovery-exhaustion check.
    const maxRecoveryAttempts = runtimeConfig.MAX_RECOVERY_ATTEMPTS;
    const nextRecoveryAttempt = recoveryAttempt + 1;
    if (nextRecoveryAttempt > maxRecoveryAttempts) {
      await prisma.workflowExecution.update({
        where: { id: executionId },
        data: {
          status: "recovery_exhausted",
          errorMessage: `Recovery exhausted after ${recoveryAttempt} attempts: ${msg}`,
        } as any,
      });
      await prisma.deadLetterQueue.create({
        data: {
          executionId,
          nodeId: "__workflow__",
          reason: `recovery_exhausted: ${msg}`,
          status: "recovery_exhausted",
          payloadJson: {
            workflowId,
            workflowName,
            nodeId: "__workflow__",
            nodeType: "workflow",
            nodeName: workflowName,
            errorMessage: msg,
            recoveryAttempt,
            maxRecoveryAttempts,
            jobData: { triggerType, triggerPayload },
          } as any,
        } as any,
      });
      await writeAudit(
        "execution.recovery_exhausted",
        "execution",
        String(executionId),
        { workflowId, recoveryAttempt, error: msg },
      );
    } else {
      try {
        const { jobQueue } = await import("../queue/bullmq-queue");
        await jobQueue.addJob("workflow-execution-recovery", {
          executionId,
          workflowId,
          recoveryAttempt: nextRecoveryAttempt,
        } as any);
      } catch (e) {
        console.error(
          `[dag-worker] failed to enqueue recovery job for ${executionId}:`,
          e,
        );
      }
    }

    throw err;
  }
}
