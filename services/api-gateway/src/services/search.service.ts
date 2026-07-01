import { sql, eq, and, count, inArray } from "drizzle-orm";
import { db, searchIndexTable, toTsVector } from "@longox/db";
import { workflowsTable } from "@longox/db/schema";
import { appsTable } from "@longox/db/schema";
import { templatesTable } from "@longox/db/schema";
import { connectorsTable } from "@longox/db/schema";

interface IndexData {
  title: string;
  content: string;
  tenantId?: number | null;
  permissionResource?: string | null;
  permissionAction?: string | null;
  metadata?: Record<string, unknown>;
}

interface SearchOptions {
  tenantId?: number | null;
  resourceTypes?: string[];
  limit?: number;
  offset?: number;
  permissionFilter?: { resource: string; action: string } | null;
}

interface SearchResult {
  id: number;
  resourceType: string;
  resourceId: string;
  title: string;
  snippet: string;
  rank: number;
  metadata: Record<string, unknown>;
}

interface SearchResponse {
  results: SearchResult[];
  total: number;
  page: number;
  pageSize: number;
}

const resourceQueries: Record<
  string,
  () => Promise<{ resourceType: string; id: number; title: string; content: string; tenantId: number | null }[]>
> = {
  workflow: async () => {
    const rows = await db
      .select({
        id: workflowsTable.id,
        name: workflowsTable.name,
        description: workflowsTable.description,
        tenantId: workflowsTable.tenantId,
      })
      .from(workflowsTable);
    return rows.map((r) => ({
      resourceType: "workflow",
      id: r.id,
      title: r.name,
      content: r.description ?? "",
      tenantId: r.tenantId,
    }));
  },
  app: async () => {
    const rows = await db
      .select({
        id: appsTable.id,
        name: appsTable.name,
        description: appsTable.description,
      })
      .from(appsTable);
    return rows.map((r) => ({
      resourceType: "app",
      id: r.id,
      title: r.name,
      content: r.description ?? "",
      tenantId: null,
    }));
  },
  template: async () => {
    const rows = await db
      .select({
        id: templatesTable.id,
        name: templatesTable.name,
        description: templatesTable.description,
      })
      .from(templatesTable);
    return rows.map((r) => ({
      resourceType: "template",
      id: r.id,
      title: r.name,
      content: r.description ?? "",
      tenantId: null,
    }));
  },
  connector: async () => {
    const rows = await db
      .select({
        id: connectorsTable.id,
        name: connectorsTable.name,
        description: connectorsTable.description,
      })
      .from(connectorsTable);
    return rows.map((r) => ({
      resourceType: "connector",
      id: r.id,
      title: r.name,
      content: r.description ?? "",
      tenantId: null,
    }));
  },
};

export class FtsSearchService {
  async index(
    resourceType: string,
    resourceId: string,
    data: IndexData,
  ): Promise<void> {
    const tsv = toTsVector(`${data.title} ${data.content}`);
    await db
      .insert(searchIndexTable)
      .values({
        resourceType,
        resourceId,
        title: data.title,
        content: data.content,
        tsv,
        tenantId: data.tenantId ?? null,
        permissionResource: data.permissionResource ?? null,
        permissionAction: data.permissionAction ?? null,
        metadata: (data.metadata ?? {}) as Record<string, unknown>,
      })
      .onConflictDoUpdate({
        target: [searchIndexTable.resourceType, searchIndexTable.resourceId],
        set: {
          title: data.title,
          content: data.content,
          tsv,
          tenantId: data.tenantId ?? null,
          permissionResource: data.permissionResource ?? null,
          permissionAction: data.permissionAction ?? null,
          metadata: (data.metadata ?? {}) as Record<string, unknown>,
          updatedAt: new Date(),
        },
      });
  }

  async search(
    query: string,
    options: SearchOptions = {},
  ): Promise<SearchResponse> {
    const limit = options.limit ?? 20;
    const offset = options.offset ?? 0;
    const page = Math.floor(offset / limit) + 1;

    const conditions: ReturnType<typeof sql>[] = [
      sql`${searchIndexTable.tsv} @@ websearch_to_tsquery('english', ${query})`,
    ];

    if (options.tenantId !== undefined && options.tenantId !== null) {
      conditions.push(
        sql`(${searchIndexTable.tenantId} = ${options.tenantId} OR ${searchIndexTable.tenantId} IS NULL)`,
      );
    }

    if (options.resourceTypes && options.resourceTypes.length > 0) {
      conditions.push(inArray(searchIndexTable.resourceType, options.resourceTypes));
    }

    if (options.permissionFilter) {
      conditions.push(
        sql`(${searchIndexTable.permissionResource} = ${options.permissionFilter.resource} OR ${searchIndexTable.permissionResource} IS NULL)`,
      );
      conditions.push(
        sql`(${searchIndexTable.permissionAction} = ${options.permissionFilter.action} OR ${searchIndexTable.permissionAction} IS NULL)`,
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await db
      .select({ total: count() })
      .from(searchIndexTable)
      .where(whereClause);

    const total = Number(countResult?.total ?? 0);

    const rankCol = sql`ts_rank(${searchIndexTable.tsv}, websearch_to_tsquery('english', ${query}))`.as("rank");

    const rows = await db
      .select({
        id: searchIndexTable.id,
        resourceType: searchIndexTable.resourceType,
        resourceId: searchIndexTable.resourceId,
        title: searchIndexTable.title,
        content: searchIndexTable.content,
        rank: rankCol,
        metadata: searchIndexTable.metadata,
      })
      .from(searchIndexTable)
      .where(whereClause)
      .orderBy(sql`rank DESC`)
      .limit(limit)
      .offset(offset);

    const results: SearchResult[] = rows.map((r) => ({
      id: r.id,
      resourceType: r.resourceType,
      resourceId: r.resourceId,
      title: r.title,
      snippet: r.content ? r.content.substring(0, 200) : "",
      rank: Number(r.rank),
      metadata: (r.metadata ?? {}) as Record<string, unknown>,
    }));

    return { results, total, page, pageSize: limit };
  }

  async reindexResource(
    resourceType: string,
    resourceId: string,
  ): Promise<void> {
    const q = resourceQueries[resourceType];
    if (!q) return;
    const allResources = await q();
    const resource = allResources.find((r) => String(r.id) === resourceId);
    if (!resource) return;
    await this.index(resource.resourceType, String(resource.id), {
      title: resource.title,
      content: resource.content,
      tenantId: resource.tenantId,
    });
  }

  async removeFromIndex(
    resourceType: string,
    resourceId: string,
  ): Promise<void> {
    await db
      .delete(searchIndexTable)
      .where(
        and(
          eq(searchIndexTable.resourceType, resourceType),
          eq(searchIndexTable.resourceId, resourceId),
        ),
      );
  }

  async bulkReindex(resourceType?: string): Promise<{ reindexed: number }> {
    let count = 0;
    const typesToReindex = resourceType
      ? [resourceType]
      : Object.keys(resourceQueries);

    for (const rt of typesToReindex) {
      const q = resourceQueries[rt];
      if (!q) continue;
      const resources = await q();
      for (const r of resources) {
        await this.index(r.resourceType, String(r.id), {
          title: r.title,
          content: r.content,
          tenantId: r.tenantId,
        });
        count++;
      }
    }
    return { reindexed: count };
  }
}

export const ftsSearchService = new FtsSearchService();
