import { Queue, Worker, JobsOptions } from "bullmq";
import IORedis from "ioredis";
import { trace, SpanStatusCode } from "@opentelemetry/api";
import type {
  AiRunJobData,
  JobQueue,
  JobType,
  WebhookJobData,
  WorkflowJobData,
} from "@longox/shared-queue";
import {
  DEFAULT_RETRY_POLICY,
  QUEUE_TOPOLOGY,
  ALL_QUEUE_NAMES,
  type QueueName,
  type QueueTopologyEntry,
} from "@longox/shared-queue";
import { publishEvent } from "@longox/shared-realtime";
import { prisma } from "@longox/db/prisma";
import { createExecutors, findExecutor } from "../executors/registry";
import { runWorkflowDAG } from "../runners/dag-worker";
import type { WorkflowGraph } from "@longox/workflow-engine";
import {
  recordJobCompleted,
  recordJobFailed,
  recordJobRetried,
  updateQueueDepth,
} from "../telemetry/metrics";

export type {
  AiRunJobData,
  JobQueue,
  JobType,
  WebhookJobData,
  WorkflowJobData,
} from "@longox/shared-queue";

// ─── Connection ────────────────────────────────────────────────────────────────
//
// ADR-001 / architecture.md §11 — each named BullMQ queue gets its own Redis
// logical database (db 0..9) so that queues can be tuned independently (AOF
// persistence, eviction policy, maxmemory). Connections are cached so we don't
// reopen Redis for every enqueue.

const connectionCache = new Map<number, IORedis>();

function createRedisConnection(db: number = 0): IORedis {
  const cached = connectionCache.get(db);
  if (cached) return cached;
  const url = process.env["REDIS_URL"] ?? "redis://localhost:6379";
  const conn = new IORedis(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    db,
  });
  connectionCache.set(db, conn);
  return conn;
}

// ─── Queue topology (ADR-001 / §11) ───────────────────────────────────────────
//
// All 10 named queues are created lazily. The legacy `longox:executions` queue
// is preserved as a fallback for code paths that haven't been migrated to the
// named-queue topology (it sits on the default db 0 alongside
// `workflow-execution`).

const defaultJobOptions: JobsOptions = {
  attempts: DEFAULT_RETRY_POLICY.attempts,
  backoff: {
    type: DEFAULT_RETRY_POLICY.backoffType,
    delay: DEFAULT_RETRY_POLICY.backoffDelayMs,
  },
  removeOnComplete: { age: 3600, count: 100 },
  removeOnFail: { age: 86400, count: 500 },
};

const queueCache = new Map<QueueName, Queue>();

function getQueueForType(name: QueueName): Queue {
  const cached = queueCache.get(name);
  if (cached) return cached;
  const topology: QueueTopologyEntry = QUEUE_TOPOLOGY[name];
  const q = new Queue(name, {
    connection: createRedisConnection(topology.redisDb) as any,
    defaultJobOptions,
  });
  queueCache.set(name, q);
  return q;
}

// Legacy queue kept for backwards compatibility with callers that still enqueue
// jobs onto `longox:executions` (pre-named-queue code paths). All new enqueue
// sites should resolve the proper named queue via `getQueueForType`.
//
// @deprecated (matrix item 9) — the `longox:executions` legacy queue is
// deprecated and will be removed in a future release once all enqueue sites
// are migrated to the named-queue topology (ADR-001 / §11). Do NOT add new
// callers — use `getQueueForType` with a `QueueName` from `QUEUE_TOPOLOGY`.
// The legacy queue is only retained defensively so that callers passing an
// unknown job type don't throw at runtime; all production code should resolve
// to a named queue.
const LEGACY_QUEUE_NAME = "longox:executions";
let legacyQueue: Queue | null = null;

function getLegacyQueue(): Queue {
  if (!legacyQueue) {
    legacyQueue = new Queue(LEGACY_QUEUE_NAME, {
      connection: createRedisConnection(0) as any,
      defaultJobOptions,
    });
  }
  return legacyQueue;
}

// Map a JobType to the queue that should host it. The named-queue topology is
// the source of truth; the legacy queue is only used if a caller explicitly
// passes a name outside the topology (defensive).
function resolveQueue(type: JobType): Queue {
  if ((ALL_QUEUE_NAMES as string[]).includes(type)) {
    return getQueueForType(type as QueueName);
  }
  return getLegacyQueue();
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

const executors = createExecutors();

export async function writeAudit(
  action: string,
  resourceType: string,
  resourceId: string,
  metadata?: Record<string, unknown>,
  actorType = "system",
  actorId?: string,
) {
  await prisma.auditLog.create({
    data: {
      actorId: actorId ?? "system",
      action,
      targetType: resourceType,
      targetId: resourceId,
      diffJson: (metadata ?? null) as any,
      // Drizzle-compat fields stored alongside canonical Prisma fields.
      ...({
        actorType,
        resourceType,
        resourceId,
        metadata: metadata ?? null,
      } as any),
    } as any,
  });
}

interface WorkflowNode {
  id: string;
  name: string;
  type?: string;
  nodeTypeId?: string;
  position?: { x: number; y: number };
  config?: Record<string, unknown>;
}

// ─── Job Processors ────────────────────────────────────────────────────────────

async function processWorkflowExecution(data: WorkflowJobData): Promise<void> {
  const {
    executionId,
    workflowId,
    workflowName,
    nodes,
    triggerPayload,
    triggerType,
  } = data;

  await prisma.workflowExecution.update({
    where: { id: executionId },
    data: { status: "running" } as any,
  });

  const raw = nodes as any;
  const graph: WorkflowGraph = {
    nodes: Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.nodes)
        ? raw.nodes
        : [],
    edges: Array.isArray(raw?.edges) ? raw.edges : [],
    timeoutMs: raw?.timeoutMs ?? 30 * 60 * 1000,
  };

  // ── P1-11: child-workflow nesting depth propagation ──────────────────────
  // When this execution was spawned as a child workflow, the parent
  // stamped `_childWorkflowDepth` into the trigger payload. We forward it
  // to `runWorkflowDAG` so the child's DAG run starts at the right depth
  // and rejects any further spawn past the cap.
  const childWorkflowDepth =
    typeof triggerPayload?._childWorkflowDepth === "number"
      ? (triggerPayload._childWorkflowDepth as number)
      : undefined;

  // ── P1-14: recovery-attempt propagation ─────────────────────────────────
  // The dag-worker's failure handler enqueues a `workflow-execution-recovery`
  // job; the recovery worker re-enqueues the workflow-execution job with
  // `_recoveryAttempt` in the trigger payload so the next DAG run knows
  // which recovery attempt it is (and can move to DLQ after the cap).
  const recoveryAttempt =
    typeof triggerPayload?._recoveryAttempt === "number"
      ? (triggerPayload._recoveryAttempt as number)
      : 0;

  await runWorkflowDAG({
    executionId,
    workflowId,
    workflowName,
    graph,
    triggerPayload,
    triggerType,
    childWorkflowDepth,
    recoveryAttempt,
  });
}

async function processWebhookDelivery(data: WebhookJobData): Promise<void> {
  const { workflowId, payload } = data;
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId },
  });

  if (workflow) {
    const nodes = Array.isArray((workflow as any).nodes)
      ? ((workflow as any).nodes as any[])
      : [];
    await addWorkflowJob(workflowId, workflow.name, nodes, "webhook", payload);
  }
}

async function processAiRun(data: AiRunJobData): Promise<void> {
  const { nodeTypeId, config, input, workflowId } = data;
  const executor = findExecutor(executors, nodeTypeId);
  if (!executor) {
    throw new Error(`No executor for node type "${nodeTypeId}"`);
  }
  const result = await executor.execute(
    {
      id: "ai-node",
      name: "AI Run",
      nodeTypeId,
      config,
      position: { x: 0, y: 0 },
    },
    {
      executionId: "",
      workflowId,
      workflowName: "",
      triggerType: "api",
      triggerPayload: {},
      variables: {},
      startedAt: new Date(),
    },
    input,
  );
  if (result.status === "failed") {
    throw new Error(result.error ?? "AI run failed");
  }
}

// ─── Placeholder job processors (ADR-001 / §11) ───────────────────────────────
//
// These queue processors are stubs — the services that own them (billing,
// notification, connector, template, audit-export) implement the real
// business logic. They are mounted here so the execution-service worker can
// drain jobs from those queues if they end up co-located (single-process
// dev mode). In production each queue is consumed by its owning service.

/** `workflow-execution-recovery` — requeues executions whose lease expired. */
async function processWorkflowExecutionRecovery(
  data: Record<string, unknown>,
): Promise<void> {
  const executionId = data?.executionId as string | undefined;
  if (!executionId) {
    console.warn("[BullMQ] workflow-execution-recovery: missing executionId");
    return;
  }
  // P1-14: recoveryAttempt is forwarded by the dag-worker when it enqueues
  // the recovery job after a failed run. The original run is attempt 0;
  // first recovery is attempt 1, etc. The dag-worker caps this at
  // MAX_RECOVERY_ATTEMPTS (default 3) and moves the execution to the DLQ
  // with `recovery_exhausted` status instead of enqueuing another recovery.
  const recoveryAttempt =
    typeof data?.recoveryAttempt === "number"
      ? (data.recoveryAttempt as number)
      : 1;

  // Recovery is handled by re-enqueuing the workflow-execution job; the
  // DAG runner's checkpoint store will skip already-completed nodes.
  const execution = (await prisma.workflowExecution.findUnique({
    where: { id: executionId },
  })) as any;
  if (!execution) return;
  const workflow = (await prisma.workflow.findUnique({
    where: { id: execution.workflowId },
  })) as any;
  if (!workflow) return;
  const nodes = Array.isArray(workflow?.nodes) ? workflow.nodes : [];
  await jobQueue.addJob("workflow-execution", {
    executionId,
    workflowId: execution.workflowId,
    workflowName: execution.workflowName ?? workflow.name,
    nodes,
    triggerPayload: { _recoveryAttempt: recoveryAttempt },
    triggerType: "recovery",
  });
}

/** `billing-rollup` — aggregates usage events into UsageRollup rows. */
async function processBillingRollup(
  data: Record<string, unknown>,
): Promise<void> {
  // Real implementation lives in billing-service — import lazily so the
  // execution-service can boot even if billing-service isn't resolvable
  // (e.g. in unit tests that mock the queue).
  try {
    const { processBillingRollupJob } = await import("@longox/billing-service");
    await processBillingRollupJob(data as any);
  } catch (err) {
    console.warn(
      "[BullMQ] billing-rollup: billing-service processor unavailable, falling back to no-op:",
      (err as Error).message,
    );
    console.log("[BullMQ] billing-rollup placeholder:", JSON.stringify(data));
  }
}

/** `billing-reconciliation` — reconciles rollups against provider invoices. */
async function processBillingReconciliation(
  data: Record<string, unknown>,
): Promise<void> {
  try {
    const { processBillingReconciliationJob } =
      await import("@longox/billing-service");
    await processBillingReconciliationJob(data as any);
  } catch (err) {
    console.warn(
      "[BullMQ] billing-reconciliation: billing-service processor unavailable, falling back to no-op:",
      (err as Error).message,
    );
    console.log(
      "[BullMQ] billing-reconciliation placeholder:",
      JSON.stringify(data),
    );
  }
}

/** `notification-outbound` — delivers notifications (email/slack/webhook). */
async function processNotificationOutbound(
  data: Record<string, unknown>,
): Promise<void> {
  try {
    const { processNotificationOutboundJob } =
      await import("@longox/notification-service");
    await processNotificationOutboundJob(data as any);
  } catch (err) {
    console.warn(
      "[BullMQ] notification-outbound: notification-service processor unavailable, falling back to no-op:",
      (err as Error).message,
    );
    console.log(
      "[BullMQ] notification-outbound placeholder:",
      JSON.stringify(data),
    );
  }
}

/** `connector-install` — installs/registers a connector for a tenant. */
async function processConnectorInstall(
  data: Record<string, unknown>,
): Promise<void> {
  try {
    const { processConnectorInstallJob } =
      await import("@longox/connector-service");
    await processConnectorInstallJob(data as any);
  } catch (err) {
    console.warn(
      "[BullMQ] connector-install: connector-service processor unavailable, falling back to no-op:",
      (err as Error).message,
    );
    console.log(
      "[BullMQ] connector-install placeholder:",
      JSON.stringify(data),
    );
  }
}

/** `template-publish` — publishes a workflow template to the marketplace. */
async function processTemplatePublish(
  data: Record<string, unknown>,
): Promise<void> {
  try {
    const { processTemplatePublishJob } =
      await import("@longox/template-service");
    await processTemplatePublishJob(data as any);
  } catch (err) {
    console.warn(
      "[BullMQ] template-publish: template-service processor unavailable, falling back to no-op:",
      (err as Error).message,
    );
    console.log("[BullMQ] template-publish placeholder:", JSON.stringify(data));
  }
}

/** `audit-export` — generates an audit-log export (CSV/JSON). */
async function processAuditExport(
  data: Record<string, unknown>,
): Promise<void> {
  try {
    const { processAuditExportJob } = await import("@longox/audit-service");
    await processAuditExportJob(data as any);
  } catch (err) {
    console.warn(
      "[BullMQ] audit-export: audit-service processor unavailable, falling back to no-op:",
      (err as Error).message,
    );
    console.log("[BullMQ] audit-export placeholder:", JSON.stringify(data));
  }
}

/** Dispatch table — maps job name → processor. Used by the multi-queue worker. */
const JOB_PROCESSORS: Record<string, (data: any) => Promise<void>> = {
  "workflow-execution": (d) => processWorkflowExecution(d as WorkflowJobData),
  "workflow-execution-recovery": (d) =>
    processWorkflowExecutionRecovery(d as Record<string, unknown>),
  "webhook-delivery": (d) => processWebhookDelivery(d as WebhookJobData),
  "ai-run": (d) => processAiRun(d as AiRunJobData),
  "billing-rollup": (d) => processBillingRollup(d as Record<string, unknown>),
  "billing-reconciliation": (d) =>
    processBillingReconciliation(d as Record<string, unknown>),
  "notification-outbound": (d) =>
    processNotificationOutbound(d as Record<string, unknown>),
  "connector-install": (d) =>
    processConnectorInstall(d as Record<string, unknown>),
  "template-publish": (d) =>
    processTemplatePublish(d as Record<string, unknown>),
  "audit-export": (d) => processAuditExport(d as Record<string, unknown>),
};

// ─── Public API ────────────────────────────────────────────────────────────────

class BullMQJobQueue implements JobQueue {
  private workerStarted = false;
  /** Per-queue workers — BullMQ Workers are single-queue, so we maintain one
   *  Worker per named queue that this process is responsible for consuming. */
  private workers: Worker[] = [];

  async addJob(
    type: "workflow-execution",
    data: WorkflowJobData,
    maxAttempts?: number,
  ): Promise<void>;
  async addJob(
    type: "webhook-delivery",
    data: WebhookJobData,
    maxAttempts?: number,
  ): Promise<void>;
  async addJob(
    type: "ai-run",
    data: AiRunJobData,
    maxAttempts?: number,
  ): Promise<void>;
  async addJob(type: JobType, data: any, maxAttempts?: number): Promise<void> {
    const q = resolveQueue(type);
    const opts: JobsOptions = maxAttempts
      ? { attempts: maxAttempts, backoff: { type: "exponential", delay: 1000 } }
      : {};
    // BullMQ `Queue#add(name, data, opts)` enqueues a job whose `name` is
    // used by the worker's switch statement; the queue itself is the topology
    // boundary. We keep the job name equal to the JobType so the dispatch
    // table can route it to the right processor.
    await q.add(type, data, opts);
  }

  async addDelayedJob(
    type: JobType,
    data: any,
    delayMs: number,
    maxAttempts?: number,
  ): Promise<void> {
    const q = resolveQueue(type);
    const opts: JobsOptions = {
      delay: delayMs,
      attempts: maxAttempts ?? 3,
      backoff: { type: "exponential", delay: 1000 },
    };
    await q.add(type, data, opts);
  }

  async addScheduledJob(
    type: JobType,
    data: any,
    cronExpression: string,
    maxAttempts?: number,
  ): Promise<void> {
    const q = resolveQueue(type);
    const opts: JobsOptions = {
      repeat: { pattern: cronExpression },
      attempts: maxAttempts ?? 3,
      backoff: { type: "exponential", delay: 1000 },
    };
    await q.add(type, data, opts);
  }

  async start(): Promise<void> {
    if (this.workerStarted) return;

    await this.recoverInterruptedJobs();

    const tracer = trace.getTracer("execution-worker");
    const concurrency = parseInt(process.env["WORKER_CONCURRENCY"] ?? "5", 10);

    // Spawn one Worker per named queue. Each worker shares the same job
    // dispatch table (JOB_PROCESSORS) so it can route the job to its handler.
    // In production, services that own specific queues (billing, notification,
    // etc.) override this by spinning up their own worker that consumes only
    // their queue; this default starts workers for ALL queues for dev/single-
    // process mode. Override with WORKER_QUEUES=comma-separated list.
    const workerQueuesRaw =
      process.env["WORKER_QUEUES"] ?? ALL_QUEUE_NAMES.join(",");
    const workerQueues = workerQueuesRaw
      .split(",")
      .map((s) => s.trim())
      .filter((s): s is QueueName => (ALL_QUEUE_NAMES as string[]).includes(s));

    for (const queueName of workerQueues) {
      const topology = QUEUE_TOPOLOGY[queueName];
      const connection = createRedisConnection(topology.redisDb);
      const worker = new Worker(
        queueName,
        async (job) => {
          const startTime = Date.now();
          return tracer.startActiveSpan(
            `bullmq.job.${job.name}`,
            {
              attributes: {
                "bullmq.job.id": job.id ?? "unknown",
                "bullmq.job.name": job.name,
                "bullmq.job.queue": queueName,
                "bullmq.job.attempt": job.attemptsMade,
              },
            },
            async (span) => {
              try {
                const processor = JOB_PROCESSORS[job.name];
                if (!processor) {
                  console.warn(
                    `[BullMQ] Unknown job type: ${job.name} (queue ${queueName})`,
                  );
                } else {
                  await processor(job.data);
                }

                const duration = Date.now() - startTime;
                span.setStatus({ code: SpanStatusCode.OK });
                span.setAttribute("bullmq.job.duration_ms", duration);

                recordJobCompleted(job.name, duration);
                return { duration };
              } catch (error) {
                span.setStatus({
                  code: SpanStatusCode.ERROR,
                  message:
                    error instanceof Error ? error.message : "Unknown error",
                });
                span.recordException(error as Error);
                recordJobFailed(
                  job.name,
                  error instanceof Error ? error.message : "unknown",
                );
                throw error;
              } finally {
                span.end();
              }
            },
          );
        },
        {
          connection: connection as any,
          concurrency,
          ...(topology.limiter
            ? {
                limiter: {
                  max: topology.limiter.max,
                  duration: topology.limiter.duration,
                },
              }
            : {}),
        },
      );

      worker.on("completed", (job) => {
        console.log(
          `[BullMQ] Job ${job.id} (${job.name} @ ${queueName}) completed`,
        );
        this.getStats().then((stats) => {
          updateQueueDepth(stats.waiting, stats.active);
        });
      });

      worker.on("failed", (job, err) => {
        console.error(
          `[BullMQ] Job ${job?.id} (${job?.name} @ ${queueName}) failed:`,
          err.message,
        );
        if (job && job.attemptsMade < (job.opts.attempts ?? 1)) {
          recordJobRetried(job.name, job.attemptsMade + 1);
        }
      });

      worker.on("error", (err) => {
        console.error(`[BullMQ] Worker error on ${queueName}:`, err);
      });

      this.workers.push(worker);
    }

    this.workerStarted = true;
    console.log(
      `[BullMQ] Workers started for queues: ${workerQueues.join(", ")} (concurrency ${concurrency})`,
    );
  }

  async stop(): Promise<void> {
    for (const w of this.workers) {
      await w.close();
    }
    this.workers = [];
    for (const q of queueCache.values()) {
      await q.close();
    }
    queueCache.clear();
    if (legacyQueue) {
      await legacyQueue.close();
      legacyQueue = null;
    }
    // Leave Redis connections open — other modules may still be using them.
    this.workerStarted = false;
  }

  async getStats() {
    // Aggregate stats across all named queues that have been instantiated.
    const queues = [
      ...queueCache.values(),
      ...(legacyQueue ? [legacyQueue] : []),
    ];
    if (queues.length === 0) {
      return { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 };
    }
    const perQueue = await Promise.all(
      queues.map(async (q) => ({
        waiting: await q.getWaitingCount(),
        active: await q.getActiveCount(),
        completed: await q.getCompletedCount(),
        failed: await q.getFailedCount(),
        delayed: await q.getDelayedCount(),
      })),
    );
    return perQueue.reduce(
      (acc, s) => ({
        waiting: acc.waiting + s.waiting,
        active: acc.active + s.active,
        completed: acc.completed + s.completed,
        failed: acc.failed + s.failed,
        delayed: acc.delayed + s.delayed,
      }),
      { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 },
    );
  }

  private async recoverInterruptedJobs(): Promise<void> {
    await new Promise((r) => setTimeout(r, 1000));
    try {
      const pendingExecutions = await prisma.workflowExecution.findMany({
        where: { status: { in: ["pending", "running"] } } as any,
        orderBy: { startedAt: "asc" },
      });

      if (pendingExecutions.length > 0) {
        console.log(
          `[BullMQ] Recovering ${pendingExecutions.length} interrupted executions`,
        );
      }

      for (const exec of pendingExecutions) {
        const workflow = await prisma.workflow.findUnique({
          where: { id: (exec as any).workflowId },
        });

        if (workflow) {
          const nodes = Array.isArray((workflow as any).nodes)
            ? ((workflow as any).nodes as any[])
            : [];
          await this.addJob("workflow-execution", {
            executionId: exec.id,
            workflowId: (exec as any).workflowId,
            workflowName: (exec as any).workflowName ?? workflow.name,
            nodes,
            triggerPayload: {},
            triggerType: "recovery",
          });
        } else {
          await prisma.workflowExecution.update({
            where: { id: exec.id },
            data: {
              status: "failed",
              errorMessage: "Workflow no longer exists",
              finishedAt: new Date(),
            } as any,
          });
        }
      }
    } catch (err) {
      console.error("[BullMQ] Recovery error:", err);
    }
  }
}

export const jobQueue: JobQueue = new BullMQJobQueue();

// ─── startWorkflowExecution ───────────────────────────────────────────────────

export async function startWorkflowExecution(
  workflowId: string,
  workflowName: string,
  nodes: WorkflowNode[],
  triggerType: "manual" | "webhook" | "schedule" | "api" | "recovery",
  triggerPayload: Record<string, unknown> = {},
): Promise<any> {
  const execution = await prisma.workflowExecution.create({
    data: {
      workflowId,
      status: "pending",
      startedAt: new Date(),
      // Drizzle-compat fields stored alongside canonical Prisma fields.
      ...({
        workflowName,
        steps: [],
        triggerType,
      } as any),
    } as any,
  });

  await prisma.workflow.update({
    where: { id: workflowId },
    data: {
      executionCount: { increment: 1 },
      lastRunAt: new Date(),
      lastRunStatus: "running",
    } as any,
  });

  await writeAudit(
    "execution.started",
    "workflow",
    String(workflowId),
    { executionId: execution.id, triggerType, workflowName },
    triggerType === "webhook" ? "webhook" : "user",
  );

  publishEvent({
    type: "execution.started",
    aggregateId: String(execution.id),
    aggregateType: "execution",
    payload: { workflowId, workflowName, triggerType },
    actorId: String(0),
    actorType: triggerType === "webhook" ? "webhook" : "system",
  });

  if (nodes.length > 0) {
    const latest = await prisma.workflowVersion.findFirst({
      where: { workflowId },
      orderBy: { versionNumber: "desc" },
      select: { versionNumber: true },
    });
    const nextVersion = (latest?.versionNumber ?? 0) + 1;
    if (nextVersion <= 1 || nodes.length > 0) {
      await prisma.workflowVersion
        .create({
          data: {
            workflowId,
            versionNumber: nextVersion,
            graphJson: { nodes, name: workflowName } as any,
            checksum: "",
            // Drizzle-compat fields stored alongside canonical Prisma fields.
            ...({
              version: nextVersion,
              name: workflowName,
              nodes,
              changeNote: `Auto-snapshot on execution (${triggerType})`,
            } as any),
          } as any,
        })
        .catch(() => {
          // onConflictDoNothing() equivalent — ignore duplicate version conflicts.
        });
    }
  }

  await jobQueue.addJob(
    "workflow-execution",
    {
      executionId: execution.id,
      workflowId,
      workflowName,
      nodes,
      triggerPayload,
      triggerType,
    },
    3,
  );

  return execution;
}

async function addWorkflowJob(
  workflowId: string,
  workflowName: string,
  nodes: any[],
  triggerType: string,
  triggerPayload: Record<string, unknown>,
): Promise<void> {
  await startWorkflowExecution(
    workflowId,
    workflowName,
    nodes,
    triggerType as any,
    triggerPayload,
  );
}

// ─── Enqueue helper for child workflows (spawned mid-DAG-run) ────────────────
// Looks up the target workflow's latest published nodes/edges and enqueues a
// new execution job, tagging it with parentExecutionId so the runner can link
// child -> parent executions (used by dag-worker.ts's spawnChildWorkflow).
export async function enqueueWorkflow(opts: {
  workflowId: string;
  triggerPayload?: Record<string, unknown>;
  triggerType?:
    | "manual"
    | "webhook"
    | "schedule"
    | "api"
    | "recovery"
    | "child_workflow";
  parentExecutionId?: string;
}): Promise<string> {
  const { workflowId, triggerPayload = {}, parentExecutionId } = opts;

  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId },
  });

  if (!workflow) {
    throw new Error(`enqueueWorkflow: workflow ${workflowId} not found`);
  }

  const execution = await prisma.workflowExecution.create({
    data: {
      workflowId,
      status: "pending",
      startedAt: new Date(),
      // Drizzle-compat fields stored alongside canonical Prisma fields.
      ...({
        workflowName: workflow.name,
        steps: [],
        parentExecutionId: parentExecutionId ?? null,
      } as any),
    } as any,
  });

  await writeAudit(
    "execution.started",
    "workflow",
    String(workflowId),
    {
      executionId: execution.id,
      parentExecutionId,
      workflowName: workflow.name,
    },
    "system",
  );

  await jobQueue.addJob(
    "workflow-execution",
    {
      executionId: execution.id,
      workflowId,
      workflowName: workflow.name,
      nodes: (workflow as any).nodes ?? [],
      triggerPayload,
      triggerType: "child_workflow",
      parentExecutionId,
    },
    3,
  );

  return execution.id;
}
