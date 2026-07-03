import { and, between, eq, desc, gte, lte } from "drizzle-orm";
import {
  db,
  auditLogTable,
  auditExportsTable,
} from "@longox/db";

export interface AuditExportFilters {
  action?: string;
  actorId?: string;
  resourceType?: string;
  resourceId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

interface QueuedJob {
  id: string;
  tenantId: number;
  format: "csv" | "json";
  filters: AuditExportFilters;
  status: "pending" | "processing" | "completed" | "failed";
  result?: string;
  error?: string;
  createdAt: Date;
}

const exportQueue: QueuedJob[] = [];

function getS3Config() {
  return {
    region: process.env.AWS_REGION ?? "us-east-1",
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
    bucket: process.env.AUDIT_EXPORT_BUCKET ?? "longox-audit-exports",
    endpoint: process.env.S3_ENDPOINT ?? undefined,
  };
}

async function uploadToS3(key: string, body: string, contentType: string): Promise<string> {
  const cfg = getS3Config();
  const endpoint = cfg.endpoint ?? `https://${cfg.bucket}.s3.${cfg.region}.amazonaws.com`;
  const url = `${endpoint}/${key}`;

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(Buffer.byteLength(body)),
    },
    body,
  });

  if (!res.ok) {
    throw new Error(`S3 upload failed: ${res.status} ${res.statusText}`);
  }

  return url;
}

function generateId(): string {
  return `audit-export-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function processJob(job: QueuedJob): Promise<void> {
  job.status = "processing";

  try {
    const conditions = [
      eq(auditLogTable.tenantId, job.tenantId),
    ];

    if (job.filters.dateFrom) {
      conditions.push(gte(auditLogTable.createdAt, job.filters.dateFrom));
    }
    if (job.filters.dateTo) {
      conditions.push(lte(auditLogTable.createdAt, job.filters.dateTo));
    }
    if (job.filters.action) {
      conditions.push(eq(auditLogTable.action, job.filters.action));
    }
    if (job.filters.actorId) {
      conditions.push(eq(auditLogTable.actorId, job.filters.actorId));
    }
    if (job.filters.resourceType) {
      conditions.push(eq(auditLogTable.resourceType, job.filters.resourceType));
    }
    if (job.filters.resourceId) {
      conditions.push(eq(auditLogTable.resourceId, job.filters.resourceId));
    }

    const entries = await db
      .select()
      .from(auditLogTable)
      .where(and(...conditions))
      .orderBy(desc(auditLogTable.createdAt));

    if (job.format === "csv") {
      const header = "id,actor_type,actor_id,action,resource_type,resource_id,metadata,created_at";
      const rows = entries.map(
        (e) =>
          `${e.id},"${e.actorType}","${e.actorId ?? ""}","${e.action}","${e.resourceType}","${e.resourceId}","${JSON.stringify(e.metadata ?? {}).replace(/"/g, '""')}","${e.createdAt.toISOString()}"`,
      );
      job.result = [header, ...rows].join("\n");
    } else {
      job.result = JSON.stringify(
        {
          exportedAt: new Date().toISOString(),
          tenantId: job.tenantId,
          dateFrom: job.filters.dateFrom?.toISOString(),
          dateTo: job.filters.dateTo?.toISOString(),
          totalEntries: entries.length,
          entries: entries.map((e) => ({
            id: e.id,
            actorType: e.actorType,
            actorId: e.actorId,
            action: e.action,
            resourceType: e.resourceType,
            resourceId: e.resourceId,
            metadata: e.metadata,
            createdAt: e.createdAt.toISOString(),
          })),
        },
        null,
        2,
      );
    }

    const key = `audit-exports/${job.tenantId}/${job.id}.${job.format}`;
    try {
      await uploadToS3(key, job.result, job.format === "csv" ? "text/csv" : "application/json");
    } catch {
      // local storage fallback
    }

    const contentType = job.format === "csv" ? "text/csv" : "application/json";

    await db.insert(auditExportsTable).values({
      tenantId: job.tenantId,
      format: job.format,
      status: "completed",
      dateFrom: job.filters.dateFrom?.toISOString().split("T")[0] ?? new Date().toISOString().split("T")[0],
      dateTo: job.filters.dateTo?.toISOString().split("T")[0] ?? new Date().toISOString().split("T")[0],
      filterCriteria: job.filters as Record<string, unknown>,
      rowCount: job.format === "csv" ? job.result.split("\n").length - 1 : JSON.parse(job.result).totalEntries,
      fileSizeBytes: Buffer.byteLength(job.result),
      storagePath: `s3://${getS3Config().bucket}/${key}`,
      completedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 86400000),
    });

    job.status = "completed";
  } catch (err) {
    job.status = "failed";
    job.error = err instanceof Error ? err.message : String(err);
  }
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

    if (filters?.action) {
      conditions.push(eq(auditLogTable.action, filters.action));
    }
    if (filters?.actorId) {
      conditions.push(eq(auditLogTable.actorId, filters.actorId));
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

  async exportAuditLogsAsCSV(tenantId: number, filters?: AuditExportFilters): Promise<string> {
    const job: QueuedJob = {
      id: generateId(),
      tenantId,
      format: "csv",
      filters: filters ?? {},
      status: "pending",
      createdAt: new Date(),
    };

    exportQueue.push(job);
    await processJob(job);

    if (job.status === "failed") {
      throw new Error(job.error ?? "Export failed");
    }

    return job.result ?? "";
  }

  async exportAuditLogsAsJSON(tenantId: number, filters?: AuditExportFilters): Promise<string> {
    const job: QueuedJob = {
      id: generateId(),
      tenantId,
      format: "json",
      filters: filters ?? {},
      status: "pending",
      createdAt: new Date(),
    };

    exportQueue.push(job);
    await processJob(job);

    if (job.status === "failed") {
      throw new Error(job.error ?? "Export failed");
    }

    return job.result ?? "";
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
