import { eq, and, desc } from "drizzle-orm";
import { db, auditLogTable } from "@longox/db";
import type { AuditRepository } from "../../domain/audit/audit-repository";
import type {
  AuditEntry,
  AuditLogFilter,
} from "../../domain/audit/audit-entry.entity";

export class PostgresAuditRepository implements AuditRepository {
  async findAll(filter: AuditLogFilter): Promise<AuditEntry[]> {
    const limit = Math.min(filter.limit ?? 100, 500);
    const conditions = [];
    if (filter.resourceType)
      conditions.push(eq(auditLogTable.resourceType, filter.resourceType));
    if (filter.resourceId)
      conditions.push(eq(auditLogTable.resourceId, filter.resourceId));
    if (filter.action)
      conditions.push(eq(auditLogTable.action, filter.action));

    const rows = await db
      .select()
      .from(auditLogTable)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(auditLogTable.createdAt))
      .limit(limit);

    return rows.map((e) => ({
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
