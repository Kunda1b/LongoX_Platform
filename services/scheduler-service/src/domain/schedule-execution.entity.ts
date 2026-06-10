export type ScheduleExecutionStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "skipped";

export interface ScheduleExecutionProps {
  id: number;
  scheduleId: number;
  tenantId: number;
  workflowId: number;
  scheduledAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  executionId?: number;
  status: ScheduleExecutionStatus;
  error?: string;
  retryCount: number;
  createdAt: Date;
}

export class ScheduleExecution {
  constructor(private props: ScheduleExecutionProps) {}

  get id(): number {
    return this.props.id;
  }
  get scheduleId(): number {
    return this.props.scheduleId;
  }
  get tenantId(): number {
    return this.props.tenantId;
  }
  get workflowId(): number {
    return this.props.workflowId;
  }
  get scheduledAt(): Date {
    return this.props.scheduledAt;
  }
  get startedAt(): Date | undefined {
    return this.props.startedAt;
  }
  get completedAt(): Date | undefined {
    return this.props.completedAt;
  }
  get executionId(): number | undefined {
    return this.props.executionId;
  }
  get status(): ScheduleExecutionStatus {
    return this.props.status;
  }
  get error(): string | undefined {
    return this.props.error;
  }
  get retryCount(): number {
    return this.props.retryCount;
  }

  start(executionId: number): void {
    this.props.startedAt = new Date();
    this.props.executionId = executionId;
    this.props.status = "running";
  }

  complete(): void {
    this.props.completedAt = new Date();
    this.props.status = "completed";
  }

  fail(error: string): void {
    this.props.completedAt = new Date();
    this.props.error = error;
    this.props.status = "failed";
  }

  skip(reason: string): void {
    this.props.error = reason;
    this.props.status = "skipped";
  }

  toJSON() {
    return { ...this.props };
  }
}
