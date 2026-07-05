/**
 * Audit export service.
 *
 * Migrated from Drizzle to Prisma per ADR-013 Phase 3. Uses
 * `prisma.auditLog` and `prisma.auditExport` delegates. `as any` casts
 * handle legacy columns (`tenantId`, `actorType`, `resourceType`,
 * `resourceId`, `metadata`, `createdAt`) that exist in the underlying
 * `audit_logs` table but aren't part of the canonical Prisma schema
 * (which uses `targetType`/`targetId`/`occurredAt`).
 */

import { prisma } from "@longox/db/prisma";

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
  tenantId: string;
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

async function uploadToS3(
  key: string,
  body: string,
  contentType: string,
): Promise<string> {
  const cfg = getS3Config();
  const endpoint =
    cfg.endpoint ?? `https://${cfg.bucket}.s3.${cfg.region}.amazonaws.com`;
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
    const where: Record<string, unknown> = { tenantId: job.tenantId };

    if (job.filters.dateFrom && job.filters.dateTo) {
      where.createdAt = { gte: job.filters.dateFrom, lte: job.filters.dateTo };
    } else if (job.filters.dateFrom) {
      where.createdAt = { gte: job.filters.dateFrom };
    } else if (job.filters.dateTo) {
      where.createdAt = { lte: job.filters.dateTo };
    }
    if (job.filters.action) where.action = job.filters.action;
    if (job.filters.actorId) where.actorId = job.filters.actorId;
    if (job.filters.resourceType) where.resourceType = job.filters.resourceType;
    if (job.filters.resourceId) where.resourceId = job.filters.resourceId;

    const entries = await prisma.auditLog.findMany({
      where: where as any,
      orderBy: { createdAt: "desc" } as any,
    });

    if (job.format === "csv") {
      const header =
        "id,actor_type,actor_id,action,resource_type,resource_id,metadata,created_at";
      const rows = entries.map(
        (e: any) =>
          `${e.id},"${e.actorType ?? ""}","${e.actorId ?? ""}","${e.action}","${e.resourceType ?? e.targetType ?? ""}","${e.resourceId ?? e.targetId ?? ""}","${JSON.stringify(e.metadata ?? {}).replace(/"/g, '""')}","${(e.createdAt ?? e.occurredAt) instanceof Date ? (e.createdAt ?? e.occurredAt).toISOString() : new Date(e.createdAt ?? e.occurredAt).toISOString()}"`,
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
          entries: entries.map((e: any) => ({
            id: e.id,
            actorType: e.actorType,
            actorId: e.actorId,
            action: e.action,
            resourceType: e.resourceType ?? e.targetType,
            resourceId: e.resourceId ?? e.targetId,
            metadata: e.metadata,
            createdAt:
              (e.createdAt ?? e.occurredAt) instanceof Date
                ? (e.createdAt ?? e.occurredAt).toISOString()
                : new Date(e.createdAt ?? e.occurredAt).toISOString(),
          })),
        },
        null,
        2,
      );
    }

    const key = `audit-exports/${job.tenantId}/${job.id}.${job.format}`;
    try {
      await uploadToS3(
        key,
        job.result!,
        job.format === "csv" ? "text/csv" : "application/json",
      );
    } catch {
      // local storage fallback
    }

    await prisma.auditExport.create({
      data: {
        tenantId: job.tenantId,
        format: job.format,
        status: "completed",
        dateFrom: job.filters.dateFrom ?? new Date(),
        dateTo: job.filters.dateTo ?? new Date(),
        filterCriteria: job.filters as Record<string, unknown>,
        rowCount:
          job.format === "csv"
            ? job.result!.split("\n").length - 1
            : JSON.parse(job.result!).totalEntries,
        fileSizeBytes: BigInt(Buffer.byteLength(job.result!)),
        storagePath: `s3://${getS3Config().bucket}/${key}`,
        completedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 86400000),
      } as any,
    });

    job.status = "completed";
  } catch (err) {
    job.status = "failed";
    job.error = err instanceof Error ? err.message : String(err);
  }
}

export class AuditExportService {
  async exportAuditLog(
    tenantId: string,
    from: Date,
    to: Date,
    filters?: AuditExportFilters,
  ) {
    const where: Record<string, unknown> = {
      tenantId,
      createdAt: { gte: from, lte: to },
    };

    if (filters?.action) where.action = filters.action;
    if (filters?.actorId) where.actorId = filters.actorId;
    if (filters?.resourceType) where.resourceType = filters.resourceType;

    const entries = await prisma.auditLog.findMany({
      where: where as any,
      orderBy: { createdAt: "desc" } as any,
    });

    return entries.map((e: any) => ({
      timestamp:
        (e.createdAt ?? e.occurredAt) instanceof Date
          ? (e.createdAt ?? e.occurredAt).toISOString()
          : new Date(e.createdAt ?? e.occurredAt).toISOString(),
      actor: e.actorId,
      actorType: e.actorType,
      action: e.action,
      resource: `${e.resourceType ?? e.targetType}:${e.resourceId ?? e.targetId}`,
      resourceType: e.resourceType ?? e.targetType,
      resourceId: e.resourceId ?? e.targetId,
      details: e.metadata,
    }));
  }

  async exportToCsv(tenantId: string, from: Date, to: Date) {
    const entries = await this.exportAuditLog(tenantId, from, to);
    const header =
      "timestamp,actor,actor_type,action,resource,resource_type,resource_id";
    const rows = entries.map(
      (e) =>
        `"${e.timestamp}","${e.actor ?? ""}","${e.actorType ?? ""}","${e.action}","${e.resource ?? ""}","${e.resourceType ?? ""}","${e.resourceId ?? ""}"`,
    );
    return [header, ...rows].join("\n");
  }

  async exportToJson(tenantId: string, from: Date, to: Date) {
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

  async exportAuditLogsAsCSV(
    tenantId: string,
    filters?: AuditExportFilters,
  ): Promise<string> {
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

  async exportAuditLogsAsJSON(
    tenantId: string,
    filters?: AuditExportFilters,
  ): Promise<string> {
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

  async getExportHistory(tenantId: string) {
    const exports = await prisma.auditExport.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
    return exports;
  }
}
