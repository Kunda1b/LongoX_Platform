import { prisma } from "@longox/db/prisma";
import { RetentionPolicyService } from "./retention-policy.service";

const MANAGED_TABLES = [
  "executions",
  "execution_checkpoints",
  "usage_events",
  "audit_log",
];

interface PartitionInfo {
  partitionName: string;
  tableName: string;
  rangeStart: string;
  rangeEnd: string;
}

export class PartitionManagerService {
  private policyService: RetentionPolicyService;

  constructor(policyService?: RetentionPolicyService) {
    this.policyService = policyService ?? new RetentionPolicyService();
  }

  async createPartitions(
    tableName: string,
    startDate: Date,
    endDate: Date,
    interval: "month" | "quarter" | "year",
  ): Promise<string[]> {
    const created: string[] = [];
    const current = new Date(startDate);

    while (current < endDate) {
      const { rangeStart, rangeEnd, partitionSuffix } =
        this.getPartitionRange(current, interval);
      const partitionName = `${tableName}_${partitionSuffix}`;

      const sql = `
        CREATE TABLE IF NOT EXISTS "${partitionName}"
        PARTITION OF "${tableName}"
        FOR VALUES FROM ('${rangeStart}') TO ('${rangeEnd}')
      `;

      try {
        await prisma.$executeRawUnsafe(sql);
        created.push(partitionName);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (!message.includes("already exists")) {
          throw err;
        }
        created.push(partitionName);
      }

      this.advanceDate(current, interval);
    }

    return created;
  }

  async getPartitions(tableName?: string): Promise<PartitionInfo[]> {
    const tableFilter = tableName
      ? `AND parent.relname = '${tableName}'`
      : `AND parent.relname IN (${MANAGED_TABLES.map((t) => `'${t}'`).join(",")})`;

    const sql = `
      SELECT
        child.relname AS partition_name,
        parent.relname AS table_name,
        pg_get_expr(child.relpartbound, child.oid) AS partition_range
      FROM pg_inherits
      JOIN pg_class parent ON pg_inherits.inhparent = parent.oid
      JOIN pg_class child ON pg_inherits.inhrelid = child.oid
      WHERE parent.relkind = 'p'
      ${tableFilter}
      ORDER BY child.relname
    `;

    const rows = (await prisma.$queryRawUnsafe(sql)) as any[];

    return rows.map((row: any) => ({
      partitionName: row.partition_name,
      tableName: row.table_name,
      rangeStart: row.partition_range ?? "",
      rangeEnd: "",
    }));
  }

  async getActivePartitions(tenantId: string): Promise<PartitionInfo[]> {
    const { hotExpiresAt } =
      await this.policyService.getExpirationDates(tenantId);
    const all = await this.getPartitions();
    return all.filter((p) => {
      const dateMatch = p.partitionName.match(/_(\d{6})$/);
      if (!dateMatch) return true;
      const partitionDate = this.parsePartitionDate(dateMatch[1]);
      return partitionDate >= hotExpiresAt;
    });
  }

  async getExpiredPartitions(tenantId: string): Promise<PartitionInfo[]> {
    const { hotExpiresAt } =
      await this.policyService.getExpirationDates(tenantId);
    const all = await this.getPartitions();
    return all.filter((p) => {
      const dateMatch = p.partitionName.match(/_(\d{6})$/);
      if (!dateMatch) return false;
      const partitionDate = this.parsePartitionDate(dateMatch[1]);
      return partitionDate < hotExpiresAt;
    });
  }

  async dropPartition(partitionName: string): Promise<void> {
    const sql = `DROP TABLE IF EXISTS "${partitionName}"`;
    await prisma.$executeRawUnsafe(sql);
  }

  async detachPartition(partitionName: string): Promise<void> {
    const tableName = this.extractTableName(partitionName);
    if (!tableName) {
      throw new Error(`Cannot determine parent table for ${partitionName}`);
    }
    const sql = `ALTER TABLE "${tableName}" DETACH PARTITION "${partitionName}"`;
    await prisma.$executeRawUnsafe(sql);
  }

  private getPartitionRange(
    date: Date,
    interval: "month" | "quarter" | "year",
  ): { rangeStart: string; rangeEnd: string; partitionSuffix: string } {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");

    switch (interval) {
      case "month": {
        const rangeStart = `${y}-${m}-01`;
        const next = new Date(date);
        next.setMonth(next.getMonth() + 1);
        const rangeEnd = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-01`;
        return { rangeStart, rangeEnd, partitionSuffix: `${y}${m}` };
      }
      case "quarter": {
        const q = Math.floor(date.getMonth() / 3) * 3 + 1;
        const rangeStart = `${y}-${String(q).padStart(2, "0")}-01`;
        const next = new Date(y, q + 2, 1);
        const rangeEnd = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-01`;
        return { rangeStart, rangeEnd, partitionSuffix: `${y}Q${Math.ceil(date.getMonth() / 3 + 1)}` };
      }
      case "year": {
        const rangeStart = `${y}-01-01`;
        const rangeEnd = `${y + 1}-01-01`;
        return { rangeStart, rangeEnd, partitionSuffix: `${y}` };
      }
    }
  }

  private advanceDate(date: Date, interval: "month" | "quarter" | "year"): void {
    switch (interval) {
      case "month":
        date.setMonth(date.getMonth() + 1);
        break;
      case "quarter":
        date.setMonth(date.getMonth() + 3);
        break;
      case "year":
        date.setFullYear(date.getFullYear() + 1);
        break;
    }
  }

  private parsePartitionDate(suffix: string): Date {
    const y = parseInt(suffix.substring(0, 4), 10);
    const m = parseInt(suffix.substring(4, 6), 10) - 1;
    return new Date(y, m, 1);
  }

  private extractTableName(partitionName: string): string | null {
    for (const tbl of MANAGED_TABLES) {
      if (partitionName.startsWith(tbl + "_")) {
        return tbl;
      }
    }
    return null;
  }
}
