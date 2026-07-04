import { Schedule } from "../../domain";
import type { ScheduleRepository } from "../../domain";
import type {
  ScheduleInterval,
  ScheduleStatus,
} from "../../domain/schedule.entity";

export interface CreateScheduleInput {
  tenantId: string;
  workflowId: string;
  name: string;
  description?: string;
  interval: ScheduleInterval;
  cronExpression?: string;
  timezone?: string;
  startAt?: Date;
  endAt?: Date;
  maxRuns?: number;
  retryOnFailure?: boolean;
  maxRetries?: number;
  metadata?: Record<string, unknown>;
}

export class CreateScheduleCommand {
  constructor(private repository: ScheduleRepository) {}

  async execute(input: CreateScheduleInput): Promise<Schedule> {
    const now = new Date();
    const schedule = await this.repository.create({
      tenantId: input.tenantId,
      workflowId: input.workflowId,
      name: input.name,
      description: input.description,
      interval: input.interval,
      cronExpression: input.cronExpression,
      timezone: input.timezone ?? "UTC",
      startAt: input.startAt ?? now,
      endAt: input.endAt,
      status: "active" as ScheduleStatus,
      runCount: 0,
      retryOnFailure: input.retryOnFailure ?? false,
      maxRetries: input.maxRetries ?? 0,
      metadata: input.metadata ?? {},
      lastRunAt: undefined,
      nextRunAt: this.computeNextRun(
        input.interval,
        input.cronExpression,
        input.startAt ?? now,
      ),
    });

    return schedule;
  }

  private computeNextRun(
    interval: ScheduleInterval,
    cronExpression?: string,
    from?: Date,
  ): Date | undefined {
    if (interval === "once") return undefined;
    if (interval === "recurring" && cronExpression) {
      return this.parseCronNext(cronExpression, from ?? new Date());
    }
    const base = from ?? new Date();
    const next = new Date(base);
    next.setMinutes(next.getMinutes() + 5);
    return next;
  }

  private parseCronNext(_expression: string, _from: Date): Date {
    const next = new Date(_from);
    next.setMinutes(next.getMinutes() + 5);
    return next;
  }
}

export interface UpdateScheduleInput {
  name?: string;
  description?: string;
  interval?: ScheduleInterval;
  cronExpression?: string;
  timezone?: string;
  startAt?: Date;
  endAt?: Date;
  status?: ScheduleStatus;
  maxRuns?: number;
  retryOnFailure?: boolean;
  maxRetries?: number;
  metadata?: Record<string, unknown>;
}

export class UpdateScheduleCommand {
  constructor(private repository: ScheduleRepository) {}

  async execute(id: string, input: UpdateScheduleInput): Promise<Schedule> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error(`Schedule with id ${id} not found`);
    }

    const updated = await this.repository.update(id, input);
    return updated;
  }
}

export class DeleteScheduleCommand {
  constructor(private repository: ScheduleRepository) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error(`Schedule with id ${id} not found`);
    }
    await this.repository.delete(id);
  }
}
