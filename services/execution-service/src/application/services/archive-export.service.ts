import { eq, and, gte, lte, desc } from "drizzle-orm";
import { db, archiveExportsTable } from "@longox/db";
import * as parquet from "parquetjs-lite";
import { sql } from "drizzle-orm";

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
  const endpoint = cfg.endpoint ?? `https://${cfg.bucket}.s3.${cfg.region}.amazonaws.com`;
  const url = `${endpoint}/${key}`;

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(body.length),
    },
    body,
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
    tenantId: number,
  ): Promise<typeof archiveExportsTable.$inferSelect> {
    const partitionName = `${tableName}_${startDate.getFullYear()}${String(startDate.getMonth() + 1).padStart(2, "0")}`;

    const [record] = await db
      .insert(archiveExportsTable)
      .values({
        tenantId,
        tableName,
        partitionName,
        exportFormat: "parquet",
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
        status: "processing",
        filePath: `${EXPORTS_DIR}/${tenantId}/${partitionName}_${Date.now()}.parquet`,
      })
      .returning();

    try {
      const data = await db.execute(sql`
        SELECT * FROM ${sql.identifier(tableName as any)}
        WHERE tenant_id = ${tenantId}
          AND created_at >= ${startDate}
          AND created_at < ${endDate}
      `);

      const rows = data.rows ?? data;
      const rowArray = rows as any[];

      if (rowArray.length === 0) {
        const [updated] = await db
          .update(archiveExportsTable)
          .set({
            status: "completed",
            rowCount: 0,
            fileSizeBytes: 0,
            completedAt: new Date(),
          })
          .where(eq(archiveExportsTable.id, record.id))
          .returning();
        return updated!;
      }

      const schemaFields = Object.keys(rowArray[0]).map((key) => ({
        name: key,
        type: key.endsWith("_at") || key === "created_at" || key === "updated_at"
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
        storageUrl = await uploadToS3(storageKey, fileBuffer, "application/octet-stream");
        await fs.unlink(filePath);
      } catch {
        storageUrl = `s3://${getS3Config().bucket}/${storageKey}`;
      }

      const [updated] = await db
        .update(archiveExportsTable)
        .set({
          status: "completed",
          rowCount: rowArray.length,
          fileSizeBytes: stats.size,
          storageUrl,
          completedAt: new Date(),
        })
        .where(eq(archiveExportsTable.id, record.id))
        .returning();

      return updated!;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);

      const [updated] = await db
        .update(archiveExportsTable)
        .set({
          status: "failed",
          errorMessage: message,
          completedAt: new Date(),
        })
        .where(eq(archiveExportsTable.id, record.id))
        .returning();

      return updated!;
    }
  }

  async uploadExport(exportId: number): Promise<void> {
    const [record] = await db
      .select()
      .from(archiveExportsTable)
      .where(eq(archiveExportsTable.id, exportId))
      .limit(1);

    if (!record) {
      throw new Error(`Export ${exportId} not found`);
    }

    if (record.status !== "completed") {
      throw new Error(`Export ${exportId} is not in completed status`);
    }

    const { promises: fs } = await import("node:fs");
    const fileBuffer = await fs.readFile(record.filePath);
    const storageKey = `${record.tenantId}/${record.partitionName}_${Date.now()}.parquet`;
    const storageUrl = await uploadToS3(storageKey, fileBuffer, "application/octet-stream");

    await db
      .update(archiveExportsTable)
      .set({ storageUrl })
      .where(eq(archiveExportsTable.id, exportId));

    await fs.unlink(record.filePath);
  }

  async getExportStatus(
    exportId: number,
  ): Promise<typeof archiveExportsTable.$inferSelect | null> {
    const [record] = await db
      .select()
      .from(archiveExportsTable)
      .where(eq(archiveExportsTable.id, exportId))
      .limit(1);

    return record ?? null;
  }

  async listExports(tenantId: number): Promise<(typeof archiveExportsTable.$inferSelect)[]> {
    return db
      .select()
      .from(archiveExportsTable)
      .where(eq(archiveExportsTable.tenantId, tenantId))
      .orderBy(desc(archiveExportsTable.createdAt));
  }
}
