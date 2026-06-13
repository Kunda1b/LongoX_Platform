import { ilike, or, eq, and, gte, lte } from "drizzle-orm";
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

export class PostgresSearchRepository implements SearchRepository {
  async search(
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
          id: r.id,
          type: "workflow",
          title: r.name,
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
          id: r.id,
          type: "app",
          title: r.name,
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
          id: r.id,
          type: "template",
          title: r.name,
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
          id: r.id,
          type: "connector",
          title: r.name,
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
    const pattern = `%${query}%`;
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
      .where(and(...conditions))
      .limit(limit);

    return rows.map((r) => ({
      id: r.id,
      type: "execution",
      title: r.workflowName ?? "Unknown Workflow",
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
    const conditions = [eq(auditLogTable.tenantId, tenantId)];

    if (filters?.action) {
      conditions.push(eq(auditLogTable.action, filters.action));
    }
    if (filters?.resource) {
      conditions.push(eq(auditLogTable.resourceType, filters.resource));
    }
    if (filters?.userId) {
      conditions.push(eq(auditLogTable.actorId, filters.userId.toString()));
    }
    if (filters?.startDate) {
      conditions.push(gte(auditLogTable.createdAt, filters.startDate));
    }
    if (filters?.endDate) {
      conditions.push(lte(auditLogTable.createdAt, filters.endDate));
    }

    const rows = await db
      .select()
      .from(auditLogTable)
      .where(and(...conditions))
      .limit(limit);

    return rows.map((r) => ({
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
    tenantId: number,
    filters?: {
      model?: string;
    },
    limit: number = 20,
  ): Promise<SearchResult[]> {
    const conditions = [];

    if (filters?.model) {
      conditions.push(eq(promptsTable.model, filters.model));
    }

    const rows = await db
      .select()
      .from(promptsTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(limit);

    return rows.map((r) => ({
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
