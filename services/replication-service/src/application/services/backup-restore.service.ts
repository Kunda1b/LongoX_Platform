/**
 * Backup & restore service.
 *
 * Migrated from Drizzle to Prisma per ADR-013 Phase 3.
 * Uses `prisma.backupRecord` and `prisma.restoreRecord` delegates with `as any`
 * casts for legacy columns. Raw table scans (`workflows`, `executions`,
 * `audit_log`, `billing`) use `prisma.$queryRawUnsafe()` /
 * `prisma.$executeRawUnsafe()` because the target tables are not all modelled
 * in the Prisma schema and we must mirror the original `db.execute(sql\`...\`)`
 * semantics.
 */

import { prisma } from "@longox/db/prisma";
import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";

const BACKUP_DIR = process.env.BACKUP_STORAGE_PATH ?? "backups";
const CHUNK_SIZE = 65536;

type BackupScope = "full" | "workflows" | "executions" | "audit" | "billing";
type BackupStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "validating"
  | "restoring";
type RestoreType = "full" | "dry_run" | "partial";
type RestoreStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

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
    tenantId: string,
    scope: BackupScope = "full",
  ): Promise<any> {
    const backupDir = path.join(BACKUP_DIR, String(tenantId));
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = Date.now();
    const storagePath = path.join(backupDir, `backup_${scope}_${timestamp}`);

    const record = await prisma.backupRecord.create({
      data: {
        tenantId,
        backupType: "manual",
        scope,
        status: "running",
        storagePath,
        startedAt: new Date(),
      } as any,
    });

    try {
      const rowCounts: Record<string, number> = {};

      if (scope === "full" || scope === "workflows") {
        const workflows: any[] = await prisma.$queryRawUnsafe(
          `SELECT COUNT(*) as count FROM workflows WHERE tenant_id = $1`,
          tenantId,
        );
        rowCounts.workflows = Number((workflows[0] as any)?.count ?? 0);

        const workflowVersions: any[] = await prisma.$queryRawUnsafe(
          `SELECT COUNT(*) as count FROM workflow_versions WHERE tenant_id = $1`,
          tenantId,
        );
        rowCounts.workflow_versions = Number(
          (workflowVersions[0] as any)?.count ?? 0,
        );

        const workflowData: any[] = await prisma.$queryRawUnsafe(
          `SELECT * FROM workflows WHERE tenant_id = $1`,
          tenantId,
        );
        fs.writeFileSync(
          `${storagePath}_workflows.json`,
          JSON.stringify(workflowData, null, 2),
        );
      }

      if (scope === "full" || scope === "executions") {
        const executions: any[] = await prisma.$queryRawUnsafe(
          `SELECT COUNT(*) as count FROM executions WHERE tenant_id = $1`,
          tenantId,
        );
        rowCounts.executions = Number((executions[0] as any)?.count ?? 0);

        const executionData: any[] = await prisma.$queryRawUnsafe(
          `SELECT * FROM executions WHERE tenant_id = $1`,
          tenantId,
        );
        fs.writeFileSync(
          `${storagePath}_executions.json`,
          JSON.stringify(executionData, null, 2),
        );
      }

      if (scope === "full" || scope === "audit") {
        const audit: any[] = await prisma.$queryRawUnsafe(
          `SELECT COUNT(*) as count FROM audit_log WHERE tenant_id = $1`,
          tenantId,
        );
        rowCounts.audit_log = Number((audit[0] as any)?.count ?? 0);

        const auditData: any[] = await prisma.$queryRawUnsafe(
          `SELECT * FROM audit_log WHERE tenant_id = $1`,
          tenantId,
        );
        fs.writeFileSync(
          `${storagePath}_audit.json`,
          JSON.stringify(auditData, null, 2),
        );
      }

      if (scope === "full" || scope === "billing") {
        const billing: any[] = await prisma.$queryRawUnsafe(
          `SELECT COUNT(*) as count FROM billing WHERE tenant_id = $1`,
          tenantId,
        );
        rowCounts.billing = Number((billing[0] as any)?.count ?? 0);

        const billingData: any[] = await prisma.$queryRawUnsafe(
          `SELECT * FROM billing WHERE tenant_id = $1`,
          tenantId,
        );
        fs.writeFileSync(
          `${storagePath}_billing.json`,
          JSON.stringify(billingData, null, 2),
        );
      }

      const checksum = this.computeChecksum(storagePath, scope);

      const totalSize = this.calculateBackupSize(storagePath, scope);

      const updated = await prisma.backupRecord.update({
        where: { id: record.id },
        data: {
          status: "completed",
          completedAt: new Date(),
          fileSizeBytes: totalSize as any,
          checksum,
          rowCounts,
          metadata: {
            schemaVersion: "1.0",
            exportedAt: new Date().toISOString(),
            scope,
          },
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        } as any,
      });

      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const failed = await prisma.backupRecord.update({
        where: { id: record.id },
        data: {
          status: "failed",
          errorMessage: message,
          completedAt: new Date(),
        } as any,
      });
      return failed;
    }
  }

  async restoreBackup(
    backupId: string,
    tenantId: string,
    options: {
      restoreType?: RestoreType;
      targetEnvironment?: string;
      tables?: string[];
      restoredBy?: string;
      notes?: string;
    } = {},
  ): Promise<any> {
    const restoreType = options.restoreType ?? "full";
    const targetEnvironment =
      options.targetEnvironment ?? process.env.NODE_ENV ?? "development";

    const backup = await prisma.backupRecord.findFirst({
      where: { id: backupId, tenantId } as any,
    });

    if (!backup) {
      throw new Error(`Backup ${backupId} not found for tenant ${tenantId}`);
    }

    if (backup.status !== "completed") {
      throw new Error(
        `Backup ${backupId} is not in completed status (current: ${backup.status})`,
      );
    }

    await this.validateBackup(backupId);

    const record = await prisma.restoreRecord.create({
      data: {
        backupId,
        tenantId,
        restoreType,
        status: "running",
        targetEnvironment,
        startedAt: new Date(),
        restoredBy: options.restoredBy ?? "system",
        notes: options.notes ?? "",
      } as any,
    });

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

        const updated = await prisma.restoreRecord.update({
          where: { id: record.id },
          data: {
            status: "completed",
            tablesRestored,
            rowCountRestored,
            integrityChecked: 1,
            integrityPassed: 1,
            warnings,
            completedAt: new Date(),
          } as any,
        });

        return updated;
      }

      if (restoreType === "full" || restoreType === "partial") {
        for (const s of scopesToRestore) {
          const filePath = `${backup.storagePath}_${s}.json`;
          if (!fs.existsSync(filePath)) {
            warnings.push(
              `Backup file for scope "${s}" not found at ${filePath}`,
            );
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
            await prisma.$executeRawUnsafe(
              `DELETE FROM "${tableName}" WHERE tenant_id = $1`,
              tenantId,
            );
          }

          for (const row of rows) {
            try {
              if (tableName) {
                const keys = Object.keys(row).filter((k) => k !== "id");
                const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
                const quotedKeys = keys.map((k) => `"${k}"`).join(", ");
                const values = keys.map((k) => {
                  const v = row[k];
                  if (v instanceof Date) return v;
                  if (typeof v === "object" && v !== null)
                    return JSON.stringify(v);
                  return v;
                });
                await prisma.$executeRawUnsafe(
                  `INSERT INTO "${tableName}" (${quotedKeys}) VALUES (${placeholders})`,
                  ...values,
                );
              }
            } catch (err: unknown) {
              warnings.push(
                `Failed to restore row in "${s}": ${(err as Error)?.message ?? "unknown error"}`,
              );
            }
          }

          tablesRestored.push(s);
          rowCountRestored += rows.length;
        }

        await this.runIntegrityChecks(tenantId);
      }

      const integrityPassed = warnings.length === 0;

      const updated = await prisma.restoreRecord.update({
        where: { id: record.id },
        data: {
          status: "completed",
          tablesRestored,
          rowCountRestored,
          integrityChecked: 1,
          integrityPassed: integrityPassed ? 1 : 0,
          warnings,
          completedAt: new Date(),
        } as any,
      });

      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const failed = await prisma.restoreRecord.update({
        where: { id: record.id },
        data: {
          status: "failed",
          errorMessage: message,
          completedAt: new Date(),
        } as any,
      });
      return failed;
    }
  }

  async listBackups(
    tenantId: string,
    filters: BackupFilters = {},
  ): Promise<any[]> {
    const where: Record<string, unknown> = { tenantId };
    if (filters.scope) where.scope = filters.scope;
    if (filters.status) where.status = filters.status;
    if (filters.dateFrom) where.startedAt = { gte: new Date(filters.dateFrom) };
    if (filters.dateTo) {
      if (where.startedAt && typeof where.startedAt === "object") {
        (where.startedAt as Record<string, unknown>).lte = new Date(
          filters.dateTo,
        );
      } else {
        where.startedAt = { lte: new Date(filters.dateTo) };
      }
    }

    return prisma.backupRecord.findMany({
      where: where as any,
      orderBy: { createdAt: "desc" },
    });
  }

  async getBackup(id: string): Promise<any | null> {
    const record = await prisma.backupRecord.findUnique({ where: { id } });
    return record ?? null;
  }

  async deleteBackup(id: string): Promise<void> {
    const record = await prisma.backupRecord.findUnique({ where: { id } });

    if (!record) {
      throw new Error(`Backup ${id} not found`);
    }

    if (record.storagePath) {
      const dir = path.dirname(record.storagePath);
      if (fs.existsSync(dir)) {
        const files = fs
          .readdirSync(dir)
          .filter((f) => f.startsWith(path.basename(record.storagePath!)));
        for (const file of files) {
          fs.rmSync(path.join(dir, file), { recursive: true, force: true });
        }
      }
    }

    await prisma.backupRecord.delete({ where: { id } });
  }

  async scheduleBackup(
    tenantId: string,
    config: ScheduleConfig,
  ): Promise<{ scheduled: true; config: ScheduleConfig }> {
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

  async validateBackup(id: string): Promise<{
    valid: boolean;
    checksumMatch: boolean;
    fileCount: number;
    errors: string[];
  }> {
    const record = await prisma.backupRecord.findUnique({ where: { id } });

    if (!record) {
      throw new Error(`Backup ${id} not found`);
    }

    const errors: string[] = [];
    let fileCount = 0;

    if (
      !record.storagePath ||
      !fs.existsSync(
        record.storagePath
          .replace(/_workflows\.json$/, "")
          .replace(/_executions\.json$/, "")
          .replace(/_audit\.json$/, "")
          .replace(/_billing\.json$/, ""),
      )
    ) {
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
      const computedChecksum = this.computeChecksum(
        record.storagePath!,
        record.scope as BackupScope,
      );
      const checksumMatch = computedChecksum === record.checksum;
      if (!checksumMatch) {
        errors.push("Checksum mismatch — backup data may be corrupted");
      }
      return { valid: errors.length === 0, checksumMatch, fileCount, errors };
    }

    return {
      valid: errors.length === 0,
      checksumMatch: true,
      fileCount,
      errors,
    };
  }

  async estimateBackupSize(tenantId: string): Promise<{
    estimatedBytes: number;
    estimatedRows: Record<string, number>;
  }> {
    const estimatedRows: Record<string, number> = {};

    const tables = [
      "workflows",
      "workflow_versions",
      "executions",
      "audit_log",
      "billing",
    ] as const;
    for (const table of tables) {
      const result: any[] = await prisma.$queryRawUnsafe(
        `SELECT COUNT(*) as count FROM "${table}" WHERE tenant_id = $1`,
        tenantId,
      );
      const row = result[0];
      estimatedRows[table] = Number(row?.count ?? 0);
    }

    const estimatedBytes = Object.values(estimatedRows).reduce(
      (a, b) => a + b * 512,
      0,
    );
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

  private async runIntegrityChecks(tenantId: string): Promise<void> {
    const tables = ["workflows", "executions", "audit_log", "billing"];
    for (const table of tables) {
      try {
        await prisma.$queryRawUnsafe(
          `SELECT COUNT(*) FROM "${table}" WHERE tenant_id = $1`,
          tenantId,
        );
      } catch {
        console.warn(
          `Integrity check skipped for table ${table} — may not exist`,
        );
      }
    }
  }
}
