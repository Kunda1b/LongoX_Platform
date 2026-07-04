export type TriggerKind = "manual" | "webhook" | "schedule" | "event";

export class Trigger {
  constructor(
    public readonly id: string,
    public readonly workflowId: string,
    public readonly kind: TriggerKind,
    public readonly config: Record<string, unknown>,
    public readonly enabled: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static createWebhook(workflowId: string, path: string): Trigger {
    return new Trigger(
      `trigger-${workflowId}-webhook-${Date.now()}`,
      workflowId,
      "webhook",
      { path, method: "POST" },
      true,
      new Date(),
      new Date(),
    );
  }

  static createSchedule(
    workflowId: string,
    cron: string,
    timezone: string = "UTC",
  ): Trigger {
    return new Trigger(
      `trigger-${workflowId}-schedule-${Date.now()}`,
      workflowId,
      "schedule",
      { cron, timezone },
      true,
      new Date(),
      new Date(),
    );
  }

  enable(): void {
    (this as { enabled: boolean }).enabled = true;
    (this as { updatedAt: Date }).updatedAt = new Date();
  }

  disable(): void {
    (this as { enabled: boolean }).enabled = false;
    (this as { updatedAt: Date }).updatedAt = new Date();
  }
}
