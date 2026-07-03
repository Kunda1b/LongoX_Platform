import { eq, and, gte, lte, or, ilike, sql } from "drizzle-orm";
import {
  db,
  workflowsTable,
  appsTable,
  templatesTable,
  connectorsTable,
  executionsTable,
  auditLogTable,
  promptsTable,
} from "@longox/db";
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
      const rows = await db.execute(
        sql`
          SELECT id, name, description, status, trigger_type,
            ts_rank(to_tsvector(${FTS_CONFIG}, COALESCE(name, '') || ' ' || COALESCE(description, '')), to_tsquery(${FTS_CONFIG}, ${tsq})) as rank
          FROM workflows
          WHERE to_tsvector(${FTS_CONFIG}, COALESCE(name, '') || ' ' || COALESCE(description, '')) @@ to_tsquery(${FTS_CONFIG}, ${tsq})
          ORDER BY rank DESC
          LIMIT ${limitPerType}
        `,
      );
      for (const r of rows.rows as any[]) {
        results.push({
          id: r.id, type: "workflow", title: r.name,
          description: r.description ?? null,
          url: `/workflows/${r.id}`,
          metadata: { status: r.status, triggerType: r.trigger_type, rank: r.rank },
        });
      }
    }

    if (types.includes("apps")) {
      const rows = await db.execute(
        sql`
          SELECT id, name, description, type, status,
            ts_rank(to_tsvector(${FTS_CONFIG}, COALESCE(name, '') || ' ' || COALESCE(description, '')), to_tsquery(${FTS_CONFIG}, ${tsq})) as rank
          FROM apps
          WHERE to_tsvector(${FTS_CONFIG}, COALESCE(name, '') || ' ' || COALESCE(description, '')) @@ to_tsquery(${FTS_CONFIG}, ${tsq})
          ORDER BY rank DESC
          LIMIT ${limitPerType}
        `,
      );
      for (const r of rows.rows as any[]) {
        results.push({
          id: r.id, type: "app", title: r.name,
          description: r.description ?? null,
          url: `/apps/${r.id}`,
          metadata: { type: r.type, status: r.status, rank: r.rank },
        });
      }
    }

    if (types.includes("templates")) {
      const rows = await db.execute(
        sql`
          SELECT id, name, description, category,
            ts_rank(to_tsvector(${FTS_CONFIG}, COALESCE(name, '') || ' ' || COALESCE(description, '')), to_tsquery(${FTS_CONFIG}, ${tsq})) as rank
          FROM templates
          WHERE to_tsvector(${FTS_CONFIG}, COALESCE(name, '') || ' ' || COALESCE(description, '')) @@ to_tsquery(${FTS_CONFIG}, ${tsq})
          ORDER BY rank DESC
          LIMIT ${limitPerType}
        `,
      );
      for (const r of rows.rows as any[]) {
        results.push({
          id: r.id, type: "template", title: r.name,
          description: r.description ?? null,
          url: `/templates`,
          metadata: { category: r.category, rank: r.rank },
        });
      }
    }

    if (types.includes("connectors")) {
      const rows = await db.execute(
        sql`
          SELECT id, name, description, category, is_installed,
            ts_rank(to_tsvector(${FTS_CONFIG}, COALESCE(name, '') || ' ' || COALESCE(description, '')), to_tsquery(${FTS_CONFIG}, ${tsq})) as rank
          FROM connectors
          WHERE to_tsvector(${FTS_CONFIG}, COALESCE(name, '') || ' ' || COALESCE(description, '')) @@ to_tsquery(${FTS_CONFIG}, ${tsq})
          ORDER BY rank DESC
          LIMIT ${limitPerType}
        `,
      );
      for (const r of rows.rows as any[]) {
        results.push({
          id: r.id, type: "connector", title: r.name,
          description: r.description ?? null,
          url: `/connectors`,
          metadata: { category: r.category, isInstalled: r.is_installed, rank: r.rank },
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
      const rows = await db
        .select()
        .from(workflowsTable)
        .where(
          or(
            ilike(workflowsTable.name, pattern),
            ilike(workflowsTable.description, pattern),
          ),
        )
        .limit(limitPerType);
      for (const r of rows)
        results.push({
          id: r.id, type: "workflow", title: r.name,
          description: r.description ?? null,
          url: `/workflows/${r.id}`,
          metadata: { status: r.status, triggerType: r.triggerType },
        });
    }

    if (types.includes("apps")) {
      const rows = await db
        .select()
        .from(appsTable)
        .where(
          or(
            ilike(appsTable.name, pattern),
            ilike(appsTable.description, pattern),
          ),
        )
        .limit(limitPerType);
      for (const r of rows)
        results.push({
          id: r.id, type: "app", title: r.name,
          description: r.description ?? null,
          url: `/apps/${r.id}`,
          metadata: { type: r.type, status: r.status },
        });
    }

    if (types.includes("templates")) {
      const rows = await db
        .select()
        .from(templatesTable)
        .where(
          or(
            ilike(templatesTable.name, pattern),
            ilike(templatesTable.description, pattern),
          ),
        )
        .limit(limitPerType);
      for (const r of rows)
        results.push({
          id: r.id, type: "template", title: r.name,
          description: r.description ?? null,
          url: `/templates`,
          metadata: { category: r.category },
        });
    }

    if (types.includes("connectors")) {
      const rows = await db
        .select()
        .from(connectorsTable)
        .where(
          or(
            ilike(connectorsTable.name, pattern),
            ilike(connectorsTable.description, pattern),
          ),
        )
        .limit(limitPerType);
      for (const r of rows)
        results.push({
          id: r.id, type: "connector", title: r.name,
          description: r.description ?? null,
          url: `/connectors`,
          metadata: { category: r.category, isInstalled: r.isInstalled },
        });
    }

    return results;
  }

  async searchExecutions(
    query: string,
    tenantId: number,
    filters?: {
      status?: string;
      workflowId?: number;
      startDate?: Date;
      endDate?: Date;
    },
    limit: number = 20,
  ): Promise<SearchResult[]> {
    const conditions = [eq(executionsTable.tenantId, tenantId)];

    if (filters?.status) {
      conditions.push(eq(executionsTable.status, filters.status));
    }
    if (filters?.workflowId) {
      conditions.push(eq(executionsTable.workflowId, filters.workflowId));
    }
    if (filters?.startDate) {
      conditions.push(gte(executionsTable.startedAt, filters.startDate));
    }
    if (filters?.endDate) {
      conditions.push(lte(executionsTable.startedAt, filters.endDate));
    }

    const tsq = toTsQuery(query);
    if (tsq) {
      try {
        const queryBuilder = sql`
          SELECT e.id, e.workflow_id, w.name as workflow_name,
            e.status, e.started_at, e.finished_at, e.duration_ms, e.error_message,
            ts_rank(to_tsvector(${FTS_CONFIG}, COALESCE(w.name, '')), to_tsquery(${FTS_CONFIG}, ${tsq})) as rank
          FROM executions e
          LEFT JOIN workflows w ON e.workflow_id = w.id
          WHERE e.tenant_id = ${tenantId}
        `;
        if (filters?.status) {
          queryBuilder.append(sql` AND e.status = ${filters.status}`);
        }
        if (filters?.workflowId) {
          queryBuilder.append(sql` AND e.workflow_id = ${filters.workflowId}`);
        }
        queryBuilder.append(sql`
          AND to_tsvector(${FTS_CONFIG}, COALESCE(w.name, '')) @@ to_tsquery(${FTS_CONFIG}, ${tsq})
          ORDER BY rank DESC
          LIMIT ${limit}
        `);
        const rows = await db.execute(queryBuilder);
        return (rows.rows as any[]).map((r) => ({
          id: r.id, type: "execution",
          title: r.workflow_name ?? "Unknown Workflow",
          description: r.error_message ?? null,
          url: `/executions/${r.id}`,
          metadata: {
            status: r.status, workflowId: r.workflow_id,
            durationMs: r.duration_ms,
            startedAt: r.started_at, finishedAt: r.finished_at,
          },
        }));
      } catch {
        /* fall through to ilike */
      }
    }

    const pattern = `%${query}%`;
    const rows = await db
      .select({
        id: executionsTable.id,
        workflowId: executionsTable.workflowId,
        workflowName: workflowsTable.name,
        status: executionsTable.status,
        startedAt: executionsTable.startedAt,
        finishedAt: executionsTable.finishedAt,
        durationMs: executionsTable.durationMs,
        errorMessage: executionsTable.errorMessage,
      })
      .from(executionsTable)
      .leftJoin(workflowsTable, eq(executionsTable.workflowId, workflowsTable.id))
      .where(and(...conditions, ilike(workflowsTable.name, pattern)))
      .limit(limit);

    return rows.map((r) => ({
      id: r.id, type: "execution",
      title: r.workflowName ?? "Unknown Workflow",
      description: r.errorMessage ?? null,
      url: `/executions/${r.id}`,
      metadata: {
        status: r.status, workflowId: r.workflowId,
        durationMs: r.durationMs,
        startedAt: r.startedAt?.toISOString(),
        finishedAt: r.finishedAt?.toISOString(),
      },
    }));
  }

  async searchAuditLogs(
    query: string,
    tenantId: number,
    filters?: {
      action?: string;
      resource?: string;
      userId?: number;
      startDate?: Date;
      endDate?: Date;
    },
    limit: number = 20,
  ): Promise<SearchResult[]> {
    const tsq = toTsQuery(query);
    if (tsq) {
      try {
        const queryBuilder = sql`
          SELECT id, action, resource_type, resource_id, actor_id, actor_type, metadata, created_at,
            ts_rank(to_tsvector(${FTS_CONFIG}, COALESCE(action, '') || ' ' || COALESCE(resource_type, '') || ' ' || COALESCE(actor_id, '')), to_tsquery(${FTS_CONFIG}, ${tsq})) as rank
          FROM audit_log
          WHERE tenant_id = ${tenantId}
        `;
        if (filters?.action) {
          queryBuilder.append(sql` AND action = ${filters.action}`);
        }
        if (filters?.resource) {
          queryBuilder.append(sql` AND resource_type = ${filters.resource}`);
        }
        queryBuilder.append(sql`
          AND to_tsvector(${FTS_CONFIG}, COALESCE(action, '') || ' ' || COALESCE(resource_type, '') || ' ' || COALESCE(actor_id, '')) @@ to_tsquery(${FTS_CONFIG}, ${tsq})
          ORDER BY rank DESC
          LIMIT ${limit}
        `);
        const rows = await db.execute(queryBuilder);
        return (rows.rows as any[]).map((r) => ({
          id: r.id, type: "audit_log",
          title: `${r.action} ${r.resource_type}`,
          description: r.metadata ? JSON.stringify(r.metadata) : null,
          url: `/audit-logs/${r.id}`,
          metadata: {
            action: r.action, resource: r.resource_type,
            resourceId: r.resource_id, actorId: r.actor_id,
            actorType: r.actor_type, timestamp: r.created_at,
          },
        }));
      } catch {
        /* fall through */
      }
    }

    const conditions = [eq(auditLogTable.tenantId, tenantId)];
    if (filters?.action) conditions.push(eq(auditLogTable.action, filters.action));
    if (filters?.resource) conditions.push(eq(auditLogTable.resourceType, filters.resource));
    if (filters?.userId) conditions.push(eq(auditLogTable.actorId, filters.userId.toString()));
    if (filters?.startDate) conditions.push(gte(auditLogTable.createdAt, filters.startDate));
    if (filters?.endDate) conditions.push(lte(auditLogTable.createdAt, filters.endDate));

    const rows = await db
      .select()
      .from(auditLogTable)
      .where(and(...conditions))
      .limit(limit);
    return rows.map((r) => ({
      id: r.id, type: "audit_log",
      title: `${r.action} ${r.resourceType}`,
      description: r.metadata ? JSON.stringify(r.metadata) : null,
      url: `/audit-logs/${r.id}`,
      metadata: {
        action: r.action, resource: r.resourceType,
        resourceId: r.resourceId, actorId: r.actorId,
        actorType: r.actorType, timestamp: r.createdAt?.toISOString(),
      },
    }));
  }

  async searchAiPrompts(
    query: string,
    tenantId: number,
    filters?: { model?: string },
    limit: number = 20,
  ): Promise<SearchResult[]> {
    const tsq = toTsQuery(query);
    if (tsq) {
      try {
        const queryBuilder = sql`
          SELECT id, name, content, model, created_at,
            ts_rank(to_tsvector(${FTS_CONFIG}, COALESCE(name, '') || ' ' || COALESCE(content, '')), to_tsquery(${FTS_CONFIG}, ${tsq})) as rank
          FROM prompts
          WHERE to_tsvector(${FTS_CONFIG}, COALESCE(name, '') || ' ' || COALESCE(content, '')) @@ to_tsquery(${FTS_CONFIG}, ${tsq})
        `;
        if (filters?.model) {
          queryBuilder.append(sql` AND model = ${filters.model}`);
        }
        queryBuilder.append(sql`
          ORDER BY rank DESC
          LIMIT ${limit}
        `);
        const rows = await db.execute(queryBuilder);
        return (rows.rows as any[]).map((r) => ({
          id: r.id, type: "prompt", title: r.name,
          description: r.content?.substring(0, 200) ?? null,
          url: `/prompts/${r.id}`,
          metadata: { model: r.model, createdAt: r.created_at, rank: r.rank },
        }));
      } catch {
        /* fall through */
      }
    }

    const conditions: any[] = [];
    if (filters?.model) conditions.push(eq(promptsTable.model, filters.model));
    const rows = await db
      .select()
      .from(promptsTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(limit);
    return rows.map((r) => ({
      id: r.id, type: "prompt", title: r.name,
      description: r.content?.substring(0, 200) ?? null,
      url: `/prompts/${r.id}`,
      metadata: { model: r.model, createdAt: r.createdAt?.toISOString() },
    }));
  }
}
