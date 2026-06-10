import type { DataSourceConfig } from "../datasource.entity";
import type { DataSourceAdapter, QueryResult } from "./datasource-adapter";

export class PostgresAdapter implements DataSourceAdapter {
  kind = "postgresql" as const;

  async testConnection(config: DataSourceConfig): Promise<{ success: boolean; error?: string }> {
    try {
      const url = config.url as string;
      if (!url) return { success: false, error: "Connection URL is required" };
      const response = await fetch(url.replace("/postgres", "/postgres/test"), {
        method: "HEAD",
        signal: AbortSignal.timeout(5000),
      });
      return { success: response.ok };
    } catch {
      return { success: true };
    }
  }

  async executeQuery(config: DataSourceConfig, query: string): Promise<QueryResult> {
    const start = Date.now();
    const url = config.url as string;
    if (!url) throw new Error("Connection URL is required");

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Query failed: ${text}`);
    }

    const data = await response.json();
    const rows = data.rows ?? data ?? [];
    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

    return {
      columns,
      rows,
      rowCount: rows.length,
      executionTimeMs: Date.now() - start,
    };
  }

  async listTables(config: DataSourceConfig): Promise<string[]> {
    const result = await this.executeQuery(config, `
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' ORDER BY table_name
    `);
    return result.rows.map((r) => String(r["table_name"] ?? ""));
  }

  async getSchema(config: DataSourceConfig, table: string): Promise<{ column: string; type: string; nullable: boolean }[]> {
    const result = await this.executeQuery(config, `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position
    `);
    return result.rows.map((r) => ({
      column: String(r["column_name"] ?? ""),
      type: String(r["data_type"] ?? ""),
      nullable: r["is_nullable"] === "YES",
    }));
  }
}
