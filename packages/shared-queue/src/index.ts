export type JobType = "workflow-execution" | "webhook-delivery" | "ai-run";

export interface WorkflowJobData {
  executionId: number;
  workflowId: number;
  workflowName: string;
  nodes: unknown[];
  triggerPayload: Record<string, unknown>;
  triggerType: string;
}

export interface WebhookJobData {
  workflowId: number;
  payload: Record<string, unknown>;
}

export interface AiRunJobData {
  nodeTypeId: string;
  config: Record<string, unknown>;
  input: Record<string, unknown>;
  workflowId: number;
}

export type JobDataMap = {
  "workflow-execution": WorkflowJobData;
  "webhook-delivery": WebhookJobData;
  "ai-run": AiRunJobData;
};

export interface RetryPolicy {
  attempts: number;
  backoffType: "exponential" | "fixed";
  backoffDelayMs: number;
}

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  attempts: 3,
  backoffType: "exponential",
  backoffDelayMs: 1000,
};

export interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

export interface JobQueue {
  addJob<T extends JobType>(
    type: T,
    data: JobDataMap[T],
    maxAttempts?: number,
  ): Promise<void>;
  addDelayedJob<T extends JobType>(
    type: T,
    data: JobDataMap[T],
    delayMs: number,
    maxAttempts?: number,
  ): Promise<void>;
  addScheduledJob<T extends JobType>(
    type: T,
    data: JobDataMap[T],
    cronExpression: string,
    maxAttempts?: number,
  ): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
  getStats(): Promise<QueueStats>;
}
