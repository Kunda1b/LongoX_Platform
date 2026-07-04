import { prisma } from "@longox/db/prisma";

export interface TierRoutingConfig {
  dbPool: string;
  redisIndex: number;
  vaultPrefix: string;
  k8sNamespace: string;
  rateLimitPerMin: number;
  rateLimitBurst: number;
}

const TIER_CONFIGS: Record<number, TierRoutingConfig> = {
  1: {
    dbPool: "shared",
    redisIndex: 0,
    vaultPrefix: "shared",
    k8sNamespace: "tenant-shared",
    rateLimitPerMin: 60,
    rateLimitBurst: 100,
  },
  2: {
    dbPool: "dedicated-ns",
    redisIndex: 1,
    vaultPrefix: "dedicated-ns",
    k8sNamespace: "tenant-dedicated-ns",
    rateLimitPerMin: 300,
    rateLimitBurst: 500,
  },
  3: {
    dbPool: "dedicated-cluster",
    redisIndex: 2,
    vaultPrefix: "dedicated-cluster",
    k8sNamespace: "tenant-dedicated-cluster",
    rateLimitPerMin: 1000,
    rateLimitBurst: 2000,
  },
};

export function getTierConfig(tier: number): TierRoutingConfig {
  return TIER_CONFIGS[tier] ?? TIER_CONFIGS[1];
}

export function getDatabasePoolForTier(tier: number): string {
  return getTierConfig(tier).dbPool;
}

export function getRedisIndexForTier(tier: number): number {
  return getTierConfig(tier).redisIndex;
}

export function getVaultPrefixForTier(tier: number, tenantId: string): string {
  return `${getTierConfig(tier).vaultPrefix}/tenants/${tenantId}`;
}

export function getK8sNamespaceForTier(tier: number): string {
  return getTierConfig(tier).k8sNamespace;
}

export function getRateLimitsForTier(tier: number): { perMin: number; burst: number } {
  const cfg = getTierConfig(tier);
  return { perMin: cfg.rateLimitPerMin, burst: cfg.rateLimitBurst };
}

export async function getTenantTier(tenantId: string): Promise<number> {
  const tenant = (await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { tier: true } as any,
  })) as any;
  return tenant?.tier ?? 1;
}
