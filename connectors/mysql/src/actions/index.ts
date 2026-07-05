import type { ActionContext, ActionResult } from "@longox/connector-runtime";

interface MySqlConnectionConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

function parseConnectionString(cs: string): MySqlConnectionConfig {
  const url = new URL(cs);
  return {
    host: url.hostname,
    port: parseInt(url.port || "3306", 10),
    database: url.pathname.replace(/^\//, ""),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
  };
}

async function queryMysql(
  config: MySqlConnectionConfig,
  sql: string,
  params?: unknown[],
): Promise<{
  rows: Record<string, unknown>[];
  rowCount: number;
  fields: string[];
}> {
  const { default: mysql } = await import("mysql2/promise");
  const connection = await mysql.createConnection({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password,
  });
  try {
    const [rows, fields] = await connection.execute(sql, params ?? []);
    const rowArray = Array.isArray(rows)
      ? (rows as Record<string, unknown>[])
      : [];
    return {
      rows: rowArray,
      rowCount: rowArray.length,
      fields:
        (fields as any[])?.map((f: any) => f.name ?? f.orgName ?? String(f)) ??
        [],
    };
  } finally {
    await connection.end();
  }
}

export async function executeQuery(
  context: ActionContext,
): Promise<ActionResult> {
  const start = Date.now();
  const raw =
    (context.config.connectionString as string) ??
    (context.auth.credentials as Record<string, string>)?.connectionString ??
    "";
  const query = String(context.config.query ?? "");
  const params = (context.config.params as unknown[]) ?? [];

  if (!raw)
    return {
      success: false,
      data: {},
      error: "Connection string required",
      durationMs: Date.now() - start,
    };
  if (!query)
    return {
      success: false,
      data: {},
      error: "SQL query required",
      durationMs: Date.now() - start,
    };

  try {
    const config = parseConnectionString(raw);
    const result = await queryMysql(config, query, params);
    return {
      success: true,
      data: {
        rows: result.rows,
        rowCount: result.rowCount,
        fields: result.fields,
      },
      error: null,
      durationMs: Date.now() - start,
    };
  } catch (err) {
    return {
      success: false,
      data: {},
      error: err instanceof Error ? err.message : String(err),
      durationMs: Date.now() - start,
    };
  }
}

export async function listTables(
  context: ActionContext,
): Promise<ActionResult> {
  const start = Date.now();
  const raw =
    (context.config.connectionString as string) ??
    (context.auth.credentials as Record<string, string>)?.connectionString ??
    "";

  if (!raw)
    return {
      success: false,
      data: {},
      error: "Connection string required",
      durationMs: Date.now() - start,
    };

  try {
    const config = parseConnectionString(raw);
    const result = await queryMysql(
      config,
      "SELECT TABLE_NAME, TABLE_TYPE, TABLE_SCHEMA FROM information_schema.tables WHERE TABLE_SCHEMA = ? ORDER BY TABLE_NAME",
      [config.database],
    );
    return {
      success: true,
      data: {
        tables: result.rows.map((r) => ({
          name: r.TABLE_NAME,
          type: r.TABLE_TYPE,
        })),
      },
      error: null,
      durationMs: Date.now() - start,
    };
  } catch (err) {
    return {
      success: false,
      data: {},
      error: err instanceof Error ? err.message : String(err),
      durationMs: Date.now() - start,
    };
  }
}

export async function getTableSchema(
  context: ActionContext,
): Promise<ActionResult> {
  const start = Date.now();
  const raw =
    (context.config.connectionString as string) ??
    (context.auth.credentials as Record<string, string>)?.connectionString ??
    "";
  const table = String(context.config.table ?? "");

  if (!raw)
    return {
      success: false,
      data: {},
      error: "Connection string required",
      durationMs: Date.now() - start,
    };
  if (!table)
    return {
      success: false,
      data: {},
      error: "table name required",
      durationMs: Date.now() - start,
    };

  try {
    const config = parseConnectionString(raw);
    const result = await queryMysql(
      config,
      "SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, CHARACTER_MAXIMUM_LENGTH FROM information_schema.columns WHERE TABLE_NAME = ? AND TABLE_SCHEMA = ? ORDER BY ORDINAL_POSITION",
      [table, config.database],
    );
    return {
      success: true,
      data: {
        columns: result.rows.map((c) => ({
          name: c.COLUMN_NAME,
          type: c.DATA_TYPE,
          nullable: c.IS_NULLABLE === "YES",
          default: c.COLUMN_DEFAULT,
          maxLength: c.CHARACTER_MAXIMUM_LENGTH,
        })),
      },
      error: null,
      durationMs: Date.now() - start,
    };
  } catch (err) {
    return {
      success: false,
      data: {},
      error: err instanceof Error ? err.message : String(err),
      durationMs: Date.now() - start,
    };
  }
}
