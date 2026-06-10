import { publishEvent } from "@longox/shared-realtime";
import { db, executionsTable, workflowsTable } from "@longox/db";
import { eq, sql } from "drizzle-orm";
import { logger } from "@longox/shared-logger";
import { CheckpointManager } from "../checkpointing/checkpoint-manager";
import { DeadLetterQueue } from "../dlq/dead-letter-queue";
import { WorkflowRunner } from "@longox/workflow-engine";
import {
  HttpExecutor,
  SlackExecutor,
  EmailExecutor,
  DbQueryExecutor,
  TriggerExecutor,
  ConditionExecutor,
  TransformExecutor,
  AiExecutor,
  ApprovalExecutor,
  CodeExecutor,
} from "../executors";

export interface QueueJob {
  id: string;
  type: "workflow-execution" | "webhook-delivery" | "ai-run";
  data: Record<string, unknown>;
  attempts: number;
  maxAttempts: number;
}

export class JobQueue {
  private queue: QueueJob[] = [];
  private activeWorkers = 0;
  private maxConcurrency = 5;
  private runner: WorkflowRunner;
  private checkpointManager: CheckpointManager;
  private deadLetterQueue: DeadLetterQueue;
  private processing = false;

  constructor() {
    this.runner = new WorkflowRunner();
    this.checkpointManager = new CheckpointManager();
    this.deadLetterQueue = new DeadLetterQueue();

    this.runner.registerExecutor(new TriggerExecutor());
    this.runner.registerExecutor(new HttpExecutor());
    this.runner.registerExecutor(new SlackExecutor());
    this.runner.registerExecutor(new EmailExecutor());
    this.runner.registerExecutor(new DbQueryExecutor());
    this.runner.registerExecutor(new AiExecutor());
    this.runner.registerExecutor(new ConditionExecutor());
    this.runner.registerExecutor(new TransformExecutor());
    this.runner.registerExecutor(new ApprovalExecutor());
    this.runner.registerExecutor(new CodeExecutor());
  }

  async start(): Promise<void> {
    await this.recoverJobs();
  }

  private async recoverJobs(): Promise<void> {
    try {
      const pendingExecutions = await db
        .select()
        .from(executionsTable)
        .where(sql`${executionsTable.status} IN ('pending', 'running')`)
        .orderBy(executionsTable.startedAt);

      if (pendingExecutions.length > 0) {
        logger.info(
          `[Queue] Recovered ${pendingExecutions.length} interrupted executions`,
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
          this.addJob("workflow-execution", {
            executionId: exec.id,
            workflowId: exec.workflowId,
            workflowName: exec.workflowName,
            nodes,
            triggerPayload: {},
            triggerType: "manual",
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
      logger.error({ err }, "[Queue] Recovery error");
    }
  }

  addJob(
    type: QueueJob["type"],
    data: Record<string, unknown>,
    maxAttempts = 3,
  ): void {
    const job: QueueJob = {
      id: `${type}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type,
      data,
      attempts: 0,
      maxAttempts,
    };
    this.queue.push(job);
    logger.info({ jobId: job.id, type }, "[Queue] Job added");
    this.processNext();
  }

  private processNext(): void {
    if (this.processing) return;
    this.processing = true;

    while (this.activeWorkers < this.maxConcurrency && this.queue.length > 0) {
      const job = this.queue.shift()!;
      this.activeWorkers++;
      this.executeJob(job).finally(() => {
        this.activeWorkers--;
        this.processing = false;
        this.processNext();
      });
    }

    this.processing = false;
  }

  private async executeJob(job: QueueJob): Promise<void> {
    job.attempts++;
    logger.info(
      { jobId: job.id, type: job.type, attempt: job.attempts },
      "[Queue] Executing job",
    );

    try {
      if (job.type === "workflow-execution") {
        await this.executeWorkflow(job);
      } else if (job.type === "webhook-delivery") {
        await this.executeWebhook(job);
      } else if (job.type === "ai-run") {
        await this.executeAiRun(job);
      }
    } catch (err) {
      await this.handleJobFailure(job, err);
    }
  }

  private async executeWorkflow(job: QueueJob): Promise<void> {
    const {
      executionId,
      workflowId,
      workflowName,
      nodes,
      triggerPayload,
      triggerType,
    } = job.data as {
      executionId: number;
      workflowId: number;
      workflowName: string;
      nodes: any[];
      triggerPayload: Record<string, unknown>;
      triggerType: string;
    };

    await db
      .update(executionsTable)
      .set({ status: "running" })
      .where(eq(executionsTable.id, executionId));

    const sortedNodes = [...nodes].sort(
      (a, b) => (a.position?.x ?? 0) - (b.position?.x ?? 0),
    );

    const results = await this.runner.run(
      {
        nodes: sortedNodes,
        edges:
          sortedNodes.length > 1
            ? sortedNodes.slice(1).map((n, i) => ({
                id: `e-${i}`,
                source: sortedNodes[i].id,
                target: n.id,
              }))
            : [],
      },
      {
        executionId,
        workflowId,
        workflowName,
        triggerType,
        triggerPayload,
        variables: {},
        startedAt: new Date(),
      },
      {
        maxRetries: 2,
        retryDelayMs: 500,
        checkpointCallback: async (result) => {
          if (result.status === "success") {
            await this.checkpointManager.saveCheckpoint({
              executionId,
              nodeId: result.nodeId,
              nodeName: result.nodeName,
              nodeType: result.nodeType,
              status: "success",
              attemptNumber: result.attemptNumber,
              inputData: {},
              outputData: result.output,
            });
          }
        },
      },
    );

    const allSucceeded = results.every((r) => r.status === "success");

    if (allSucceeded) {
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

      logger.info(
        { executionId, workflowId, durationMs },
        "[Queue] Workflow completed successfully",
      );

      publishEvent({
        type: "execution.completed",
        aggregateId: String(executionId),
        aggregateType: "execution",
        payload: { workflowId, workflowName, durationMs, triggerType },
      });
    } else {
      const failedResult = results.find((r) => r.status === "failed");
      await db
        .update(executionsTable)
        .set({
          status: "failed",
          finishedAt: new Date(),
          errorMessage: `Node "${failedResult?.nodeName}" failed: ${failedResult?.error}`,
        })
        .where(eq(executionsTable.id, executionId));

      await db
        .update(workflowsTable)
        .set({ lastRunStatus: "failed", lastRunAt: new Date() })
        .where(eq(workflowsTable.id, workflowId));

      publishEvent({
        type: "execution.failed",
        aggregateId: String(executionId),
        aggregateType: "execution",
        payload: {
          workflowId,
          workflowName,
          error: failedResult?.error,
          triggerType,
        },
      });
    }
  }

  private async executeWebhook(job: QueueJob): Promise<void> {
    const { workflowId, payload } = job.data as {
      workflowId: number;
      payload: Record<string, unknown>;
    };

    const [workflow] = await db
      .select()
      .from(workflowsTable)
      .where(eq(workflowsTable.id, workflowId))
      .limit(1);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const nodes = Array.isArray(workflow.nodes)
      ? (workflow.nodes as any[])
      : [];
    const [execution] = await db
      .insert(executionsTable)
      .values({
        workflowId,
        workflowName: workflow.name,
        status: "pending",
        startedAt: new Date(),
        steps: [],
      })
      .returning();

    await this.executeWorkflow({
      ...job,
      data: {
        executionId: execution.id,
        workflowId,
        workflowName: workflow.name,
        nodes,
        triggerPayload: payload,
        triggerType: "webhook",
      },
    });
  }

  private async executeAiRun(job: QueueJob): Promise<void> {
    const { nodeTypeId, config, input, workflowId } = job.data as {
      nodeTypeId: string;
      config: Record<string, unknown>;
      input: Record<string, unknown>;
      workflowId: number;
    };

    const aiExecutor = new AiExecutor();
    const result = await aiExecutor.execute(
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

  private async handleJobFailure(job: QueueJob, err: unknown): Promise<void> {
    const errMsg = err instanceof Error ? err.message : String(err);

    if (job.attempts < job.maxAttempts) {
      const delay = Math.min(1000 * Math.pow(2, job.attempts - 1), 30_000);
      logger.warn(
        { jobId: job.id, attempt: job.attempts, delay, err: errMsg },
        "[Queue] Job failed, scheduling retry",
      );

      setTimeout(() => {
        this.queue.push(job);
        this.processNext();
      }, delay);
    } else {
      logger.error(
        { jobId: job.id, err: errMsg },
        "[Queue] Job failed after max retries",
      );

      if (job.type === "workflow-execution") {
        const { executionId, workflowId } = job.data as {
          executionId: number;
          workflowId: number;
        };

        await this.deadLetterQueue.addEntry({
          executionId,
          workflowId,
          workflowName: String(job.data.workflowName ?? ""),
          nodeId: "",
          nodeName: "workflow",
          nodeType: "workflow-execution",
          errorMessage: `Job failed after ${job.maxAttempts} attempts: ${errMsg}`,
          attempts: job.attempts,
          jobData: job.data,
        });

        await db
          .update(executionsTable)
          .set({
            status: "failed",
            finishedAt: new Date(),
            errorMessage: errMsg,
          })
          .where(eq(executionsTable.id, executionId));

        await db
          .update(workflowsTable)
          .set({ lastRunStatus: "failed", lastRunAt: new Date() })
          .where(eq(workflowsTable.id, workflowId));
      }
    }
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  getActiveWorkers(): number {
    return this.activeWorkers;
  }
}

export const jobQueue = new JobQueue();
