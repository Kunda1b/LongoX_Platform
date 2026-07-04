import { prisma } from "@longox/db/prisma";

/** ADR-012: Enterprise tenants may extend hot retention to 24 or 36 months. */
export const ALLOWED_HOT_RETENTION_MONTHS = [13, 24, 36] as const;
export type HotRetentionMonths = (typeof ALLOWED_HOT_RETENTION_MONTHS)[number];

/** ADR-012: Cold retention is fixed at 7 years minimum for all tenants. */
export const MIN_COLD_RETENTION_YEARS = 7;

export interface RetentionPolicyConfig {
  hotRetentionMonths: HotRetentionMonths;
  coldRetentionYears: number;
  hotRetentionDays: number;
  coldRetentionDays: number;
  archiveEnabled: boolean;
  archiveBucket: string | null;
  coldQueryEnabled: boolean;
  partitionInterval: "month" | "quarter" | "year";
}

const DEFAULTS: RetentionPolicyConfig = {
  hotRetentionMonths: 13,
  coldRetentionYears: 7,
  hotRetentionDays: 13 * 30,
  coldRetentionDays: 7 * 365,
  archiveEnabled: false,
  archiveBucket: null,
  coldQueryEnabled: false,
  partitionInterval: "month",
};

function monthsToDays(months: number): number {
  return months * 30;
}

function yearsToDays(years: number): number {
  return years * 365;
}

function normalizeHotMonths(months: number): HotRetentionMonths {
  if (ALLOWED_HOT_RETENTION_MONTHS.includes(months as HotRetentionMonths)) {
    return months as HotRetentionMonths;
  }
  return 13;
}

function normalizeColdYears(years: number): number {
  return Math.max(years, MIN_COLD_RETENTION_YEARS);
}

export class RetentionPolicyService {
  async getPolicy(tenantId: string): Promise<RetentionPolicyConfig> {
    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId },
    });

    const hotMonths = normalizeHotMonths(
      (settings as any)?.retentionHotMonths ?? DEFAULTS.hotRetentionMonths,
    );
    const coldYears = normalizeColdYears(
      (settings as any)?.retentionColdYears ?? DEFAULTS.coldRetentionYears,
    );

    const archiveConfig = await prisma.retentionConfig.findUnique({
      where: { tenantId },
    });

    return {
      hotRetentionMonths: hotMonths,
      coldRetentionYears: coldYears,
      hotRetentionDays: monthsToDays(hotMonths),
      coldRetentionDays: yearsToDays(coldYears),
      archiveEnabled: (archiveConfig as any)?.archiveEnabled ?? DEFAULTS.archiveEnabled,
      archiveBucket: (archiveConfig as any)?.archiveBucket ?? DEFAULTS.archiveBucket,
      coldQueryEnabled:
        (archiveConfig as any)?.coldQueryEnabled ?? DEFAULTS.coldQueryEnabled,
      partitionInterval:
        ((archiveConfig as any)?.partitionInterval as RetentionPolicyConfig["partitionInterval"]) ??
        DEFAULTS.partitionInterval,
    };
  }

  async setPolicy(
    tenantId: string,
    config: Partial<RetentionPolicyConfig>,
  ): Promise<RetentionPolicyConfig> {
    const current = await this.getPolicy(tenantId);

    if (config.hotRetentionMonths !== undefined) {
      const hotMonths = normalizeHotMonths(config.hotRetentionMonths);
      await prisma.tenantSettings.upsert({
        where: { tenantId },
        create: {
          tenantId,
          retentionHotMonths: hotMonths,
          retentionColdYears: current.coldRetentionYears,
        } as any,
        update: {
          retentionHotMonths: hotMonths,
        } as any,
      });
    }

    if (config.coldRetentionYears !== undefined) {
      const coldYears = normalizeColdYears(config.coldRetentionYears);
      await prisma.tenantSettings.upsert({
        where: { tenantId },
        create: {
          tenantId,
          retentionHotMonths: current.hotRetentionMonths,
          retentionColdYears: coldYears,
        } as any,
        update: {
          retentionColdYears: coldYears,
        } as any,
      });
    }

    const archiveFields = {
      archiveEnabled: config.archiveEnabled,
      archiveBucket: config.archiveBucket,
      coldQueryEnabled: config.coldQueryEnabled,
      partitionInterval: config.partitionInterval,
    };
    const hasArchiveUpdate = Object.values(archiveFields).some(
      (v) => v !== undefined,
    );

    if (hasArchiveUpdate) {
      const merged = await this.getPolicy(tenantId);
      await prisma.retentionConfig.upsert({
        where: { tenantId },
        create: {
          tenantId,
          hotRetentionDays: merged.hotRetentionDays,
          coldRetentionDays: merged.coldRetentionDays,
          archiveEnabled: config.archiveEnabled ?? merged.archiveEnabled,
          archiveBucket: config.archiveBucket ?? merged.archiveBucket,
          coldQueryEnabled: config.coldQueryEnabled ?? merged.coldQueryEnabled,
          partitionInterval: config.partitionInterval ?? merged.partitionInterval,
        } as any,
        update: {
          hotRetentionDays: merged.hotRetentionDays,
          coldRetentionDays: merged.coldRetentionDays,
          archiveEnabled: config.archiveEnabled ?? merged.archiveEnabled,
          archiveBucket: config.archiveBucket ?? merged.archiveBucket,
          coldQueryEnabled: config.coldQueryEnabled ?? merged.coldQueryEnabled,
          partitionInterval: config.partitionInterval ?? merged.partitionInterval,
        } as any,
      });
    }

    return this.getPolicy(tenantId);
  }

  async getExpirationDates(tenantId: string): Promise<{
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

  async isHotData(tenantId: string, timestamp: Date): Promise<boolean> {
    const policy = await this.getPolicy(tenantId);
    const now = new Date();
    const ageDays =
      (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60 * 24);
    return ageDays <= policy.hotRetentionDays;
  }

  async isColdData(tenantId: string, timestamp: Date): Promise<boolean> {
    const policy = await this.getPolicy(tenantId);
    const now = new Date();
    const ageDays =
      (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60 * 24);
    return (
      ageDays > policy.hotRetentionDays && ageDays <= policy.coldRetentionDays
    );
  }
}
