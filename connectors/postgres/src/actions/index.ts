import type { ActionContext, ActionResult } from "@autoflow/connector-runtime";
import pg from "pg";

const { Pool } = pg;

async function getPool(connectionString: string): Promise<pg.Pool> {
  return new Pool({ connectionString, max: 1 });
}

export async function executeQuery(context: ActionContext): Promise<ActionResult> {
  const start = Date.now();
  const connectionString = String(context.config.connectionString ?? context.auth.credentials.connectionString ?? "");
  const query = String(context.config.query ?? "");
  const params = (context.config.params as unknown[]) ?? [];

  if (!connectionString) return { success: false, data: {}, error: "Connection string required", durationMs: Date.now() - start };
  if (!query) return { success: false, data: {}, error: "SQL query required", durationMs: Date.now() - start };

  try {
    const pool = await getPool(connectionString);
    const result = await pool.query(query, params);
    await pool.end();

    return {
      success: true,
      data: { rows: result.rows, rowCount: result.rowCount ?? result.rows.length, fields: result.fields?.map((f) => ({ name: f.name, dataType: f.dataTypeID })) },
      error: null,
      durationMs: Date.now() - start,
    };
  } catch (err) {
    return { success: false, data: {}, error: err instanceof Error ? err.message : String(err), durationMs: Date.now() - start };
  }
}

export async function listTables(context: ActionContext): Promise<ActionResult> {
  const start = Date.now();
  const connectionString = String(context.config.connectionString ?? context.auth.credentials.connectionString ?? "");

  try {
    const pool = await getPool(connectionString);
    const result = await pool.query(`
      SELECT table_schema, table_name, table_type
      FROM information_schema.tables
      WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
      ORDER BY table_schema, table_name
    `);
    await pool.end();

    return {
      success: true,
      data: { tables: result.rows.map((r) => ({ schema: r.table_schema, name: r.table_name, type: r.table_type })) },
      error: null,
      durationMs: Date.now() - start,
    };
  } catch (err) {
    return { success: false, data: {}, error: err instanceof Error ? err.message : String(err), durationMs: Date.now() - start };
  }
}

export async function getTableSchema(context: ActionContext): Promise<ActionResult> {
  const start = Date.now();
  const connectionString = String(context.config.connectionString ?? context.auth.credentials.connectionString ?? "");
  const table = String(context.config.table ?? "");

  try {
    const pool = await getPool(connectionString);
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = $1
      ORDER BY ordinal_position
    `, [table]);
    await pool.end();

    return {
      success: true,
      data: { columns: result.rows.map((c) => ({
        name: c.column_name,
        type: c.data_type,
        nullable: c.is_nullable === "YES",
        default: c.column_default,
        maxLength: c.character_maximum_length,
      })) },
      error: null,
      durationMs: Date.now() - start,
    };
  } catch (err) {
    return { success: false, data: {}, error: err instanceof Error ? err.message : String(err), durationMs: Date.now() - start };
  }
}
