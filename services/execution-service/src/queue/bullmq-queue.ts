import { Queue, Worker, JobsOptions } from "bullmq";
import IORedis from "ioredis";
import { eq, sql } from "drizzle-orm";
import { trace, SpanStatusCode } from "@opentelemetry/api";
import type {
  AiRunJobData,
  JobQueue,
  JobType,
  WebhookJobData,
  WorkflowJobData,
} from "@longox/shared-queue";
import { DEFAULT_RETRY_POLICY } from "@longox/shared-queue";
import { publishEvent } from "@longox/shared-realtime";
import {
  db,
  executionsTable,
  executionCheckpointsTable,
  dlqEntriesTable,
  auditLogTable,
  workflowVersionsTable,
  workflowsTable,
  usageEventsTable,
} from "@longox/db";
import { createExecutors, findExecutor } from "../executors/registry";
import {
  recordJobCompleted,
  recordJobFailed,
  recordJobRetried,
  recordNodeExecution,
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

function createRedisConnection(): IORedis {
  const url = process.env["REDIS_URL"] ?? "redis://localhost:6379";
  return new IORedis(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
}

// ─── Queue ─────────────────────────────────────────────────────────────────────

const QUEUE_NAME = "longox:executions";

const defaultJobOptions: JobsOptions = {
  attempts: DEFAULT_RETRY_POLICY.attempts,
  backoff: {
    type: DEFAULT_RETRY_POLICY.backoffType,
    delay: DEFAULT_RETRY_POLICY.backoffDelayMs,
  },
  removeOnComplete: { age: 3600, count: 100 },
  removeOnFail: { age: 86400, count: 500 },
};

let queue: Queue | null = null;
let worker: Worker | null = null;

function getQueue(): Queue {
  if (!queue) {
    queue = new Queue(QUEUE_NAME, {
      connection: createRedisConnection(),
      defaultJobOptions,
    });
  }
  return queue;
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
  await db.insert(auditLogTable).values({
    action,
    resourceType,
    resourceId,
    actorType,
    actorId: actorId ?? null,
    metadata: metadata ?? null,
  });
}

function maxAttemptsForNode(nodeTypeId: string): number {
  return nodeTypeId.startsWith("trigger.") ? 1 : 2;
}

function sortNodes(nodes: any[]): any[] {
  return [...nodes].sort(
    (a, b) => (a.position?.x ?? 0) - (b.position?.x ?? 0),
  );
}

// ─── Core runner (executes workflow nodes sequentially) ───────────────────────

interface WorkflowNode {
  id: string;
  name: string;
  type?: string;
  nodeTypeId?: string;
  position?: { x: number; y: number };
  config?: Record<string, unknown>;
}

export async function runWorkflow(
  executionId: number,
  workflowId: number,
  workflowName: string,
  nodes: WorkflowNode[],
  triggerPayload: Record<string, unknown> = {},
  triggerType = "manual",
): Promise<void> {
  const sorted = sortNodes(nodes);

  let currentInput: Record<string, unknown> = {
    ...triggerPayload,
    _triggerType: triggerType,
  };
  let failed = false;

  const checkpoints = await db
    .select()
    .from(executionCheckpointsTable)
    .where(eq(executionCheckpointsTable.executionId, executionId))
    .orderBy(executionCheckpointsTable.startedAt);

  const completedNodeIds = new Set(
    checkpoints
      .filter((c) => c.status === "success")
      .map((c) => c.nodeId),
  );

  const successfulCheckpoints = checkpoints.filter(
    (c) => c.status === "success",
  );
  if (successfulCheckpoints.length > 0) {
    const lastCompleted =
      successfulCheckpoints[successfulCheckpoints.length - 1];
    if (lastCompleted.outputData) {
      currentInput = {
        ...((lastCompleted.outputData ?? {}) as Record<string, unknown>),
        _prevNode: lastCompleted.nodeId,
      };
    }
  }

  for (const node of sorted) {
    if (completedNodeIds.has(node.id)) {
      continue;
    }

    const nodeTypeId = node.nodeTypeId ?? node.type ?? "action.http";
    const executor = findExecutor(executors, nodeTypeId);
    const maxAttempts = maxAttemptsForNode(nodeTypeId);

    if (!executor) {
      await db.insert(dlqEntriesTable).values({
        executionId,
        workflowId,
        workflowName,
        nodeId: node.id,
        nodeName: node.name,
        nodeType: nodeTypeId,
        errorMessage: `No executor found for node type "${nodeTypeId}"`,
        attempts: 1,
        jobData: { nodeTypeId, config: node.config ?? {}, lastInput: currentInput },
      });

      await db
        .update(executionsTable)
        .set({
          status: "failed",
          finishedAt: new Date(),
          errorMessage: `Node "${node.name}" failed: no executor for "${nodeTypeId}"`,
        })
        .where(eq(executionsTable.id, executionId));

      await db
        .update(workflowsTable)
        .set({ lastRunStatus: "failed", lastRunAt: new Date() })
        .where(eq(workflowsTable.id, workflowId));

      failed = true;
      break;
    }

    let lastError: string | null = null;
    let succeeded = false;
    let finalOutput: Record<string, unknown> | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const startedAt = new Date();

      const [checkpoint] = await db
        .insert(executionCheckpointsTable)
        .values({
          executionId,
          nodeId: node.id,
          nodeName: node.name,
          nodeType: nodeTypeId,
          status: "running",
          attemptNumber: attempt,
          inputData: currentInput,
          startedAt,
        })
        .returning();

      const result = await executor.execute(
        node,
        {
          executionId,
          workflowId,
          workflowName,
          triggerType,
          triggerPayload,
          variables: {},
          startedAt: new Date(),
        },
        currentInput,
      );
      const duration = Date.now() - startedAt.getTime();

      if (result.status === "success") {
        finalOutput = result.output;
        await db
          .update(executionCheckpointsTable)
          .set({
            status: "success",
            outputData: result.output,
            completedAt: new Date(),
            durationMs: result.durationMs || duration,
          })
          .where(eq(executionCheckpointsTable.id, checkpoint.id));
        succeeded = true;
        break;
      }

      lastError = result.error ?? "Unknown error";
      await db
        .update(executionCheckpointsTable)
        .set({
          status: "failed",
          errorMessage: lastError,
          completedAt: new Date(),
          durationMs: result.durationMs || duration,
        })
        .where(eq(executionCheckpointsTable.id, checkpoint.id));

      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 500 * attempt));
      }
    }

    if (!succeeded) {
      await db.insert(dlqEntriesTable).values({
        executionId,
        workflowId,
        workflowName,
        nodeId: node.id,
        nodeName: node.name,
        nodeType: nodeTypeId,
        errorMessage: lastError ?? "Unknown error",
        attempts: maxAttempts,
        jobData: {
          nodeTypeId,
          config: node.config ?? {},
          lastInput: currentInput,
        },
      });

      await writeAudit(
        "execution.node_failed",
        "execution",
        String(executionId),
        {
          nodeId: node.id,
          nodeName: node.name,
          nodeType: nodeTypeId,
          error: lastError,
        },
      );

      await db
        .update(executionsTable)
        .set({
          status: "failed",
          finishedAt: new Date(),
          durationMs: sql`EXTRACT(EPOCH FROM (NOW() - ${executionsTable.startedAt})) * 1000`,
          errorMessage: `Node "${node.name}" failed after ${maxAttempts} attempt(s): ${lastError}`,
        })
        .where(eq(executionsTable.id, executionId));

      await db
        .update(workflowsTable)
        .set({ lastRunStatus: "failed", lastRunAt: new Date() })
        .where(eq(workflowsTable.id, workflowId));

      await writeAudit("execution.failed", "execution", String(executionId), {
        workflowId,
        failedNode: node.name,
        error: lastError,
      });
      failed = true;
      break;
    }

    if (finalOutput) {
      currentInput = { ...finalOutput, _prevNode: node.id };
    }
  }

  if (!failed) {
    const [exec] = await db
      .select()
      .from(executionsTable)
      .where(eq(executionsTable.id, executionId));
    const durationMs = exec ? Date.now() - exec.startedAt.getTime() : 0;

    await db
      .update(executionsTable)
      .set({ status: "success", finishedAt: new Date(), durationMs })
      .where(eq(executionsTable.id, executionId));
    await db
      .update(workflowsTable)
      .set({ lastRunStatus: "success", lastRunAt: new Date() })
      .where(eq(workflowsTable.id, workflowId));
    await writeAudit("execution.completed", "execution", String(executionId), {
      workflowId,
      workflowName,
      durationMs,
    });

    try {
      await db.insert(usageEventsTable).values({
        workflowId,
        workflowName,
        eventType: "workflow.run",
        quantity: 1,
        metadata: {
          executionId,
          durationMs,
          nodeCount: sorted.length,
          triggerType,
        },
      });
    } catch {
      // Non-fatal
    }

    publishEvent({
      type: "execution.completed",
      aggregateId: String(executionId),
      aggregateType: "execution",
      payload: { workflowId, workflowName, triggerType, durationMs },
      actorId: "0",
      actorType: "system",
    });
  }
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

  await db
    .update(executionsTable)
    .set({ status: "running" })
    .where(eq(executionsTable.id, executionId));

  await runWorkflow(
    executionId,
    workflowId,
    workflowName,
    nodes,
    triggerPayload,
    triggerType,
  );
}

async function processWebhookDelivery(data: WebhookJobData): Promise<void> {
  const { workflowId, payload } = data;
  const [workflow] = await db
    .select()
    .from(workflowsTable)
    .where(eq(workflowsTable.id, workflowId))
    .limit(1);

  if (workflow) {
    const nodes = Array.isArray(workflow.nodes) ? (workflow.nodes as any[]) : [];
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
      executionId: 0,
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

// ─── Public API ────────────────────────────────────────────────────────────────

class BullMQJobQueue implements JobQueue {
  private workerStarted = false;

  async addJob(type: "workflow-execution", data: WorkflowJobData, maxAttempts?: number): Promise<void>;
  async addJob(type: "webhook-delivery", data: WebhookJobData, maxAttempts?: number): Promise<void>;
  async addJob(type: "ai-run", data: AiRunJobData, maxAttempts?: number): Promise<void>;
  async addJob(type: JobType, data: any, maxAttempts?: number): Promise<void> {
    const q = getQueue();
    const opts: JobsOptions = maxAttempts
      ? { attempts: maxAttempts, backoff: { type: "exponential", delay: 1000 } }
      : {};
    await q.add(type, data, opts);
  }

  async addDelayedJob(type: JobType, data: any, delayMs: number, maxAttempts?: number): Promise<void> {
    const q = getQueue();
    const opts: JobsOptions = {
      delay: delayMs,
      attempts: maxAttempts ?? 3,
      backoff: { type: "exponential", delay: 1000 },
    };
    await q.add(type, data, opts);
  }

  async addScheduledJob(type: JobType, data: any, cronExpression: string, maxAttempts?: number): Promise<void> {
    const q = getQueue();
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

    const connection = createRedisConnection();
    const tracer = trace.getTracer("execution-worker");

    worker = new Worker(
      QUEUE_NAME,
      async (job) => {
        const startTime = Date.now();
        
        // Create a span for the job
        return tracer.startActiveSpan(
          `bullmq.job.${job.name}`,
          {
            attributes: {
              "bullmq.job.id": job.id ?? "unknown",
              "bullmq.job.name": job.name,
              "bullmq.job.attempt": job.attemptsMade,
            },
          },
          async (span) => {
            try {
              switch (job.name) {
                case "workflow-execution":
                  await processWorkflowExecution(job.data as WorkflowJobData);
                  break;
                case "webhook-delivery":
                  await processWebhookDelivery(job.data as WebhookJobData);
                  break;
                case "ai-run":
                  await processAiRun(job.data as AiRunJobData);
                  break;
                default:
                  console.warn(`[BullMQ] Unknown job type: ${job.name}`);
              }

              const duration = Date.now() - startTime;
              span.setStatus({ code: SpanStatusCode.OK });
              span.setAttribute("bullmq.job.duration_ms", duration);
              
              // Record metrics
              recordJobCompleted(job.name, duration);
              
              return { duration };
            } catch (error) {
              span.setStatus({
                code: SpanStatusCode.ERROR,
                message: error instanceof Error ? error.message : "Unknown error",
              });
              span.recordException(error as Error);
              
              // Record failure metrics
              recordJobFailed(job.name, error instanceof Error ? error.message : "unknown");
              
              throw error;
            } finally {
              span.end();
            }
          }
        );
      },
      {
        connection,
        concurrency: parseInt(process.env["WORKER_CONCURRENCY"] ?? "5", 10),
        limiter: {
          max: 100,
          duration: 60_000,
        },
      },
    );

    worker.on("completed", (job) => {
      console.log(`[BullMQ] Job ${job.id} (${job.name}) completed`);
      
      // Update queue depth metrics
      this.getStats().then((stats) => {
        updateQueueDepth(stats.waiting, stats.active);
      });
    });

    worker.on("failed", (job, err) => {
      console.error(
        `[BullMQ] Job ${job?.id} (${job?.name}) failed:`,
        err.message,
      );
      
      // Record retry metrics if job will be retried
      if (job && job.attemptsMade < (job.opts.attempts ?? 1)) {
        recordJobRetried(job.name, job.attemptsMade + 1);
      }
    });

    worker.on("error", (err) => {
      console.error("[BullMQ] Worker error:", err);
    });

    this.workerStarted = true;
    console.log("[BullMQ] Worker started with concurrency", process.env["WORKER_CONCURRENCY"] ?? "5");
  }

  async stop(): Promise<void> {
    if (worker) {
      await worker.close();
      worker = null;
    }
    if (queue) {
      await queue.close();
      queue = null;
    }
    this.workerStarted = false;
  }

  async getStats() {
    const q = getQueue();
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      q.getWaitingCount(),
      q.getActiveCount(),
      q.getCompletedCount(),
      q.getFailedCount(),
      q.getDelayedCount(),
    ]);
    return { waiting, active, completed, failed, delayed };
  }

  private async recoverInterruptedJobs(): Promise<void> {
    await new Promise((r) => setTimeout(r, 1000));
    try {
      const pendingExecutions = await db
        .select()
        .from(executionsTable)
        .where(sql`${executionsTable.status} IN ('pending', 'running')`)
        .orderBy(executionsTable.startedAt);

      if (pendingExecutions.length > 0) {
        console.log(
          `[BullMQ] Recovering ${pendingExecutions.length} interrupted executions`,
        );
      }

      for (const exec of pendingExecutions) {
        const [workflow] = await db
          .select()
          .from(workflowsTable)
          .where(eq(workflowsTable.id, exec.workflowId))
          .limit(1);

        if (workflow) {
          const nodes = Array.isArray(workflow.nodes)
            ? (workflow.nodes as any[])
            : [];
          await this.addJob("workflow-execution", {
            executionId: exec.id,
            workflowId: exec.workflowId,
            workflowName: exec.workflowName,
            nodes,
            triggerPayload: {},
            triggerType: "recovery",
          });
        } else {
          await db
            .update(executionsTable)
            .set({
              status: "failed",
              errorMessage: "Workflow no longer exists",
              finishedAt: new Date(),
            })
            .where(eq(executionsTable.id, exec.id));
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
  workflowId: number,
  workflowName: string,
  nodes: WorkflowNode[],
  triggerType: "manual" | "webhook" | "schedule" | "api" | "recovery",
  triggerPayload: Record<string, unknown> = {},
): Promise<typeof executionsTable.$inferSelect> {
  const [execution] = await db
    .insert(executionsTable)
    .values({
      workflowId,
      workflowName,
      status: "pending",
      startedAt: new Date(),
      steps: [],
    })
    .returning();

  await db
    .update(workflowsTable)
    .set({
      executionCount: sql`${workflowsTable.executionCount} + 1`,
      lastRunAt: new Date(),
      lastRunStatus: "running",
    })
    .where(eq(workflowsTable.id, workflowId));

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
    const existing = await db
      .select({ version: workflowVersionsTable.version })
      .from(workflowVersionsTable)
      .where(eq(workflowVersionsTable.workflowId, workflowId))
      .orderBy(sql`${workflowVersionsTable.version} DESC`)
      .limit(1);
    const nextVersion = (existing[0]?.version ?? 0) + 1;
    if (nextVersion <= 1 || nodes.length > 0) {
      await db
        .insert(workflowVersionsTable)
        .values({
          workflowId,
          version: nextVersion,
          name: workflowName,
          nodes,
          changeNote: `Auto-snapshot on execution (${triggerType})`,
        })
        .onConflictDoNothing();
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
  workflowId: number,
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
