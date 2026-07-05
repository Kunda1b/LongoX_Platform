/**
 * Datasource management routes (dashboard-service local copy).
 *
 * Migrated from Drizzle to Prisma per ADR-013 Phase 3. Uses
 * `prisma.dataSource` delegate with `as any` casts for legacy `config`
 * column (Prisma canonical name is `configJson`).
 */

import { Router, type IRouter } from "express";
import { prisma } from "@longox/db/prisma";
import { authorize } from "@longox/shared-rbac";

const router: IRouter = Router();

router.get(
  "/datasources",
  authorize("dashboards:read"),
  async (req, res): Promise<void> => {
    const tenantId = (req as any).user?.tenantId;
    const where: Record<string, unknown> = {};
    if (tenantId) where.tenantId = tenantId;

    const sources = await prisma.dataSource.findMany({
      where: where as any,
      orderBy: { name: "asc" },
    });

    res.json(sources);
  },
);

router.post(
  "/datasources",
  authorize("dashboards:write"),
  async (req, res): Promise<void> => {
    const { name, kind, config } = req.body as Record<string, unknown>;

    if (!name || !kind) {
      res.status(400).json({ error: "name and kind are required" });
      return;
    }

    const source = await prisma.dataSource.create({
      data: {
        tenantId: (req as any).user?.tenantId ?? null,
        name: String(name),
        kind: String(kind),
        configJson: (config ?? {}) as Record<string, unknown>,
        config: (config ?? {}) as Record<string, unknown>,
      } as any,
    });

    res.status(201).json(source);
  },
);

router.delete(
  "/datasources/:id",
  authorize("dashboards:delete"),
  async (req, res): Promise<void> => {
    const id = String(req.params.id);
    if (!id) {
      res.status(400).json({ error: "id is required" });
      return;
    }

    const deleted = await prisma.dataSource
      .delete({ where: { id } })
      .catch(() => null);
    if (!deleted) {
      res.status(404).json({ error: "Data source not found" });
      return;
    }

    res.sendStatus(204);
  },
);

router.post(
  "/datasources/:id/test",
  authorize("dashboards:write"),
  async (req, res): Promise<void> => {
    const id = String(req.params.id);
    if (!id) {
      res.status(400).json({ error: "id is required" });
      return;
    }

    const source = await prisma.dataSource.findUnique({ where: { id } });
    if (!source) {
      res.status(404).json({ error: "Data source not found" });
      return;
    }

    const startMs = Date.now();
    try {
      const result = await testConnection(
        (source as any).kind,
        ((source as any).configJson ?? (source as any).config) as Record<
          string,
          unknown
        >,
      );
      res.json({ success: true, latencyMs: Date.now() - startMs, result });
    } catch (err) {
      res.json({
        success: false,
        latencyMs: Date.now() - startMs,
        error: (err as Error).message,
      });
    }
  },
);

async function testConnection(
  kind: string,
  config: Record<string, unknown>,
): Promise<unknown> {
  switch (kind) {
    case "postgres": {
      const { default: pg } = await import("pg");
      const { Pool } = pg;
      const pool = new Pool({
        connectionString: String(config.url ?? ""),
        max: 1,
        connectionTimeoutMillis: 5000,
      });
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
      const response = await fetch(String(config.url ?? ""), {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });
      return { status: response.status, ok: response.ok };
    }
    default:
      throw new Error(
        `Connection testing is not supported for datasource type "${kind}". ` +
          `Supported types: postgres, rest_api.`,
      );
  }
}

export default router;
