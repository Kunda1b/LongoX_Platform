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
