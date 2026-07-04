/**
 * Prisma-based connector repository.
 *
 * Migrated from Drizzle to Prisma per ADR-013 Phase 3.
 * Uses `prisma.connector` delegate with `as any` casts for legacy columns
 * (`displayName`, `version`, `sdkVersion`, `color`, `author`, `permissions`,
 * `capabilities`, `authConfig`, `certificationLevel`, `rateLimit`,
 * `isFeatured`, `status`, `metadata`, etc.) not reflected on the Prisma model.
 */

import { prisma } from "@longox/db/prisma";
import { Connector } from "../domain/connector.entity";
import type { ConnectorRepository } from "../domain/connector-repository";
import type {
  ConnectorCategory,
  ConnectorProps,
} from "../domain/connector.entity";

export class PostgresConnectorRepository implements ConnectorRepository {
  private toDomain(row: any): Connector {
    return new Connector({
      id: row.id,
      name: row.name,
      displayName: row.displayName ?? undefined,
      version: row.version,
      sdkVersion: row.sdkVersion,
      category: row.category as ConnectorCategory,
      description: row.description,
      icon: row.icon,
      color: row.color ?? "",
      author: row.author ?? "",
      documentationUrl: row.documentationUrl ?? undefined,
      permissions: (row.permissions ?? []) as string[],
      capabilities: (row.capabilities ?? {}) as ConnectorProps["capabilities"],
      authType: row.authType as ConnectorProps["authType"],
      authConfig: (row.authConfig ?? {}) as ConnectorProps["authConfig"],
      certificationLevel:
        row.certificationLevel as ConnectorProps["certificationLevel"],
      rateLimit: (row.rateLimit ?? {
        requestsPerMinute: 60,
        burst: 10,
      }) as ConnectorProps["rateLimit"],
      isFeatured: row.isFeatured ?? false,
      status: (row.status as ConnectorProps["status"]) ?? "active",
      metadata: (row.metadata ?? {}) as Record<string, unknown>,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async findById(id: string): Promise<Connector | null> {
    const row = await prisma.connector.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findByName(name: string): Promise<Connector | null> {
    const rows = await prisma.connector.findMany({
      where: { name } as any,
      take: 1,
    });
    return rows.length > 0 ? this.toDomain(rows[0]) : null;
  }

  async findAll(
    category?: ConnectorCategory,
    search?: string,
  ): Promise<Connector[]> {
    const where: Record<string, unknown> = {};
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const rows = await prisma.connector.findMany({
      where: where as any,
      orderBy: [{ isFeatured: "desc" } as any, { name: "asc" }],
    });

    return rows.map((r) => this.toDomain(r));
  }

  async findFeatured(): Promise<Connector[]> {
    const rows = await prisma.connector.findMany({
      where: { isFeatured: true } as any,
      orderBy: { name: "asc" },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async create(
    props: Omit<ConnectorProps, "id" | "createdAt" | "updatedAt">,
  ): Promise<Connector> {
    const row = await prisma.connector.create({
      data: {
        name: props.name,
        displayName: props.displayName,
        version: props.version,
        sdkVersion: props.sdkVersion,
        category: props.category,
        description: props.description,
        icon: props.icon,
        color: props.color,
        author: props.author,
        documentationUrl: props.documentationUrl,
        permissions: props.permissions,
        capabilities: props.capabilities,
        authType: props.authType,
        authConfig: props.authConfig,
        certificationLevel: props.certificationLevel,
        rateLimit: props.rateLimit,
        isFeatured: props.isFeatured,
        status: props.status,
        metadata: props.metadata,
      } as any,
    });
    return this.toDomain(row);
  }

  async update(id: string, data: Partial<ConnectorProps>): Promise<Connector> {
    const row = await prisma.connector.update({
      where: { id },
      data: { ...data, updatedAt: new Date() } as any,
    });
    return this.toDomain(row);
  }

  async delete(id: string): Promise<void> {
    await prisma.connector.delete({ where: { id } });
  }
}
