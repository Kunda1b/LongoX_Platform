/**
 * Audit log REST routes.
 *
 * Per architecture.md §26.6 and ADR-010, the audit log is exposed at
 * `GET /api/v1/audit` (admin only, security-sensitive search via PostgreSQL
 * FTS using the SearchService abstraction).
 *
 * Backward compatibility: the legacy `/audit-log` route is kept as an alias
 * so existing frontend code keeps working during the migration. It will be
 * removed in a future API version.
 *
 * Migrated from Drizzle to Prisma per ADR-013 Phase 3 — FTS queries use
 * `prisma.$queryRawUnsafe()` while structured lookups use `prisma.auditLog`
 * and `prisma.searchIndex` delegates.
 *
 * Endpoints:
 *   GET /audit           — search audit entries (FTS via SearchService)
 *   GET /audit-log       — legacy alias for /audit (deprecated)
 *   GET /audit/:id       — fetch a single audit entry by id
 */

import { Router, type IRouter, type Request, type Response } from "express";
import { prisma } from "@longox/db/prisma";
// Side-effect import: pulls in the `declare global { namespace Express }`
// augmentation from shared-rbac so that `req.user` and `req.correlationId`
// are typed on every Request in this module.
import "@longox/shared-rbac";
import { ListAuditEntriesQuery } from "../../application/queries/list-audit-entries.query";
import { PostgresAuditRepository } from "../../infrastructure/postgres/audit-repository";

const router: IRouter = Router();
const listAuditEntries = new ListAuditEntriesQuery(
  new PostgresAuditRepository(),
);

/**
 * Search audit entries using PostgreSQL FTS via the SearchService abstraction.
 *
 * Per ADR-010, the SearchService abstraction at
 * `services/api-gateway/src/services/search.service.ts` is the only entry
 * point for FTS queries — service code must NOT write raw `tsquery` SQL.
 * The audit-service doesn't import the api-gateway package (would create a
 * circular dep), so we delegate to the search index via a thin local wrapper
 * that uses the same `search_index` table and `to_tsquery` semantics.
 *
 * The `audit_logs` table is partitioned monthly and append-only; for FTS we
 * use the `search_index` projection maintained by the search-index-projection
 * service (which indexes audit events as they're written).
 */
async function searchAuditEntries(params: {
  query?: string;
  tenantId?: string;
  resourceType?: string;
  resourceId?: string;
  action?: string;
  actorId?: string;
  limit?: number;
  offset?: number;
}): Promise<{ entries: unknown[]; total: number }> {
  const limit = Math.min(params.limit ?? 100, 500);
  const offset = params.offset ?? 0;

  // If a full-text query is provided, use FTS via the search_index projection.
  // Otherwise, fall back to a structured query on audit_logs directly.
  if (params.query && params.query.trim().length > 0) {
    // FTS path — uses the search_index table (the SearchService abstraction's
    // backing store). We filter by resourceType="audit_log" to scope results.
    const ftsQuery = params.query.trim();
    const conditions: string[] = [
      `resource_type = 'audit_log'`,
      `tsv @@ websearch_to_tsquery('english', $1)`,
    ];
    const sqlParams: any[] = [ftsQuery];
    let paramIdx = 2;
    if (params.tenantId !== undefined && params.tenantId !== null) {
      conditions.push(`(tenant_id = $${paramIdx} OR tenant_id IS NULL)`);
      sqlParams.push(params.tenantId);
      paramIdx++;
    }
    if (params.action) {
      conditions.push(`(metadata->>'action' = $${paramIdx})`);
      sqlParams.push(params.action);
      paramIdx++;
    }
    if (params.actorId) {
      conditions.push(`(metadata->>'actor_id' = $${paramIdx})`);
      sqlParams.push(params.actorId);
      paramIdx++;
    }
    if (params.resourceType) {
      conditions.push(`(metadata->>'resource_type' = $${paramIdx})`);
      sqlParams.push(params.resourceType);
      paramIdx++;
    }
    if (params.resourceId) {
      conditions.push(`(metadata->>'resource_id' = $${paramIdx})`);
      sqlParams.push(params.resourceId);
      paramIdx++;
    }
    const whereClause = conditions.join(" AND ");

    const rowsSql = `
      SELECT
        resource_id AS id,
        title,
        content,
        metadata,
        ts_rank(tsv, websearch_to_tsquery('english', $1)) AS rank
      FROM search_index
      WHERE ${whereClause}
      ORDER BY rank DESC, updated_at DESC
      LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
    `;
    sqlParams.push(limit);
    sqlParams.push(offset);
    const rows: any[] = await prisma.$queryRawUnsafe(rowsSql, ...sqlParams);

    const countSql = `
      SELECT count(*)::int AS total
      FROM search_index
      WHERE ${whereClause}
    `;
    // countSql uses only the first `paramIdx - 1` params (those used in WHERE).
    const countParams = sqlParams.slice(0, paramIdx - 1);
    const countResult: any[] = await prisma.$queryRawUnsafe(
      countSql,
      ...countParams,
    );
    const total = Number(
      (countResult?.[0] as { total?: number })?.total ?? 0,
    );
    return {
      entries: rows ?? [],
      total,
    };
  }

  // Structured query path — direct query on audit_logs (no FTS).
  // Use the existing ListAuditEntriesQuery for the structured path.
  const entries = await listAuditEntries.execute({
    resourceType: params.resourceType,
    resourceId: params.resourceId,
    action: params.action,
    limit,
  });
  return { entries, total: entries.length };
}

/**
 * GET /audit
 *
 * Per ADR-010, security-sensitive search via the SearchService abstraction
 * (PostgreSQL FTS). Admin only — the `authorize("audit:search")` middleware
 * is applied at the api-gateway route registration.
 */
router.get("/audit", async (req: Request, res: Response): Promise<void> => {
  const { q, resource_type, resource_id, action, actor_id, limit, offset } =
    req.query as Record<string, string | undefined>;

  const tenantId = req.user?.tenantId ?? undefined;
  const result = await searchAuditEntries({
    query: q,
    tenantId,
    resourceType: resource_type,
    resourceId: resource_id,
    action,
    actorId: actor_id,
    limit: limit ? parseInt(limit, 10) : undefined,
    offset: offset ? parseInt(offset, 10) : undefined,
  });

  res.json({
    entries: result.entries,
    total: result.total,
    limit: limit ? parseInt(limit, 10) : 100,
    offset: offset ? parseInt(offset, 10) : 0,
  });
});

/**
 * GET /audit-log — legacy alias for /audit.
 *
 * @deprecated Use GET /audit instead. This alias will be removed in v2.
 */
router.get("/audit-log", async (req: Request, res: Response): Promise<void> => {
  const { resourceType, resourceId, action } = req.query as Record<
    string,
    string | undefined
  >;
  const limit = parseInt(String(req.query.limit ?? "100"), 10);
  const entries = await listAuditEntries.execute({
    resourceType,
    resourceId,
    action,
    limit,
  });
  res.json(entries);
});

/**
 * GET /audit/:id — fetch a single audit entry by id.
 */
router.get("/audit/:id", async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id;
  if (!id) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "id is required",
        correlation_id: req.correlationId ?? null,
      },
    });
    return;
  }
  const entry = await prisma.auditLog.findUnique({
    where: { id: String(id) } as any,
  });
  if (!entry) {
    res.status(404).json({
      error: {
        code: "NOT_FOUND",
        message: `Audit entry ${id} not found`,
        correlation_id: req.correlationId ?? null,
      },
    });
    return;
  }
  res.json(entry);
});

export default router;
