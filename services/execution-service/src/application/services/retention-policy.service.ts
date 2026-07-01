import { eq } from "drizzle-orm";
import { db, retentionConfigTable } from "@longox/db";

export interface RetentionPolicyConfig {
  hotRetentionDays: number;
  coldRetentionDays: number;
  archiveEnabled: boolean;
  archiveBucket: string | null;
  coldQueryEnabled: boolean;
  partitionInterval: "month" | "quarter" | "year";
}

const DEFAULTS: RetentionPolicyConfig = {
  hotRetentionDays: 395,
  coldRetentionDays: 2555,
  archiveEnabled: false,
  archiveBucket: null,
  coldQueryEnabled: false,
  partitionInterval: "month",
};

export class RetentionPolicyService {
  async getPolicy(tenantId: number): Promise<RetentionPolicyConfig> {
    const [row] = await db
      .select()
      .from(retentionConfigTable)
      .where(eq(retentionConfigTable.tenantId, tenantId))
      .limit(1);

    if (!row) {
      return { ...DEFAULTS };
    }

    return {
      hotRetentionDays: row.hotRetentionDays,
      coldRetentionDays: row.coldRetentionDays,
      archiveEnabled: row.archiveEnabled,
      archiveBucket: row.archiveBucket,
      coldQueryEnabled: row.coldQueryEnabled,
      partitionInterval: row.partitionInterval as "month" | "quarter" | "year",
    };
  }

  async setPolicy(
    tenantId: number,
    config: Partial<RetentionPolicyConfig>,
  ): Promise<RetentionPolicyConfig> {
    const current = await this.getPolicy(tenantId);
    const merged = { ...current, ...config };

    await db
      .insert(retentionConfigTable)
      .values({
        tenantId,
        hotRetentionDays: merged.hotRetentionDays,
        coldRetentionDays: merged.coldRetentionDays,
        archiveEnabled: merged.archiveEnabled,
        archiveBucket: merged.archiveBucket,
        coldQueryEnabled: merged.coldQueryEnabled,
        partitionInterval: merged.partitionInterval,
      })
      .onConflictDoUpdate({
        target: retentionConfigTable.tenantId,
        set: {
          hotRetentionDays: merged.hotRetentionDays,
          coldRetentionDays: merged.coldRetentionDays,
          archiveEnabled: merged.archiveEnabled,
          archiveBucket: merged.archiveBucket,
          coldQueryEnabled: merged.coldQueryEnabled,
          partitionInterval: merged.partitionInterval,
        },
      });

    return merged;
  }

  async getExpirationDates(tenantId: number): Promise<{
    hotExpiresAt: Date;
    coldExpiresAt: Date;
  }> {
    const policy = await this.getPolicy(tenantId);
    const now = new Date();

    const hotExpiresAt = new Date(now);
    hotExpiresAt.setDate(hotExpiresAt.getDate() - policy.hotRetentionDays);

    const coldExpiresAt = new Date(now);
    coldExpiresAt.setDate(coldExpiresAt.getDate() - policy.coldRetentionDays);

    return { hotExpiresAt, coldExpiresAt };
  }

  isHotData(tenantId: number, timestamp: Date): boolean {
    const now = new Date();
    const ageDays =
      (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60 * 24);
    return ageDays <= DEFAULTS.hotRetentionDays;
  }

  isColdData(tenantId: number, timestamp: Date): boolean {
    const now = new Date();
    const ageDays =
      (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60 * 24);
    return (
      ageDays > DEFAULTS.hotRetentionDays &&
      ageDays <= DEFAULTS.coldRetentionDays
    );
  }
}
