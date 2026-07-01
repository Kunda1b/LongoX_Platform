import { and, between, eq, desc, gte, lte } from "drizzle-orm";
import {
  db,
  auditLogTable,
  auditExportsTable,
  schedulesTable,
} from "@longox/db";

export interface AuditExportFilters {
  eventType?: string;
  userId?: string;
  resourceType?: string;
  severity?: string;
}

export class AuditExportService {
  async exportAuditLog(
    tenantId: number,
    from: Date,
    to: Date,
    filters?: AuditExportFilters,
  ) {
    const conditions = [
      eq(auditLogTable.tenantId, tenantId),
      gte(auditLogTable.createdAt, from),
      lte(auditLogTable.createdAt, to),
    ];

    if (filters?.eventType) {
      conditions.push(eq(auditLogTable.action, filters.eventType));
    }
    if (filters?.userId) {
      conditions.push(eq(auditLogTable.actorId, filters.userId));
    }
    if (filters?.resourceType) {
      conditions.push(eq(auditLogTable.resourceType, filters.resourceType));
    }

    const entries = await db
      .select()
      .from(auditLogTable)
      .where(and(...conditions))
      .orderBy(desc(auditLogTable.createdAt));

    return entries.map((e) => ({
      timestamp: e.createdAt.toISOString(),
      actor: e.actorId,
      actorType: e.actorType,
      action: e.action,
      resource: `${e.resourceType}:${e.resourceId}`,
      resourceType: e.resourceType,
      resourceId: e.resourceId,
      details: e.metadata,
    }));
  }

  async exportToCsv(tenantId: number, from: Date, to: Date) {
    const entries = await this.exportAuditLog(tenantId, from, to);
    const header = "timestamp,actor,actor_type,action,resource,resource_type,resource_id";
    const rows = entries.map(
      (e) =>
        `"${e.timestamp}","${e.actor ?? ""}","${e.actorType}","${e.action}","${e.resource}","${e.resourceType}","${e.resourceId}"`,
    );
    return [header, ...rows].join("\n");
  }

  async exportToJson(tenantId: number, from: Date, to: Date) {
    const entries = await this.exportAuditLog(tenantId, from, to);
    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        tenantId,
        dateFrom: from.toISOString(),
        dateTo: to.toISOString(),
        totalEntries: entries.length,
        entries,
      },
      null,
      2,
    );
  }

  async scheduleRecurringExport(
    tenantId: number,
    config: {
      cronExpression: string;
      format: "csv" | "json";
      dateRangeDays: number;
      recipientEmails?: string[];
    },
  ) {
    const [schedule] = await db
      .insert(schedulesTable)
      .values({
        tenantId,
        workflowId: 0,
        name: `Recurring Audit Export (${config.format})`,
        description: `Automated audit export every ${config.dateRangeDays} days in ${config.format} format`,
        interval: "custom",
        cronExpression: config.cronExpression,
        startAt: new Date(),
        metadata: {
          type: "audit_export",
          format: config.format,
          dateRangeDays: config.dateRangeDays,
          recipientEmails: config.recipientEmails ?? [],
        },
      })
      .returning();
    return schedule;
  }

  async getExportHistory(tenantId: number) {
    const exports = await db
      .select()
      .from(auditExportsTable)
      .where(eq(auditExportsTable.tenantId, tenantId))
      .orderBy(desc(auditExportsTable.createdAt));
    return exports;
  }
}
