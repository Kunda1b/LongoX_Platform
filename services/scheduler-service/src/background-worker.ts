import { db, executionsTable, workflowsTable } from "@longox/db";
import { eq, sql } from "drizzle-orm";
import { PostgresScheduleRepository } from "./infrastructure";
import { CronParser } from "./infrastructure/cron-parser";
import { logger } from "@longox/shared-logger";
import { publishEvent } from "@longox/shared-realtime";

export class ScheduleWorker {
  private repo: PostgresScheduleRepository;
  private cronParser: CronParser;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private running = false;

  constructor() {
    this.repo = new PostgresScheduleRepository();
    this.cronParser = new CronParser();
  }

  start(intervalMs = 15_000): void {
    if (this.intervalId) return;
    logger.info(`[ScheduleWorker] Starting with poll interval ${intervalMs}ms`);
    this.intervalId = setInterval(() => this.tick(), intervalMs);
    this.tick();
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    logger.info("[ScheduleWorker] Stopped");
  }

  private async tick(): Promise<void> {
    if (this.running) return;
    this.running = true;

    try {
      const now = new Date();
      const dueSchedules = await this.repo.findDueSchedules(now);

      for (const schedule of dueSchedules) {
        try {
          await this.executeSchedule(schedule);
        } catch (err) {
          logger.error(
            { scheduleId: schedule.id, err },
            "[ScheduleWorker] Schedule execution failed",
          );
        }
      }
    } catch (err) {
      logger.error({ err }, "[ScheduleWorker] Tick error");
    } finally {
      this.running = false;
    }
  }

  private async executeSchedule(
    schedule: import("./domain/schedule.entity").Schedule,
  ): Promise<void> {
    const {
      id: scheduleId,
      workflowId,
      name: scheduleName,
      tenantId,
      timezone,
      cronExpression,
      interval,
      retryOnFailure,
      maxRetries,
    } = schedule;

    logger.info(
      { scheduleId, workflowId },
      "[ScheduleWorker] Executing scheduled workflow",
    );

    const [workflow] = await db
      .select()
      .from(workflowsTable)
      .where(eq(workflowsTable.id, workflowId))
      .limit(1);
    if (!workflow) {
      logger.warn(
        { scheduleId, workflowId },
        "[ScheduleWorker] Workflow not found, marking schedule failed",
      );
      schedule.markFailed();
      await this.repo.update(scheduleId, schedule.toJSON() as any);
      return;
    }

    const nodes = Array.isArray(workflow.nodes)
      ? (workflow.nodes as any[])
      : [];

    // Create execution record
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

    // Update workflow execution count
    await db
      .update(workflowsTable)
      .set({
        executionCount: sql`${workflowsTable.executionCount} + 1`,
        lastRunAt: new Date(),
        lastRunStatus: "running",
      })
      .where(eq(workflowsTable.id, workflowId));

    // Enqueue the workflow execution via the shared job queue
    const { startWorkflowExecution } = await import("@longox/workflow-engine");
    await startWorkflowExecution(workflowId, workflow.name, nodes, "schedule", {
      _scheduleId: scheduleId,
    });

    // Calculate next run
    let nextRun: Date | undefined;
    if (interval === "cron" && cronExpression) {
      try {
        nextRun = this.cronParser.getNextRun(cronExpression);
      } catch {
        /* use default */
      }
    } else if (interval === "recurring") {
      // Simple recurring: use some sensible default like every 24hrs
      const periodMs = Number(schedule.metadata?.periodMs ?? 86_400_000);
      nextRun = new Date(Date.now() + periodMs);
    }

    schedule.recordRun(nextRun);
    await this.repo.update(scheduleId, schedule.toJSON() as any);

    publishEvent({
      type: "execution.started",
      aggregateId: String(execution.id),
      aggregateType: "execution",
      payload: {
        workflowId,
        workflowName: workflow.name,
        triggerType: "schedule",
        scheduleId,
        scheduleName,
      },
      actorId: String(tenantId),
      actorType: "schedule",
    });

    logger.info(
      { scheduleId, workflowId, executionId: execution.id, nextRun },
      "[ScheduleWorker] Workflow execution queued",
    );
  }
}

export const scheduleWorker = new ScheduleWorker();
