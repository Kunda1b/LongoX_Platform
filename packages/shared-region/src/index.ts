import { logger } from "@longox/shared-logger";

export interface RegionConfig {
  id: string;
  name: string;
  endpoint: string;
  label?: string;
  priority?: number;
  isActive?: boolean;
  isPrimary?: boolean;
  capabilities?: string[];
  dataResidencyCompliant?: boolean;
  failoverPriority?: number;
}

export interface RegionHealth {
  region: string;
  healthy: boolean;
  latencyMs?: number;
  lastChecked: string;
  error?: string;
  isPrimary?: boolean;
}

export interface FailoverStatus {
  activeRegion: string;
  standbyRegion: string;
  lastFailoverAt: string | null;
  failoverCount: number;
  healthy: boolean;
}

export interface DataResidencyPolicy {
  tenantId: string;
  allowedRegions: string[];
  requiredRegion: string | null;
  dataClassification: "standard" | "sensitive" | "critical";
}

function getEnvRegions(): RegionConfig[] {
  try {
    const raw = process.env["REGIONS"];
    if (!raw) return [];
    return JSON.parse(raw) as RegionConfig[];
  } catch {
    return [];
  }
}

export class RegionManager {
  private regions: Map<string, RegionConfig> = new Map();
  private healthCache: Map<string, RegionHealth> = new Map();
  private healthCheckInterval: ReturnType<typeof setInterval> | null = null;
  private failoverCount = 0;
  private lastFailoverAt: string | null = null;
  private activeRegionOverride: string | null = null;

  constructor(regions?: RegionConfig[]) {
    const configured = regions ?? getEnvRegions();
    if (configured.length === 0) {
      const localRegion: RegionConfig = {
        id: "local",
        name: "Local",
        endpoint: `http://localhost:${process.env["PORT"] ?? 4000}`,
        label: "Local Development",
        priority: 100,
        isPrimary: true,
        isActive: true,
        capabilities: [
          "workflows",
          "executions",
          "storage",
          "ai",
          "marketplace",
        ],
        dataResidencyCompliant: true,
        failoverPriority: 1,
      };
      this.regions.set("local", localRegion);
    } else {
      for (const r of configured) {
        this.regions.set(r.id, {
          ...r,
          isActive: r.isActive ?? true,
          isPrimary: r.isPrimary ?? false,
        });
      }
    }
  }

  getRegion(id: string): RegionConfig | undefined {
    return this.regions.get(id);
  }

  getAllRegions(): RegionConfig[] {
    return Array.from(this.regions.values()).sort(
      (a, b) => (b.priority ?? 0) - (a.priority ?? 0),
    );
  }

  getActiveRegions(): RegionConfig[] {
    return this.getAllRegions().filter((r) => r.isActive !== false);
  }

  getLocalRegionId(): string {
    return process.env["REGION_ID"] ?? "local";
  }

  isLocalRegion(id: string): boolean {
    return id === this.getLocalRegionId();
  }

  getPrimaryRegion(): RegionConfig | undefined {
    return this.getAllRegions().find((r) => r.isPrimary);
  }

  getHealthyRegions(): RegionConfig[] {
    const healthy = Array.from(this.healthCache.entries())
      .filter(([_, h]) => h.healthy)
      .map(([id]) => this.regions.get(id))
      .filter((r): r is RegionConfig => r !== undefined);

    return healthy.length > 0 ? healthy : this.getActiveRegions();
  }

  async checkHealth(regionId?: string): Promise<RegionHealth> {
    const target = regionId ?? this.getLocalRegionId();
    const region = this.regions.get(target);

    if (!region) {
      return {
        region: target,
        healthy: false,
        lastChecked: new Date().toISOString(),
        error: "Unknown region",
        isPrimary: false,
      };
    }

    const start = Date.now();
    try {
      const res = await fetch(`${region.endpoint}/api/healthz`, {
        signal: AbortSignal.timeout(5000),
      });
      const health: RegionHealth = {
        region: target,
        healthy: res.ok,
        latencyMs: Date.now() - start,
        lastChecked: new Date().toISOString(),
        isPrimary: region.isPrimary,
      };
      this.healthCache.set(target, health);
      return health;
    } catch (err) {
      const health: RegionHealth = {
        region: target,
        healthy: false,
        lastChecked: new Date().toISOString(),
        error: err instanceof Error ? err.message : "Unknown error",
        isPrimary: region.isPrimary,
      };
      this.healthCache.set(target, health);
      return health;
    }
  }

  async checkAllRegions(): Promise<RegionHealth[]> {
    const checks = this.getActiveRegions().map((r) => this.checkHealth(r.id));
    return Promise.all(checks);
  }

  startHealthChecks(intervalMs: number = 30000): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    this.healthCheckInterval = setInterval(async () => {
      await this.checkAllRegions();
    }, intervalMs);
    logger.info({ intervalMs }, "[Region] Health checks started");
  }

  stopHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  pickRegion(preferred?: string, tenantDataResidency?: string): RegionConfig {
    if (preferred) {
      const region = this.regions.get(preferred);
      if (region && region.isActive !== false) return region;
    }

    if (tenantDataResidency) {
      const compliant = this.getHealthyRegions().filter(
        (r) => r.dataResidencyCompliant && r.id === tenantDataResidency,
      );
      if (compliant.length > 0) return compliant[0];
    }

    const healthy = this.getHealthyRegions();
    if (healthy.length === 0) return this.getActiveRegions()[0];

    const primary = healthy.find((r) => r.isPrimary);
    if (primary) return primary;

    return healthy[0];
  }

  getFailoverStatus(): FailoverStatus {
    const primary = this.getPrimaryRegion();
    const healthy = this.getHealthyRegions();
    const activeRegion =
      this.activeRegionOverride ?? primary?.id ?? healthy[0]?.id ?? "local";
    const standby = healthy.find((r) => r.id !== activeRegion);

    return {
      activeRegion,
      standbyRegion: standby?.id ?? "none",
      lastFailoverAt: this.lastFailoverAt,
      failoverCount: this.failoverCount,
      healthy: healthy.length > 0,
    };
  }

  async performFailover(preferredRegionId?: string): Promise<RegionConfig> {
    const target = preferredRegionId
      ? this.regions.get(preferredRegionId)
      : this.getHealthyRegions().sort(
          (a, b) => (b.failoverPriority ?? 99) - (a.failoverPriority ?? 99),
        )[0];

    if (!target) {
      throw new Error("No available region for failover");
    }

    this.activeRegionOverride = target.id;
    this.failoverCount++;
    this.lastFailoverAt = new Date().toISOString();

    logger.warn(
      { from: this.getLocalRegionId(), to: target.id },
      "[Region] Failover initiated",
    );
    return target;
  }

  resetFailover(): void {
    this.activeRegionOverride = null;
    logger.info("[Region] Failover reset");
  }

  isDataResidencyCompliant(
    tenantRegion: string,
    targetRegions: string[],
  ): boolean {
    if (!tenantRegion) return true;
    return (
      targetRegions.includes(tenantRegion) || !this.regions.has(tenantRegion)
    );
  }

  async forwardRequest(
    regionId: string,
    path: string,
    options?: RequestInit,
  ): Promise<Response> {
    const region = this.regions.get(regionId);
    if (!region) {
      throw new Error(`Unknown region: ${regionId}`);
    }
    const url = `${region.endpoint}${path}`;
    return fetch(url, {
      ...options,
      headers: {
        ...options?.headers,
        "X-Forwarded-Region": this.getLocalRegionId(),
        "X-Original-Region": process.env["REGION_ID"] ?? "local",
      },
    });
  }
}

function createDefaultManager(): RegionManager {
  const manager = new RegionManager();
  manager.startHealthChecks();
  return manager;
}

let defaultManager: RegionManager | null = null;

export function getRegionManager(): RegionManager {
  if (!defaultManager) {
    defaultManager = createDefaultManager();
  }
  return defaultManager;
}
