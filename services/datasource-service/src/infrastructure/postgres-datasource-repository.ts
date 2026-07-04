/**
 * Prisma-based data source repository.
 *
 * Migrated from Drizzle to Prisma per ADR-013 Phase 3.
 * Uses `prisma.dataSource` delegate with `as any` casts for legacy columns.
 */

import { prisma } from "@longox/db/prisma";
import { DataSource } from "../domain/datasource.entity";
import type { DataSourceRepository } from "../domain/datasource-repository";
import type {
  DataSourceKind,
  DataSourceProps,
} from "../domain/datasource.entity";

export class PostgresDataSourceRepository implements DataSourceRepository {
  private toDomain(row: any): DataSource {
    return new DataSource({
      id: row.id,
      tenantId: row.tenantId ?? "",
      name: row.name,
      description: row.description ?? undefined,
      kind: row.kind as DataSourceKind,
      config: ((row.configJson ?? row.config) ?? {}) as Record<string, unknown>,
      status: (row.status ?? (row.isActive ? "active" : "inactive")) as DataSourceProps["status"],
      lastTestedAt: row.lastTestedAt ?? undefined,
      lastTestError: row.lastTestError ?? undefined,
      createdBy: row.createdBy ?? "",
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async findById(id: string): Promise<DataSource | null> {
    const row = await prisma.dataSource.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findByTenantId(
    tenantId: string,
    kind?: DataSourceKind,
  ): Promise<DataSource[]> {
    const where: Record<string, unknown> = { tenantId };
    if (kind) where.kind = kind;
    const rows = await prisma.dataSource.findMany({
      where: where as any,
      orderBy: { createdAt: "desc" },
    });
    return rows.map((r: any) => this.toDomain(r));
  }

  async create(
    props: Omit<DataSourceProps, "id" | "createdAt" | "updatedAt">,
  ): Promise<DataSource> {
    const row = await prisma.dataSource.create({
      data: {
        tenantId: props.tenantId,
        name: props.name,
        description: props.description,
        kind: props.kind,
        configJson: props.config,
        config: props.config,
        isActive: props.status === "active",
        status: props.status,
        lastTestedAt: props.lastTestedAt,
        lastTestError: props.lastTestError,
        createdBy: props.createdBy,
      } as any,
    });
    return this.toDomain(row);
  }

  async update(
    id: string,
    data: Partial<DataSourceProps>,
  ): Promise<DataSource> {
    const payload: Record<string, unknown> = { ...data, updatedAt: new Date() };
    if (data.config) {
      payload.configJson = data.config;
    }
    if (data.status) {
      payload.isActive = data.status === "active";
    }
    const row = await prisma.dataSource.update({
      where: { id },
      data: payload as any,
    });
    return this.toDomain(row);
  }

  async delete(id: string): Promise<void> {
    await prisma.dataSource.delete({ where: { id } });
  }

  async countByTenantId(tenantId: string): Promise<number> {
    return prisma.dataSource.count({ where: { tenantId } });
  }
}
