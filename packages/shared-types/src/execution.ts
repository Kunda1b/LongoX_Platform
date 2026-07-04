export type ExecutionStatus =
  | "pending"
  | "running"
  | "success"
  | "failed"
  | "cancelled";

export interface Execution {
  id: string;
  workflowId: string;
  workflowName: string;
  status: ExecutionStatus;
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
  errorMessage: string | null;
  steps: ExecutionStep[];
}

export interface ExecutionStep {
  id: string;
  nodeId: string;
  nodeName: string;
  nodeType: string;
  status: "running" | "success" | "failed";
  attemptNumber: number;
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
  inputData: Record<string, unknown>;
  outputData: Record<string, unknown> | null;
  errorMessage: string | null;
}

export interface ExecutionCheckpoint {
  id: string;
  executionId: string;
  nodeId: string;
  nodeName: string;
  nodeType: string;
  status: "running" | "success" | "failed";
  attemptNumber: number;
  inputData: Record<string, unknown>;
  outputData: Record<string, unknown> | null;
  errorMessage: string | null;
  startedAt: string;
  completedAt: string | null;
  durationMs: number | null;
}

export interface DLQEntry {
  id: string;
  executionId: string;
  workflowId: string;
  workflowName: string;
  nodeId: string;
  nodeName: string;
  nodeType: string;
  errorMessage: string;
  attempts: number;
  jobData: Record<string, unknown> | null;
  status: "pending" | "retrying" | "resolved" | "archived";
  createdAt: string;
}
