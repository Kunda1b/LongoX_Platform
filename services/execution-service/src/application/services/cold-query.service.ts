import { prisma } from "@longox/db/prisma";
import { RetentionPolicyService } from "./retention-policy.service";
import * as parquet from "parquetjs-lite";

function getS3Config() {
  return {
    region: process.env.AWS_REGION ?? "us-east-1",
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
    bucket: process.env.ARCHIVE_EXPORT_BUCKET ?? "longox-archives",
    endpoint: process.env.S3_ENDPOINT ?? undefined,
  };
}

function getPresignedUrl(key: string): string {
  const cfg = getS3Config();
  const endpoint = cfg.endpoint ?? `https://${cfg.bucket}.s3.${cfg.region}.amazonaws.com`;
  return `${endpoint}/${key}`;
}

async function downloadFromS3(key: string): Promise<Buffer> {
  const cfg = getS3Config();
  const endpoint = cfg.endpoint ?? `https://${cfg.bucket}.s3.${cfg.region}.amazonaws.com`;
  const url = `${endpoint}/${key}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`S3 download failed: ${res.status} ${res.statusText}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function queryParquetFromS3(
  key: string,
  filters?: { id?: string; tenantId?: string },
): Promise<any[]> {
  let buffer: Buffer;

  try {
    buffer = await downloadFromS3(key);
  } catch {
    return [];
  }

  // Use a literal table name — Drizzle tables don't expose `.name` directly.
  const tmpPath = `executions_cold_${Date.now()}.parquet`;
  const { promises: fs } = await import("node:fs");
  await fs.writeFile(tmpPath, buffer);

  try {
    const reader = await parquet.ParquetReader.openFile(tmpPath);
    const cursor = reader.getCursor();
    const records: any[] = [];
    let record = await cursor.next();
    while (record) {
      if (filters) {
        let match = true;
        if (filters.id !== undefined && record.id !== filters.id) {
          match = false;
        }
        if (filters.tenantId !== undefined && record.tenant_id !== filters.tenantId) {
          match = false;
        }
        if (match) {
          records.push(record);
        }
      } else {
        records.push(record);
      }
      record = await cursor.next();
    }
    await reader.close();
    await fs.unlink(tmpPath);
    return records;
  } catch {
    await fs.unlink(tmpPath).catch(() => {});
    return [];
  }
}

export class ColdQueryService {
  private policyService: RetentionPolicyService;

  constructor(policyService?: RetentionPolicyService) {
    this.policyService = policyService ?? new RetentionPolicyService();
  }

  async queryExecution(
    id: string,
    tenantId: string,
  ): Promise<any | null> {
    const execution = await prisma.workflowExecution.findFirst({
      where: {
        id,
        tenantId,
      } as any,
    });

    if (execution) {
      return execution;
    }

    const policy = await this.policyService.getPolicy(tenantId);
    if (!policy.coldQueryEnabled) {
      return null;
    }

    return this.queryColdStorage(id, tenantId);
  }

  async queryByDateRange(
    tenantId: string,
    from: Date,
    to: Date,
  ): Promise<any[]> {
    const hotResults = await prisma.workflowExecution.findMany({
      where: {
        tenantId,
        startedAt: { gte: from, lte: to },
      } as any,
      orderBy: { startedAt: "desc" },
    });

    const policy = await this.policyService.getPolicy(tenantId);
    if (!policy.coldQueryEnabled) {
      return hotResults;
    }

    const coldResults = await this.queryColdStorageByRange(tenantId, from, to);
    return [...hotResults, ...coldResults];
  }

  async restoreFromCold(
    executionId: string,
    tenantId: string,
  ): Promise<any | null> {
    const policy = await this.policyService.getPolicy(tenantId);
    if (!policy.coldQueryEnabled) {
      return null;
    }

    const coldData = await this.queryColdStorage(executionId, tenantId);
    if (!coldData) {
      return null;
    }

    const restored = await prisma.workflowExecution.create({
      data: coldData as any,
    });

    return restored;
  }

  async getColdQueryPresignedUrl(
    exportId: string,
  ): Promise<string | null> {
    const record = await prisma.archiveExport.findUnique({
      where: { id: exportId },
    });

    if (!record || !record.storageUrl) {
      return null;
    }

    const key = record.storageUrl.replace(/^https?:\/\/[^\/]+\//, "");
    return getPresignedUrl(key);
  }

  private async queryColdStorage(
    id: string,
    tenantId: string,
  ): Promise<any | null> {
    const exports = await prisma.archiveExport.findMany({
      where: {
        tenantId,
        tableName: "executions",
        status: "completed",
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    for (const exp of exports) {
      const key = exp.storageUrl?.replace(/^https?:\/\/[^\/]+\//, "");
      if (!key) continue;

      const records = await queryParquetFromS3(key, { id, tenantId });
      if (records.length > 0) {
        return records[0];
      }
    }

    return null;
  }

  private async queryColdStorageByRange(
    tenantId: string,
    from: Date,
    to: Date,
  ): Promise<any[]> {
    const exports = await prisma.archiveExport.findMany({
      where: {
        tenantId,
        tableName: "executions",
        status: "completed",
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const results: any[] = [];

    for (const exp of exports) {
      const key = exp.storageUrl?.replace(/^https?:\/\/[^\/]+\//, "");
      if (!key) continue;

      const records = await queryParquetFromS3(key, { tenantId });
      for (const r of records) {
        const startedAt = new Date(r.started_at ?? r.startedAt);
        if (startedAt >= from && startedAt <= to) {
          results.push(r);
        }
      }
    }

    return results;
  }
}
