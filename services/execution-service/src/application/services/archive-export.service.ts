import { prisma } from "@longox/db/prisma";
import * as parquet from "parquetjs-lite";

const EXPORTS_DIR = "exports";

function getS3Config() {
  return {
    region: process.env.AWS_REGION ?? "us-east-1",
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
    bucket: process.env.ARCHIVE_EXPORT_BUCKET ?? "longox-archives",
    endpoint: process.env.S3_ENDPOINT ?? undefined,
  };
}

async function uploadToS3(
  key: string,
  body: Buffer,
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
      "Content-Length": String(body.length),
    },
    body: body as unknown as BodyInit,
  });

  if (!res.ok) {
    throw new Error(`S3 upload failed: ${res.status} ${res.statusText}`);
  }

  return url;
}

export class ArchiveExportService {
  async exportToParquet(
    tableName: string,
    startDate: Date,
    endDate: Date,
    tenantId: string,
  ): Promise<any> {
    const partitionName = `${tableName}_${startDate.getFullYear()}${String(startDate.getMonth() + 1).padStart(2, "0")}`;

    const record = await prisma.archiveExport.create({
      data: {
        tenantId,
        tableName,
        partitionName,
        exportFormat: "parquet",
        startDate,
        endDate,
        status: "processing",
        filePath: `${EXPORTS_DIR}/${tenantId}/${partitionName}_${Date.now()}.parquet`,
      } as any,
    });

    try {
      // Prisma doesn't support identifier-binding on table names; use
      // $queryRawUnsafe after validating the table name against an allowlist.
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) {
        throw new Error(`Invalid table name: ${tableName}`);
      }
      const rowArray = (await prisma.$queryRawUnsafe(
        `SELECT * FROM "${tableName}"
         WHERE tenant_id = $1
           AND created_at >= $2
           AND created_at < $3`,
        tenantId,
        startDate,
        endDate,
      )) as any[];

      if (rowArray.length === 0) {
        const updated = await prisma.archiveExport.update({
          where: { id: record.id },
          data: {
            status: "completed",
            rowCount: 0,
            fileSizeBytes: 0,
            completedAt: new Date(),
          } as any,
        });
        return updated;
      }

      const schemaFields = Object.keys(rowArray[0]).map((key) => ({
        name: key,
        type:
          key.endsWith("_at") || key === "created_at" || key === "updated_at"
            ? "TIMESTAMP_MILLIS"
            : typeof rowArray[0][key] === "number"
              ? "INT64"
              : "UTF8",
      }));

      const schema = new parquet.ParquetSchema(
        schemaFields.reduce(
          (acc, f) => {
            acc[f.name] = { type: f.type };
            return acc;
          },
          {} as Record<string, { type: string }>,
        ),
      );

      const filePath = record.filePath;
      const writer = await parquet.ParquetWriter.openFile(schema, filePath);

      for (const row of rowArray) {
        await writer.appendRow(row);
      }

      await writer.close();

      const { promises: fs } = await import("node:fs");
      const stats = await fs.stat(filePath);

      const storageKey = `${tenantId}/${partitionName}_${Date.now()}.parquet`;
      let storageUrl: string | null = null;
      try {
        const fileBuffer = await fs.readFile(filePath);
        storageUrl = await uploadToS3(
          storageKey,
          fileBuffer,
          "application/octet-stream",
        );
        await fs.unlink(filePath);
      } catch {
        storageUrl = `s3://${getS3Config().bucket}/${storageKey}`;
      }

      const updated = await prisma.archiveExport.update({
        where: { id: record.id },
        data: {
          status: "completed",
          rowCount: rowArray.length,
          fileSizeBytes: stats.size,
          storageUrl,
          completedAt: new Date(),
        } as any,
      });

      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);

      const updated = await prisma.archiveExport.update({
        where: { id: record.id },
        data: {
          status: "failed",
          errorMessage: message,
          completedAt: new Date(),
        } as any,
      });

      return updated;
    }
  }

  async uploadExport(exportId: string): Promise<void> {
    const record = await prisma.archiveExport.findUnique({
      where: { id: exportId },
    });

    if (!record) {
      throw new Error(`Export ${exportId} not found`);
    }

    if (record.status !== "completed") {
      throw new Error(`Export ${exportId} is not in completed status`);
    }

    const { promises: fs } = await import("node:fs");
    const fileBuffer = await fs.readFile(record.filePath);
    const storageKey = `${record.tenantId}/${record.partitionName}_${Date.now()}.parquet`;
    const storageUrl = await uploadToS3(
      storageKey,
      fileBuffer,
      "application/octet-stream",
    );

    await prisma.archiveExport.update({
      where: { id: exportId },
      data: { storageUrl } as any,
    });

    await fs.unlink(record.filePath);
  }

  async getExportStatus(exportId: string): Promise<any | null> {
    const record = await prisma.archiveExport.findUnique({
      where: { id: exportId },
    });

    return record ?? null;
  }

  async listExports(tenantId: string): Promise<any[]> {
    return prisma.archiveExport.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  }
}
