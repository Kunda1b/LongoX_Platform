import type { DataSourceConfig } from "../datasource.entity";
import type { DataSourceAdapter, QueryResult } from "./datasource-adapter";

export class RestApiAdapter implements DataSourceAdapter {
  kind = "rest_api" as const;

  async testConnection(
    config: DataSourceConfig,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const url = config.url as string;
      if (!url) return { success: false, error: "URL is required" };

      const response = await fetch(url, {
        method: "GET",
        headers: {
          ...((config.headers as Record<string, string>) ?? {}),
        },
        signal: AbortSignal.timeout((config.queryTimeoutMs as number) ?? 10000),
      });

      return {
        success: response.ok,
        error: response.ok ? undefined : `HTTP ${response.status}`,
      };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }

  async executeQuery(
    config: DataSourceConfig,
    _query: string,
  ): Promise<QueryResult> {
    const start = Date.now();
    const url = config.url as string;
    if (!url) throw new Error("URL is required");

    const response = await fetch(url, {
      method: "GET",
      headers: {
        ...((config.headers as Record<string, string>) ?? {}),
      },
    });

    if (!response.ok) {
      throw new Error(`REST API returned HTTP ${response.status}`);
    }

    const data = await response.json();
    const rows = Array.isArray(data) ? data : [data];
    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

    return {
      columns,
      rows,
      rowCount: rows.length,
      executionTimeMs: Date.now() - start,
    };
  }

  async listTables(_config: DataSourceConfig): Promise<string[]> {
    return ["endpoints"];
  }

  async getSchema(
    _config: DataSourceConfig,
    _table: string,
  ): Promise<{ column: string; type: string; nullable: boolean }[]> {
    return [];
  }
}
