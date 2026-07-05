/**
 * Prisma-based search repository.
 *
 * Migrated from Drizzle to Prisma per ADR-013 Phase 3.
 * Uses `prisma.$queryRawUnsafe()` for FTS queries and Prisma delegates for basic lookups.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * ADR-010 — Pre-computed tsvector columns on ALL searchable tables.
 *
 * Per architecture.md §26.11: "Every searchable table gets a generated
 * tsvector column (workflow_name_tsv, connector_desc_tsv, etc.) with a
 * GIN index." Migration 009 adds these columns to workflows, apps,
 * templates, and connectors. This repository now queries the pre-computed
 * columns instead of calling to_tsvector() at runtime.
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
            ts_rank(name_tsv || desc_tsv, to_tsquery($1, $2)) as rank
          FROM workflows
          WHERE (name_tsv || desc_tsv) @@ to_tsquery($1, $2)
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
            ts_rank(name_tsv || desc_tsv, to_tsquery($1, $2)) as rank
          FROM apps
          WHERE (name_tsv || desc_tsv) @@ to_tsquery($1, $2)
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
            ts_rank(name_tsv || desc_tsv, to_tsquery($1, $2)) as rank
          FROM templates
          WHERE (name_tsv || desc_tsv) @@ to_tsquery($1, $2)
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
            ts_rank(name_tsv || desc_tsv, to_tsquery($1, $2)) as rank
          FROM connectors
          WHERE (name_tsv || desc_tsv) @@ to_tsquery($1, $2)
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
            ts_rank(w.name_tsv, to_tsquery($1, $2)) as rank
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
          AND w.name_tsv @@ to_tsquery($1, $2)
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
        // Uses the `fts` generated column + GIN index already created by
        // migration 002 (idx_audit_log_fts) instead of computing
        // to_tsvector() at query time — this is the runtime-cost problem
        // ADR-010 exists to prevent. Also fixes a latent bug: the previous
        // version's "AS rank" text was inside a `--` comment, so it was
        // never actually applied as a SQL alias, meaning `ORDER BY rank`
        // always threw and this path silently fell back to the unranked
        // Prisma query below on every call.
        let sqlStr = `
          SELECT id, action, resource_type, resource_id, actor_id, actor_type, metadata, created_at,
            ts_rank(fts, to_tsquery($1, $2)) AS rank
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
          AND fts @@ to_tsquery($1, $2)
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
        // Uses the `fts` generated column + GIN index already created by
        // migration 002 (idx_prompts_fts). Also fixes the same missing
        // "AS rank" alias bug described in searchAuditLogs above.
        let sqlStr = `
          SELECT id, name, content, model, created_at,
            ts_rank(fts, to_tsquery($1, $2)) AS rank
          FROM prompts
          WHERE fts @@ to_tsquery($1, $2)
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
