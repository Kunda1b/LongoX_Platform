/**
 * Prisma-based audit repository.
 *
 * Migrated from Drizzle to Prisma per ADR-013 Phase 3.
 * Uses `prisma.auditLog` delegate with `as any` casts for legacy columns.
 */

import { prisma } from "@longox/db/prisma";
import type { AuditRepository } from "../../domain/audit/audit-repository";
import type {
  AuditEntry,
  AuditLogFilter,
} from "../../domain/audit/audit-entry.entity";

export class PostgresAuditRepository implements AuditRepository {
  async findAll(filter: AuditLogFilter): Promise<AuditEntry[]> {
    const limit = Math.min(filter.limit ?? 100, 500);
    const where: Record<string, unknown> = {};
    if (filter.resourceType) where.resourceType = filter.resourceType;
    if (filter.resourceId) where.resourceId = filter.resourceId;
    if (filter.action) where.action = filter.action;

    const rows = await prisma.auditLog.findMany({
      where: where as any,
      orderBy: { createdAt: "desc" } as any,
      take: limit,
    });

    return rows.map((e: any) => ({
      id: e.id,
      actorType: e.actorType,
      actorId: e.actorId ?? null,
      action: e.action,
      resourceType: e.resourceType,
      resourceId: e.resourceId,
      metadata: (e.metadata ?? null) as Record<string, unknown> | null,
      createdAt: e.createdAt.toISOString(),
    }));
  }
}
