export type ScheduleStatus = "active" | "paused" | "completed" | "failed";
export type ScheduleInterval = "once" | "recurring" | "cron";

export interface ScheduleProps {
  id: number;
  tenantId: number;
  workflowId: number;
  name: string;
  description?: string;
  interval: ScheduleInterval;
  cronExpression?: string;
  timezone: string;
  startAt: Date;
  endAt?: Date;
  status: ScheduleStatus;
  lastRunAt?: Date;
  nextRunAt?: Date;
  maxRuns?: number;
  runCount: number;
  retryOnFailure: boolean;
  maxRetries: number;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export class Schedule {
  constructor(private props: ScheduleProps) {}

  get id(): number {
    return this.props.id;
  }
  get tenantId(): number {
    return this.props.tenantId;
  }
  get workflowId(): number {
    return this.props.workflowId;
  }
  get name(): string {
    return this.props.name;
  }
  get description(): string | undefined {
    return this.props.description;
  }
  get interval(): ScheduleInterval {
    return this.props.interval;
  }
  get cronExpression(): string | undefined {
    return this.props.cronExpression;
  }
  get timezone(): string {
    return this.props.timezone;
  }
  get startAt(): Date {
    return this.props.startAt;
  }
  get endAt(): Date | undefined {
    return this.props.endAt;
  }
  get status(): ScheduleStatus {
    return this.props.status;
  }
  get lastRunAt(): Date | undefined {
    return this.props.lastRunAt;
  }
  get nextRunAt(): Date | undefined {
    return this.props.nextRunAt;
  }
  get maxRuns(): number | undefined {
    return this.props.maxRuns;
  }
  get runCount(): number {
    return this.props.runCount;
  }
  get retryOnFailure(): boolean {
    return this.props.retryOnFailure;
  }
  get maxRetries(): number {
    return this.props.maxRetries;
  }
  get metadata(): Record<string, unknown> {
    return { ...this.props.metadata };
  }

  activate(): void {
    this.props.status = "active";
    this.props.updatedAt = new Date();
  }

  pause(): void {
    this.props.status = "paused";
    this.props.updatedAt = new Date();
  }

  complete(): void {
    this.props.status = "completed";
    this.props.updatedAt = new Date();
  }

  markFailed(): void {
    this.props.status = "failed";
    this.props.updatedAt = new Date();
  }

  recordRun(nextRun?: Date): void {
    this.props.lastRunAt = new Date();
    this.props.runCount += 1;
    this.props.nextRunAt = nextRun;
    this.props.updatedAt = new Date();

    if (this.props.maxRuns && this.props.runCount >= this.props.maxRuns) {
      this.props.status = "completed";
    }
  }

  toJSON() {
    return { ...this.props };
  }
}
