import { eq, desc, sql } from "drizzle-orm";
import { db, dataSourcesTable } from "@longox/db";
import { DataSource } from "../domain/datasource.entity";
import type { DataSourceRepository } from "../domain/datasource-repository";
import type {
  DataSourceKind,
  DataSourceProps,
} from "../domain/datasource.entity";

export class PostgresDataSourceRepository implements DataSourceRepository {
  private toDomain(row: typeof dataSourcesTable.$inferSelect): DataSource {
    return new DataSource({
      id: row.id,
      tenantId: row.tenantId ?? 0,
      name: row.name,
      description: row.description ?? undefined,
      kind: row.kind as DataSourceKind,
      config: (row.config ?? {}) as Record<string, unknown>,
      status: row.status as DataSourceProps["status"],
      lastTestedAt: row.lastTestedAt ?? undefined,
      lastTestError: row.lastTestError ?? undefined,
      createdBy: row.createdBy ?? 0,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async findById(id: string): Promise<DataSource | null> {
    const [row] = await db
      .select()
      .from(dataSourcesTable)
      .where(eq(dataSourcesTable.id, id))
      .limit(1);
    return row ? this.toDomain(row) : null;
  }

  async findByTenantId(
    tenantId: string,
    kind?: DataSourceKind,
  ): Promise<DataSource[]> {
    let query = db
      .select()
      .from(dataSourcesTable)
      .where(eq(dataSourcesTable.tenantId, tenantId))
      .$dynamic();
    if (kind) query = query.where(eq(dataSourcesTable.kind, kind));
    const rows = await query.orderBy(desc(dataSourcesTable.createdAt));
    return rows.map(this.toDomain);
  }

  async create(
    props: Omit<DataSourceProps, "id" | "createdAt" | "updatedAt">,
  ): Promise<DataSource> {
    const [row] = await db
      .insert(dataSourcesTable)
      .values({
        tenantId: props.tenantId,
        name: props.name,
        description: props.description,
        kind: props.kind,
        config: props.config,
        status: props.status,
        createdBy: props.createdBy,
      })
      .returning();
    return this.toDomain(row);
  }

  async update(
    id: string,
    data: Partial<DataSourceProps>,
  ): Promise<DataSource> {
    const [row] = await db
      .update(dataSourcesTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(dataSourcesTable.id, id))
      .returning();
    return this.toDomain(row);
  }

  async delete(id: string): Promise<void> {
    await db.delete(dataSourcesTable).where(eq(dataSourcesTable.id, id));
  }

  async countByTenantId(tenantId: string): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(dataSourcesTable)
      .where(eq(dataSourcesTable.tenantId, tenantId));
    return result.count;
  }
}
