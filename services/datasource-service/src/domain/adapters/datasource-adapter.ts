import type { DataSourceKind, DataSourceConfig } from "../datasource.entity";

export interface QueryResult {
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
  executionTimeMs: number;
}

export interface DataSourceAdapter {
  kind: DataSourceKind;
  testConnection(config: DataSourceConfig): Promise<{ success: boolean; error?: string }>;
  executeQuery(config: DataSourceConfig, query: string, params?: unknown[]): Promise<QueryResult>;
  listTables(config: DataSourceConfig): Promise<string[]>;
  getSchema(config: DataSourceConfig, table: string): Promise<{ column: string; type: string; nullable: boolean }[]>;
}
