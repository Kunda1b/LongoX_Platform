import { Router, type IRouter } from "express";
import { eq, and as andOp } from "drizzle-orm";
import { db, dataSourcesTable } from "@autoflow/db";

const router: IRouter = Router();

router.get("/datasources", async (req, res): Promise<void> => {
  const tenantId = (req as any).user?.tenantId;
  const conditions = [];
  if (tenantId) conditions.push(eq(dataSourcesTable.tenantId, tenantId));

  const sources = await db.select().from(dataSourcesTable)
    .where(conditions.length ? andOp(...conditions) : undefined)
    .orderBy(dataSourcesTable.name);

  res.json(sources);
});

router.post("/datasources", async (req, res): Promise<void> => {
  const { name, kind, config } = req.body as Record<string, unknown>;

  if (!name || !kind) {
    res.status(400).json({ error: "name and kind are required" });
    return;
  }

  const [source] = await db.insert(dataSourcesTable).values({
    tenantId: (req as any).user?.tenantId ?? null,
    name: String(name),
    kind: String(kind),
    configJson: (config ?? {}) as Record<string, unknown>,
    isActive: true,
  }).returning();

  res.status(201).json(source);
});

router.delete("/datasources/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [deleted] = await db.delete(dataSourcesTable).where(eq(dataSourcesTable.id, id)).returning();
  if (!deleted) { res.status(404).json({ error: "Data source not found" }); return; }

  res.sendStatus(204);
});

router.post("/datasources/:id/test", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [source] = await db.select().from(dataSourcesTable).where(eq(dataSourcesTable.id, id)).limit(1);
  if (!source) { res.status(404).json({ error: "Data source not found" }); return; }

  const startMs = Date.now();
  try {
    const result = await testConnection(source.kind, source.configJson as Record<string, unknown>);
    res.json({ success: true, latencyMs: Date.now() - startMs, result });
  } catch (err) {
    res.json({ success: false, latencyMs: Date.now() - startMs, error: (err as Error).message });
  }
});

async function testConnection(kind: string, config: Record<string, unknown>): Promise<unknown> {
  switch (kind) {
    case "postgres": {
      const { default: pg } = await import("pg");
      const { Pool } = pg;
      const pool = new Pool({ connectionString: String(config.url ?? ""), max: 1, connectionTimeoutMillis: 5000 });
      try {
        const client = await pool.connect();
        const result = await client.query("SELECT NOW() as time");
        client.release();
        return { serverTime: result.rows[0].time };
      } finally {
        await pool.end();
      }
    }
    case "rest_api": {
      const response = await fetch(String(config.url ?? ""), { method: "GET", signal: AbortSignal.timeout(5000) });
      return { status: response.status, ok: response.ok };
    }
    default:
      return { message: `Connection test for ${kind} completed (simulated)` };
  }
}

export default router;
