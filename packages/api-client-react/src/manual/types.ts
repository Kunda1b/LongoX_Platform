export interface Schedule {
  id: number;
  tenantId: number;
  workflowId: number;
  name: string;
  description: string | null;
  interval: "once" | "recurring" | "cron";
  cronExpression: string | null;
  timezone: string;
  status: "active" | "paused" | "completed" | "failed";
  startAt: string;
  endAt: string | null;
  lastRunAt: string | null;
  nextRunAt: string | null;
  maxRuns: number | null;
  runCount: number;
  retryOnFailure: boolean;
  maxRetries: number;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleInput {
  tenantId: number;
  workflowId: number;
  name: string;
  description?: string;
  interval: "once" | "recurring" | "cron";
  cronExpression?: string;
  timezone?: string;
  startAt?: string;
  endAt?: string;
  maxRuns?: number;
  retryOnFailure?: boolean;
  maxRetries?: number;
  metadata?: Record<string, unknown>;
}

export interface DataSource {
  id: number;
  tenantId: number;
  name: string;
  description: string | null;
  kind: "postgresql" | "mysql" | "mongodb" | "rest_api" | "graphql" | "bigquery" | "snowflake" | "csv_upload" | "custom";
  config: Record<string, unknown>;
  status: "active" | "inactive" | "error" | "testing";
  lastTestedAt: string | null;
  lastTestError: string | null;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface DataSourceInput {
  tenantId: number;
  name: string;
  description?: string;
  kind: DataSource["kind"];
  config?: Record<string, unknown>;
  createdBy: number;
}

export interface ScheduleStats {
  active: number;
  paused: number;
  completed: number;
}

export interface QueryResult {
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
  executionTimeMs: number;
}

export interface ConnectionTestResult {
  success: boolean;
  error?: string;
}

export interface ListSchedulesParams {
  tenantId?: number;
  workflowId?: number;
  status?: string;
  limit?: number;
}

export interface ListDataSourcesParams {
  tenantId?: number;
  kind?: string;
  limit?: number;
}
