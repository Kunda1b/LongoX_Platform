import { prisma } from "@longox/db/prisma";

interface IndexData {
  title: string;
  content: string;
  tenantId?: string | null;
  permissionResource?: string | null;
  permissionAction?: string | null;
  metadata?: Record<string, unknown>;
}

interface SearchOptions {
  tenantId?: string | null;
  resourceTypes?: string[];
  limit?: number;
  offset?: number;
  permissionFilter?: { resource: string; action: string } | null;
}

interface SearchResult {
  id: string;
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
  () => Promise<{ resourceType: string; id: string; title: string; content: string; tenantId: string | null }[]>
> = {
  workflow: async () => {
    const rows = (await prisma.workflow.findMany({
      select: { id: true, name: true, description: true, tenantId: true } as any,
    })) as any[];
    return rows.map((r) => ({
      resourceType: "workflow",
      id: r.id,
      title: r.name,
      content: r.description ?? "",
      tenantId: r.tenantId,
    }));
  },
  app: async () => {
    const rows = (await prisma.app.findMany({
      select: { id: true, name: true, description: true } as any,
    })) as any[];
    return rows.map((r) => ({
      resourceType: "app",
      id: r.id,
      title: r.name,
      content: r.description ?? "",
      tenantId: null,
    }));
  },
  template: async () => {
    const rows = (await prisma.template.findMany({
      select: { id: true, name: true, description: true } as any,
    })) as any[];
    return rows.map((r) => ({
      resourceType: "template",
      id: r.id,
      title: r.name,
      content: r.description ?? "",
      tenantId: null,
    }));
  },
  connector: async () => {
    const rows = (await prisma.connector.findMany({
      select: { id: true, name: true, description: true } as any,
    })) as any[];
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
    // ─── ADR-010: Use pre-computed tsvector generated columns ──────────────
    // title_tsv and content_tsv are GENERATED ALWAYS columns in the DB
    // (migration 007). We don't need to compute to_tsvector at INSERT time —
    // the DB does it automatically. We also don't need a separate `tsv`
    // column — the GIN indexes on title_tsv and content_tsv handle search.
    await prisma.$executeRaw`
      INSERT INTO search_index (id, resource_type, resource_id, title, content, tenant_id, permission_resource, permission_action, metadata, created_at, updated_at)
      VALUES (
        encode(gen_random_bytes(12), 'hex'),
        ${resourceType},
        ${resourceId},
        ${data.title},
        ${data.content},
        ${data.tenantId ?? null},
        ${data.permissionResource ?? null},
        ${data.permissionAction ?? null},
        ${JSON.stringify(data.metadata ?? {})}::jsonb,
        NOW(),
        NOW()
      )
      ON CONFLICT (resource_type, resource_id)
      DO UPDATE SET
        title = EXCLUDED.title,
        content = EXCLUDED.content,
        tenant_id = EXCLUDED.tenant_id,
        permission_resource = EXCLUDED.permission_resource,
        permission_action = EXCLUDED.permission_action,
        metadata = EXCLUDED.metadata,
        updated_at = NOW()
    `;
  }

  async search(
    query: string,
    options: SearchOptions = {},
  ): Promise<SearchResponse> {
    const limit = options.limit ?? 20;
    const offset = options.offset ?? 0;
    const page = Math.floor(offset / limit) + 1;

    // Build SQL with parameterized values via $queryRawUnsafe to support FTS.
    const tenantId = options.tenantId ?? null;
    const resourceTypes = options.resourceTypes ?? null;
    const permFilter = options.permissionFilter ?? null;

    const params: unknown[] = [query];
    // ─── ADR-010: Use pre-computed tsvector columns with GIN indexes ────────
    // Query uses title_tsv || content_tsv (both are GENERATED ALWAYS columns
    // with GIN indexes from migration 007). This avoids runtime tsvector
    // computation on every search.
    let whereSql = `(title_tsv @@ websearch_to_tsquery('english', $1) OR content_tsv @@ websearch_to_tsquery('english', $1))`;
    let paramIdx = 2;

    if (tenantId !== null && tenantId !== undefined) {
      params.push(tenantId);
      whereSql += ` AND (tenant_id = $${paramIdx} OR tenant_id IS NULL)`;
      paramIdx++;
    }

    if (resourceTypes && resourceTypes.length > 0) {
      const placeholders = resourceTypes
        .map((_, i) => `$${paramIdx + i}`)
        .join(",");
      params.push(...resourceTypes);
      whereSql += ` AND resource_type IN (${placeholders})`;
      paramIdx += resourceTypes.length;
    }

    if (permFilter) {
      params.push(permFilter.resource);
      whereSql += ` AND (permission_resource = $${paramIdx} OR permission_resource IS NULL)`;
      paramIdx++;
      params.push(permFilter.action);
      whereSql += ` AND (permission_action = $${paramIdx} OR permission_action IS NULL)`;
      paramIdx++;
    }

    // Count query
    const countSql = `SELECT COUNT(*)::int AS total FROM search_index WHERE ${whereSql}`;
    const countRows = (await prisma.$queryRawUnsafe<{ total: number }[]>(
      countSql,
      ...params,
    )) as { total: number }[];
    const total = Number(countRows[0]?.total ?? 0);

    // Main query with rank
    const mainSql = `
      SELECT
        id,
        resource_type,
        resource_id,
        title,
        content,
        ts_rank(title_tsv || content_tsv, websearch_to_tsquery('english', $1)) AS rank,
        metadata
      FROM search_index
      WHERE ${whereSql}
      ORDER BY rank DESC
      LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
    `;
    params.push(limit, offset);

    const rows = (await prisma.$queryRawUnsafe<any[]>(mainSql, ...params)) as any[];

    const results: SearchResult[] = rows.map((r) => ({
      id: String(r.id),
      resourceType: r.resource_type,
      resourceId: r.resource_id,
      title: r.title,
      snippet: r.content ? String(r.content).substring(0, 200) : "",
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
    await prisma.searchIndex.deleteMany({
      where: { resourceType, resourceId } as any,
    });
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
