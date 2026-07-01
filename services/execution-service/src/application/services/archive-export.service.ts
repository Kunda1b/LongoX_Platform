import { eq, and, gte, lte, desc } from "drizzle-orm";
import { db, archiveExportsTable } from "@longox/db";
import * as fs from "node:fs";
import * as path from "node:path";
import { sql } from "drizzle-orm";

const EXPORTS_DIR = "exports";

export class ArchiveExportService {
  async exportToParquet(
    tableName: string,
    startDate: Date,
    endDate: Date,
    tenantId: number,
  ): Promise<typeof archiveExportsTable.$inferSelect> {
    const partitionName = `${tableName}_${startDate.getFullYear()}${String(startDate.getMonth() + 1).padStart(2, "0")}`;

    const exportDir = path.join(EXPORTS_DIR, String(tenantId));
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    const timestamp = Date.now();
    const filePath = path.join(
      exportDir,
      `${partitionName}_${timestamp}.ndjson`,
    );

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
        filePath,
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
      const ndjsonLines = (rows as any[]).map((row) => JSON.stringify(row));
      const content = ndjsonLines.join("\n");

      fs.writeFileSync(filePath, content, "utf-8");

      const stats = fs.statSync(filePath);

      const [updated] = await db
        .update(archiveExportsTable)
        .set({
          status: "completed",
          rowCount: ndjsonLines.length,
          fileSizeBytes: stats.size,
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

    await db
      .update(archiveExportsTable)
      .set({
        storageUrl: `s3://placeholder-bucket/${record.tenantId}/${record.partitionName}`,
      })
      .where(eq(archiveExportsTable.id, exportId));
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
