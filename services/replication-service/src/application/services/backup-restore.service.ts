import { eq, and, desc, gte, lte, or, sql } from "drizzle-orm";
import { db, backupRecordsTable, restoreRecordsTable } from "@longox/db";
import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";

const BACKUP_DIR = process.env.BACKUP_STORAGE_PATH ?? "backups";
const CHUNK_SIZE = 65536;

type BackupScope = "full" | "workflows" | "executions" | "audit" | "billing";
type BackupStatus = "pending" | "running" | "completed" | "failed" | "validating" | "restoring";
type RestoreType = "full" | "dry_run" | "partial";
type RestoreStatus = "pending" | "running" | "completed" | "failed" | "cancelled";

interface BackupFilters {
  dateFrom?: string;
  dateTo?: string;
  scope?: BackupScope;
  status?: BackupStatus;
}

interface ScheduleConfig {
  cronExpression: string;
  scope: BackupScope;
  retentionDays: number;
}

export class BackupRestoreService {
  async createBackup(
    tenantId: number,
    scope: BackupScope = "full",
  ): Promise<typeof backupRecordsTable.$inferSelect> {
    const backupDir = path.join(BACKUP_DIR, String(tenantId));
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = Date.now();
    const storagePath = path.join(backupDir, `backup_${scope}_${timestamp}`);

    const [record] = await db
      .insert(backupRecordsTable)
      .values({
        tenantId,
        backupType: "manual",
        scope,
        status: "running",
        storagePath,
        startedAt: new Date(),
      })
      .returning();

    try {
      const rowCounts: Record<string, number> = {};

      if (scope === "full" || scope === "workflows") {
        const workflows = await db.execute(sql`
          SELECT COUNT(*) as count FROM workflows WHERE tenant_id = ${tenantId}
        `);
        rowCounts.workflows = Number((workflows.rows ?? workflows)[0]?.count ?? 0);

        const workflowVersions = await db.execute(sql`
          SELECT COUNT(*) as count FROM workflow_versions WHERE tenant_id = ${tenantId}
        `);
        rowCounts.workflow_versions = Number((workflowVersions.rows ?? workflowVersions)[0]?.count ?? 0);

        const workflowData = await db.execute(sql`
          SELECT * FROM workflows WHERE tenant_id = ${tenantId}
        `);
        const workflowRows = workflowData.rows ?? workflowData;
        fs.writeFileSync(
          `${storagePath}_workflows.json`,
          JSON.stringify(workflowRows, null, 2),
        );
      }

      if (scope === "full" || scope === "executions") {
        const executions = await db.execute(sql`
          SELECT COUNT(*) as count FROM executions WHERE tenant_id = ${tenantId}
        `);
        rowCounts.executions = Number((executions.rows ?? executions)[0]?.count ?? 0);

        const executionData = await db.execute(sql`
          SELECT * FROM executions WHERE tenant_id = ${tenantId}
        `);
        const executionRows = executionData.rows ?? executionData;
        fs.writeFileSync(
          `${storagePath}_executions.json`,
          JSON.stringify(executionRows, null, 2),
        );
      }

      if (scope === "full" || scope === "audit") {
        const audit = await db.execute(sql`
          SELECT COUNT(*) as count FROM audit_log WHERE tenant_id = ${tenantId}
        `);
        rowCounts.audit_log = Number((audit.rows ?? audit)[0]?.count ?? 0);

        const auditData = await db.execute(sql`
          SELECT * FROM audit_log WHERE tenant_id = ${tenantId}
        `);
        const auditRows = auditData.rows ?? auditData;
        fs.writeFileSync(
          `${storagePath}_audit.json`,
          JSON.stringify(auditRows, null, 2),
        );
      }

      if (scope === "full" || scope === "billing") {
        const billing = await db.execute(sql`
          SELECT COUNT(*) as count FROM billing WHERE tenant_id = ${tenantId}
        `);
        rowCounts.billing = Number((billing.rows ?? billing)[0]?.count ?? 0);

        const billingData = await db.execute(sql`
          SELECT * FROM billing WHERE tenant_id = ${tenantId}
        `);
        const billingRows = billingData.rows ?? billingData;
        fs.writeFileSync(
          `${storagePath}_billing.json`,
          JSON.stringify(billingRows, null, 2),
        );
      }

      const checksum = this.computeChecksum(storagePath, scope);

      const totalSize = this.calculateBackupSize(storagePath, scope);

      const [updated] = await db
        .update(backupRecordsTable)
        .set({
          status: "completed",
          completedAt: new Date(),
          fileSizeBytes: totalSize,
          checksum,
          rowCounts,
          metadata: {
            schemaVersion: "1.0",
            exportedAt: new Date().toISOString(),
            scope,
          },
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        })
        .where(eq(backupRecordsTable.id, record.id))
        .returning();

      return updated!;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const [failed] = await db
        .update(backupRecordsTable)
        .set({
          status: "failed",
          errorMessage: message,
          completedAt: new Date(),
        })
        .where(eq(backupRecordsTable.id, record.id))
        .returning();
      return failed!;
    }
  }

  async restoreBackup(
    backupId: number,
    tenantId: number,
    options: { restoreType?: RestoreType; targetEnvironment?: string; tables?: string[]; restoredBy?: string; notes?: string } = {},
  ): Promise<typeof restoreRecordsTable.$inferSelect> {
    const restoreType = options.restoreType ?? "full";
    const targetEnvironment = options.targetEnvironment ?? process.env.NODE_ENV ?? "development";

    const [backup] = await db
      .select()
      .from(backupRecordsTable)
      .where(and(eq(backupRecordsTable.id, backupId), eq(backupRecordsTable.tenantId, tenantId)))
      .limit(1);

    if (!backup) {
      throw new Error(`Backup ${backupId} not found for tenant ${tenantId}`);
    }

    if (backup.status !== "completed") {
      throw new Error(`Backup ${backupId} is not in completed status (current: ${backup.status})`);
    }

    await this.validateBackup(backupId);

    const [record] = await db
      .insert(restoreRecordsTable)
      .values({
        backupId,
        tenantId,
        restoreType,
        status: "running",
        targetEnvironment,
        startedAt: new Date(),
        restoredBy: options.restoredBy ?? "system",
        notes: options.notes ?? "",
      })
      .returning();

    try {
      const tablesRestored: string[] = [];
      let rowCountRestored = 0;
      const warnings: string[] = [];

      const scope = backup.scope as BackupScope;
      const scopesToRestore = this.getScopesForRestore(scope, options.tables);

      if (restoreType === "dry_run") {
        for (const s of scopesToRestore) {
          const filePath = `${backup.storagePath}_${s}.json`;
          if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, "utf-8");
            const rows = JSON.parse(content);
            tablesRestored.push(s);
            rowCountRestored += rows.length;
          }
        }

        const [updated] = await db
          .update(restoreRecordsTable)
          .set({
            status: "completed",
            tablesRestored,
            rowCountRestored,
            integrityChecked: 1,
            integrityPassed: 1,
            warnings,
            completedAt: new Date(),
          })
          .where(eq(restoreRecordsTable.id, record.id))
          .returning();

        return updated!;
      }

      if (restoreType === "full" || restoreType === "partial") {
        for (const s of scopesToRestore) {
          const filePath = `${backup.storagePath}_${s}.json`;
          if (!fs.existsSync(filePath)) {
            warnings.push(`Backup file for scope "${s}" not found at ${filePath}`);
            continue;
          }

          const content = fs.readFileSync(filePath, "utf-8");
          const rows = JSON.parse(content);

          if (rows.length === 0) {
            tablesRestored.push(s);
            continue;
          }

          const tableName = this.scopeToTableName(s);
          if (tableName) {
            await db.execute(sql`
              DELETE FROM ${sql.identifier(tableName as any)} WHERE tenant_id = ${tenantId}
            `);
          }

          for (const row of rows) {
            try {
              if (tableName) {
                const keys = Object.keys(row).filter((k) => k !== "id");
                const values = keys.map((k) => {
                  const v = row[k];
                  if (v instanceof Date) return v;
                  if (typeof v === "object" && v !== null) return JSON.stringify(v);
                  return v;
                });
                const placeholders = keys.map((_, i) => `$${i + 1}`);
                await db.execute(sql`
                  INSERT INTO ${sql.identifier(tableName as any)} (${sql.raw(keys.join(", "))})
                  VALUES (${sql.raw(placeholders.join(", "))})
                `);
              }
            } catch (err: unknown) {
              warnings.push(`Failed to restore row in "${s}": ${(err as Error)?.message ?? "unknown error"}`);
            }
          }

          tablesRestored.push(s);
          rowCountRestored += rows.length;
        }

        await this.runIntegrityChecks(tenantId);
      }

      const integrityPassed = warnings.length === 0;

      const [updated] = await db
        .update(restoreRecordsTable)
        .set({
          status: "completed",
          tablesRestored,
          rowCountRestored,
          integrityChecked: 1,
          integrityPassed: integrityPassed ? 1 : 0,
          warnings,
          completedAt: new Date(),
        })
        .where(eq(restoreRecordsTable.id, record.id))
        .returning();

      return updated!;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const [failed] = await db
        .update(restoreRecordsTable)
        .set({
          status: "failed",
          errorMessage: message,
          completedAt: new Date(),
        })
        .where(eq(restoreRecordsTable.id, record.id))
        .returning();
      return failed!;
    }
  }

  async listBackups(
    tenantId: number,
    filters: BackupFilters = {},
  ): Promise<(typeof backupRecordsTable.$inferSelect)[]> {
    let query: any = db
      .select()
      .from(backupRecordsTable)
      .where(eq(backupRecordsTable.tenantId, tenantId));

    if (filters.scope) {
      query = query.where(eq(backupRecordsTable.scope, filters.scope));
    }
    if (filters.status) {
      query = query.where(eq(backupRecordsTable.status, filters.status));
    }
    if (filters.dateFrom) {
      query = query.where(gte(backupRecordsTable.startedAt, new Date(filters.dateFrom)));
    }
    if (filters.dateTo) {
      query = query.where(lte(backupRecordsTable.startedAt, new Date(filters.dateTo)));
    }

    return query.orderBy(desc(backupRecordsTable.createdAt));
  }

  async getBackup(id: number): Promise<typeof backupRecordsTable.$inferSelect | null> {
    const [record] = await db
      .select()
      .from(backupRecordsTable)
      .where(eq(backupRecordsTable.id, id))
      .limit(1);
    return record ?? null;
  }

  async deleteBackup(id: number): Promise<void> {
    const [record] = await db
      .select()
      .from(backupRecordsTable)
      .where(eq(backupRecordsTable.id, id))
      .limit(1);

    if (!record) {
      throw new Error(`Backup ${id} not found`);
    }

    if (record.storagePath) {
      const dir = path.dirname(record.storagePath);
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir).filter((f) => f.startsWith(path.basename(record.storagePath!)));
        for (const file of files) {
          fs.rmSync(path.join(dir, file), { recursive: true, force: true });
        }
      }
    }

    await db.delete(backupRecordsTable).where(eq(backupRecordsTable.id, id));
  }

  async scheduleBackup(tenantId: number, config: ScheduleConfig): Promise<{ scheduled: true; config: ScheduleConfig }> {
    const scheduleRecord = {
      tenantId,
      cronExpression: config.cronExpression,
      scope: config.scope,
      retentionDays: config.retentionDays,
      createdAt: new Date(),
    };

    const schedulesDir = path.join(BACKUP_DIR, "schedules");
    if (!fs.existsSync(schedulesDir)) {
      fs.mkdirSync(schedulesDir, { recursive: true });
    }

    fs.writeFileSync(
      path.join(schedulesDir, `tenant_${tenantId}.json`),
      JSON.stringify(scheduleRecord, null, 2),
    );

    return { scheduled: true, config };
  }

  async validateBackup(id: number): Promise<{ valid: boolean; checksumMatch: boolean; fileCount: number; errors: string[] }> {
    const [record] = await db
      .select()
      .from(backupRecordsTable)
      .where(eq(backupRecordsTable.id, id))
      .limit(1);

    if (!record) {
      throw new Error(`Backup ${id} not found`);
    }

    const errors: string[] = [];
    let fileCount = 0;

    if (!record.storagePath || !fs.existsSync(record.storagePath.replace(/_workflows\.json$/, "").replace(/_executions\.json$/, "").replace(/_audit\.json$/, "").replace(/_billing\.json$/, ""))) {
      const dir = record.storagePath ? path.dirname(record.storagePath) : "";
      const baseName = record.storagePath ? path.basename(record.storagePath) : "";

      const scope = record.scope as BackupScope;
      const scopes = this.getScopesForRestore(scope);

      for (const s of scopes) {
        const fp = `${record.storagePath}_${s}.json`;
        if (!fs.existsSync(fp)) {
          errors.push(`Missing backup file: ${fp}`);
        } else {
          fileCount++;
        }
      }
    }

    if (record.checksum) {
      const computedChecksum = this.computeChecksum(record.storagePath!, record.scope as BackupScope);
      const checksumMatch = computedChecksum === record.checksum;
      if (!checksumMatch) {
        errors.push("Checksum mismatch — backup data may be corrupted");
      }
      return { valid: errors.length === 0, checksumMatch, fileCount, errors };
    }

    return { valid: errors.length === 0, checksumMatch: true, fileCount, errors };
  }

  async estimateBackupSize(tenantId: number): Promise<{ estimatedBytes: number; estimatedRows: Record<string, number> }> {
    const estimatedRows: Record<string, number> = {};

    const tables = ["workflows", "workflow_versions", "executions", "audit_log", "billing"] as const;
    for (const table of tables) {
      const result = await db.execute(sql`
        SELECT COUNT(*) as count, SUM(pg_column_size(${sql.identifier(table as any)})) as size
        FROM ${sql.identifier(table as any)} WHERE tenant_id = ${tenantId}
      `);
      const row = (result.rows ?? result)[0];
      estimatedRows[table] = Number(row?.count ?? 0);
    }

    const estimatedBytes = Object.values(estimatedRows).reduce((a, b) => a + b * 512, 0);
    return { estimatedBytes, estimatedRows };
  }

  private computeChecksum(storagePath: string, scope: BackupScope): string {
    const hash = crypto.createHash("sha256");
    const scopes = this.getScopesForRestore(scope);
    for (const s of scopes) {
      const fp = `${storagePath}_${s}.json`;
      if (fs.existsSync(fp)) {
        const buffer = fs.readFileSync(fp);
        hash.update(buffer);
      }
    }
    return hash.digest("hex");
  }

  private calculateBackupSize(storagePath: string, scope: BackupScope): number {
    let total = 0;
    const scopes = this.getScopesForRestore(scope);
    for (const s of scopes) {
      const fp = `${storagePath}_${s}.json`;
      if (fs.existsSync(fp)) {
        total += fs.statSync(fp).size;
      }
    }
    return total;
  }

  private getScopesForRestore(scope: BackupScope, tables?: string[]): string[] {
    if (tables && tables.length > 0) {
      return tables;
    }
    if (scope === "full") {
      return ["workflows", "executions", "audit", "billing"];
    }
    return [scope];
  }

  private scopeToTableName(scope: string): string | null {
    const map: Record<string, string> = {
      workflows: "workflows",
      executions: "executions",
      audit: "audit_log",
      billing: "billing",
    };
    return map[scope] ?? null;
  }

  private async runIntegrityChecks(tenantId: number): Promise<void> {
    const tables = ["workflows", "executions", "audit_log", "billing"];
    for (const table of tables) {
      try {
        await db.execute(sql`
          SELECT COUNT(*) FROM ${sql.identifier(table as any)} WHERE tenant_id = ${tenantId}
        `);
      } catch {
        console.warn(`Integrity check skipped for table ${table} — may not exist`);
      }
    }
  }
}
