/**
 * Prisma-based search repository.
 *
 * Migrated from Drizzle to Prisma per ADR-013 Phase 3.
 * Uses `prisma.$queryRawUnsafe()` for FTS queries and Prisma delegates for basic lookups.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * ADR-010 / architecture §16.5 — Pre-computed tsvector columns.
 *
 * The canonical `search_index` table (managed by the SearchService projection)
 * is the ONLY table that carries pre-computed `title_tsv` / `content_tsv`
 * tsvector columns. All tenant-facing search SHOULD go through that projection
 * so it benefits from indexed, pre-computed tsvector lookups.
 *
 * The runtime `to_tsvector()` calls below on the legacy `workflows`, `apps`,
 * `templates`, `connectors`, `executions`, `audit_log`, and `prompts` tables
 * are retained for backwards compatibility with code paths that bypass the
 * SearchService projection. Per ADR-010 scope, pre-computed tsvector columns
 * are NOT added to those core domain tables — they are an internal concern of
 * the `search_index` projection. Migrate callers to the SearchService API to
 * eliminate the runtime `to_tsvector()` cost on these legacy paths.
 * (matrix item 12 / matrix item 43 — by-design scope.)
 * ──────────────────────────────────────────────────────────────────────────────
 */

import { prisma } from "@longox/db/prisma";
import type { SearchRepository } from "../../domain/search/search-repository";
import type {
  SearchResult,
  SearchableType,
} from "../../domain/search/search-result.entity";

const FTS_CONFIG = "english";

function toTsQuery(query: string): string {
  const sanitized = query.replace(/[^\w\s-]/g, "").trim();
  if (!sanitized) return "";
  const terms = sanitized
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => `${t}:*`)
    .join(" & ");
  return terms;
}

export class PostgresSearchRepository implements SearchRepository {
  async search(
    query: string,
    types: SearchableType[],
    limitPerType: number,
  ): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    const tsq = toTsQuery(query);

    if (!tsq) {
      return this.searchBasic(query, types, limitPerType);
    }

    if (types.includes("workflows")) {
      const rows: any[] = await prisma.$queryRawUnsafe(
        `SELECT id, name, description, status, trigger_type,
            ts_rank(to_tsvector($1, COALESCE(name, '') || ' ' || COALESCE(description, '')), to_tsquery($1, $2)) as rank
          FROM workflows
          WHERE to_tsvector($1, COALESCE(name, '') || ' ' || COALESCE(description, '')) @@ to_tsquery($1, $2)
          ORDER BY rank DESC
          LIMIT $3`,
        FTS_CONFIG,
        tsq,
        limitPerType,
      );
      for (const r of rows) {
        results.push({
          id: r.id,
          type: "workflow",
          title: r.name,
          description: r.description ?? null,
          url: `/workflows/${r.id}`,
          metadata: {
            status: r.status,
            triggerType: r.trigger_type,
            rank: r.rank,
          },
        });
      }
    }

    if (types.includes("apps")) {
      const rows: any[] = await prisma.$queryRawUnsafe(
        `SELECT id, name, description, type, status,
            ts_rank(to_tsvector($1, COALESCE(name, '') || ' ' || COALESCE(description, '')), to_tsquery($1, $2)) as rank
          FROM apps
          WHERE to_tsvector($1, COALESCE(name, '') || ' ' || COALESCE(description, '')) @@ to_tsquery($1, $2)
          ORDER BY rank DESC
          LIMIT $3`,
        FTS_CONFIG,
        tsq,
        limitPerType,
      );
      for (const r of rows) {
        results.push({
          id: r.id,
          type: "app",
          title: r.name,
          description: r.description ?? null,
          url: `/apps/${r.id}`,
          metadata: { type: r.type, status: r.status, rank: r.rank },
        });
      }
    }

    if (types.includes("templates")) {
      const rows: any[] = await prisma.$queryRawUnsafe(
        `SELECT id, name, description, category,
            ts_rank(to_tsvector($1, COALESCE(name, '') || ' ' || COALESCE(description, '')), to_tsquery($1, $2)) as rank
          FROM templates
          WHERE to_tsvector($1, COALESCE(name, '') || ' ' || COALESCE(description, '')) @@ to_tsquery($1, $2)
          ORDER BY rank DESC
          LIMIT $3`,
        FTS_CONFIG,
        tsq,
        limitPerType,
      );
      for (const r of rows) {
        results.push({
          id: r.id,
          type: "template",
          title: r.name,
          description: r.description ?? null,
          url: `/templates`,
          metadata: { category: r.category, rank: r.rank },
        });
      }
    }

    if (types.includes("connectors")) {
      const rows: any[] = await prisma.$queryRawUnsafe(
        `SELECT id, name, description, category, is_installed,
            ts_rank(to_tsvector($1, COALESCE(name, '') || ' ' || COALESCE(description, '')), to_tsquery($1, $2)) as rank
          FROM connectors
          WHERE to_tsvector($1, COALESCE(name, '') || ' ' || COALESCE(description, '')) @@ to_tsquery($1, $2)
          ORDER BY rank DESC
          LIMIT $3`,
        FTS_CONFIG,
        tsq,
        limitPerType,
      );
      for (const r of rows) {
        results.push({
          id: r.id,
          type: "connector",
          title: r.name,
          description: r.description ?? null,
          url: `/connectors`,
          metadata: {
            category: r.category,
            isInstalled: r.is_installed,
            rank: r.rank,
          },
        });
      }
    }

    return results;
  }

  private async searchBasic(
    query: string,
    types: SearchableType[],
    limitPerType: number,
  ): Promise<SearchResult[]> {
    const pattern = `%${query}%`;
    const results: SearchResult[] = [];

    if (types.includes("workflows")) {
      const rows = await prisma.workflow.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        },
        take: limitPerType,
      });
      for (const r of rows as any[]) {
        results.push({
          id: r.id,
          type: "workflow",
          title: r.name,
          description: r.description ?? null,
          url: `/workflows/${r.id}`,
          metadata: {
            status: r.status,
            triggerType: (r as any).triggerType,
          },
        });
      }
    }

    if (types.includes("apps")) {
      const rows = await prisma.app.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        },
        take: limitPerType,
      });
      for (const r of rows as any[]) {
        results.push({
          id: r.id,
          type: "app",
          title: r.name,
          description: r.description ?? null,
          url: `/apps/${r.id}`,
          metadata: { type: (r as any).type, status: (r as any).status },
        });
      }
    }

    if (types.includes("templates")) {
      const rows = await prisma.template.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        },
        take: limitPerType,
      });
      for (const r of rows as any[]) {
        results.push({
          id: r.id,
          type: "template",
          title: r.name,
          description: r.description ?? null,
          url: `/templates`,
          metadata: { category: (r as any).category },
        });
      }
    }

    if (types.includes("connectors")) {
      const rows = await prisma.connector.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        },
        take: limitPerType,
      });
      for (const r of rows as any[]) {
        results.push({
          id: r.id,
          type: "connector",
          title: r.name,
          description: r.description ?? null,
          url: `/connectors`,
          metadata: {
            category: (r as any).category,
            isInstalled: (r as any).isInstalled,
          },
        });
      }
    }

    return results;
  }

  async searchExecutions(
    query: string,
    tenantId: string,
    filters?: {
      status?: string;
      workflowId?: string;
      startDate?: Date;
      endDate?: Date;
    },
    limit: number = 20,
  ): Promise<SearchResult[]> {
    const tsq = toTsQuery(query);
    if (tsq) {
      try {
        let sqlStr = `
          SELECT e.id, e.workflow_id, w.name as workflow_name,
            e.status, e.started_at, e.finished_at, e.duration_ms, e.error_message,
            ts_rank(to_tsvector($1, COALESCE(w.name, '')), to_tsquery($1, $2)) as rank
          FROM executions e
          LEFT JOIN workflows w ON e.workflow_id = w.id
          WHERE e.tenant_id = $3
        `;
        const params: any[] = [FTS_CONFIG, tsq, tenantId];
        let paramIdx = 4;
        if (filters?.status) {
          sqlStr += ` AND e.status = $${paramIdx++}`;
          params.push(filters.status);
        }
        if (filters?.workflowId) {
          sqlStr += ` AND e.workflow_id = $${paramIdx++}`;
          params.push(filters.workflowId);
        }
        sqlStr += `
          AND to_tsvector($1, COALESCE(w.name, '')) @@ to_tsquery($1, $2)
          ORDER BY rank DESC
          LIMIT $${paramIdx++}
        `;
        params.push(limit);
        const rows: any[] = await prisma.$queryRawUnsafe(sqlStr, ...params);
        return rows.map((r) => ({
          id: r.id,
          type: "execution",
          title: r.workflow_name ?? "Unknown Workflow",
          description: r.error_message ?? null,
          url: `/executions/${r.id}`,
          metadata: {
            status: r.status,
            workflowId: r.workflow_id,
            durationMs: r.duration_ms,
            startedAt: r.started_at,
            finishedAt: r.finished_at,
          },
        }));
      } catch {
        /* fall through to ilike */
      }
    }

    const where: Record<string, unknown> = { tenantId };
    if (filters?.status) where.status = filters.status;
    if (filters?.workflowId) where.workflowId = filters.workflowId;
    if (filters?.startDate || filters?.endDate) {
      where.startedAt = {
        ...(filters?.startDate ? { gte: filters.startDate } : {}),
        ...(filters?.endDate ? { lte: filters.endDate } : {}),
      };
    }

    const rows = await prisma.workflowExecution.findMany({
      where: {
        ...where,
        workflow: { name: { contains: query, mode: "insensitive" } },
      } as any,
      include: { workflow: { select: { name: true } } },
      take: limit,
    });

    return rows.map((r: any) => ({
      id: r.id,
      type: "execution",
      title: r.workflow?.name ?? "Unknown Workflow",
      description: r.errorMessage ?? null,
      url: `/executions/${r.id}`,
      metadata: {
        status: r.status,
        workflowId: r.workflowId,
        durationMs: r.durationMs,
        startedAt: r.startedAt?.toISOString(),
        finishedAt: r.finishedAt?.toISOString(),
      },
    }));
  }

  async searchAuditLogs(
    query: string,
    tenantId: string,
    filters?: {
      action?: string;
      resource?: string;
      userId?: string;
      startDate?: Date;
      endDate?: Date;
    },
    limit: number = 20,
  ): Promise<SearchResult[]> {
    const tsq = toTsQuery(query);
    if (tsq) {
      try {
        let sqlStr = `
          SELECT id, action, resource_type, resource_id, actor_id, actor_type, metadata, created_at,
            ts_rank(to_tsvector($1, COALESCE(action, '') || ' ' || COALESCE(resource_type, '') || ' ' || COALESCE(actor_id, '')), to_tsquery($1, $2)) as rank
          FROM audit_log
          WHERE tenant_id = $3
        `;
        const params: any[] = [FTS_CONFIG, tsq, tenantId];
        let paramIdx = 4;
        if (filters?.action) {
          sqlStr += ` AND action = $${paramIdx++}`;
          params.push(filters.action);
        }
        if (filters?.resource) {
          sqlStr += ` AND resource_type = $${paramIdx++}`;
          params.push(filters.resource);
        }
        sqlStr += `
          AND to_tsvector($1, COALESCE(action, '') || ' ' || COALESCE(resource_type, '') || ' ' || COALESCE(actor_id, '')) @@ to_tsquery($1, $2)
          ORDER BY rank DESC
          LIMIT $${paramIdx++}
        `;
        params.push(limit);
        const rows: any[] = await prisma.$queryRawUnsafe(sqlStr, ...params);
        return rows.map((r) => ({
          id: r.id,
          type: "audit_log",
          title: `${r.action} ${r.resource_type}`,
          description: r.metadata ? JSON.stringify(r.metadata) : null,
          url: `/audit-logs/${r.id}`,
          metadata: {
            action: r.action,
            resource: r.resource_type,
            resourceId: r.resource_id,
            actorId: r.actor_id,
            actorType: r.actor_type,
            timestamp: r.created_at,
          },
        }));
      } catch {
        /* fall through */
      }
    }

    const where: Record<string, unknown> = { tenantId };
    if (filters?.action) where.action = filters.action;
    if (filters?.resource) where.resourceType = filters.resource;
    if (filters?.userId) where.actorId = filters.userId.toString();
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {
        ...(filters?.startDate ? { gte: filters.startDate } : {}),
        ...(filters?.endDate ? { lte: filters.endDate } : {}),
      };
    }

    const rows = await prisma.auditLog.findMany({ where, take: limit });
    return rows.map((r: any) => ({
      id: r.id,
      type: "audit_log",
      title: `${r.action} ${r.resourceType}`,
      description: r.metadata ? JSON.stringify(r.metadata) : null,
      url: `/audit-logs/${r.id}`,
      metadata: {
        action: r.action,
        resource: r.resourceType,
        resourceId: r.resourceId,
        actorId: r.actorId,
        actorType: r.actorType,
        timestamp: r.createdAt?.toISOString(),
      },
    }));
  }

  async searchAiPrompts(
    query: string,
    tenantId: string,
    filters?: { model?: string },
    limit: number = 20,
  ): Promise<SearchResult[]> {
    const tsq = toTsQuery(query);
    if (tsq) {
      try {
        let sqlStr = `
          SELECT id, name, content, model, created_at,
            ts_rank(to_tsvector($1, COALESCE(name, '') || ' ' || COALESCE(content, '')), to_tsquery($1, $2)) as rank
          FROM prompts
          WHERE to_tsvector($1, COALESCE(name, '') || ' ' || COALESCE(content, '')) @@ to_tsquery($1, $2)
        `;
        const params: any[] = [FTS_CONFIG, tsq];
        let paramIdx = 3;
        if (filters?.model) {
          sqlStr += ` AND model = $${paramIdx++}`;
          params.push(filters.model);
        }
        sqlStr += `
          ORDER BY rank DESC
          LIMIT $${paramIdx++}
        `;
        params.push(limit);
        const rows: any[] = await prisma.$queryRawUnsafe(sqlStr, ...params);
        return rows.map((r) => ({
          id: r.id,
          type: "prompt",
          title: r.name,
          description: r.content?.substring(0, 200) ?? null,
          url: `/prompts/${r.id}`,
          metadata: {
            model: r.model,
            createdAt: r.created_at,
            rank: r.rank,
          },
        }));
      } catch {
        /* fall through */
      }
    }

    const where: Record<string, unknown> = {};
    if (filters?.model) where.model = filters.model;
    const rows = await prisma.aiPrompt.findMany({ where, take: limit });
    return rows.map((r: any) => ({
      id: r.id,
      type: "prompt",
      title: r.name,
      description: r.content?.substring(0, 200) ?? null,
      url: `/prompts/${r.id}`,
      metadata: {
        model: r.model,
        createdAt: r.createdAt?.toISOString(),
      },
    }));
  }
}
