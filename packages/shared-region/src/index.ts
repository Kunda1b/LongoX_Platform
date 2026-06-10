import { logger } from "@autoflow/shared-logger";

export interface RegionConfig {
  id: string;
  name: string;
  endpoint: string;
  label?: string;
  priority?: number;
  capabilities?: string[];
}

export interface RegionHealth {
  region: string;
  healthy: boolean;
  latencyMs?: number;
  lastChecked: string;
  error?: string;
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

  constructor(regions?: RegionConfig[]) {
    const configured = regions ?? getEnvRegions();

    if (configured.length === 0) {
      const localRegion: RegionConfig = {
        id: "local",
        name: "Local",
        endpoint: `http://localhost:${process.env["PORT"] ?? 4000}`,
        label: "Local Development",
        priority: 100,
        capabilities: ["workflows", "executions", "storage"],
      };
      this.regions.set("local", localRegion);
    } else {
      for (const r of configured) {
        this.regions.set(r.id, r);
      }
    }
  }

  getRegion(id: string): RegionConfig | undefined {
    return this.regions.get(id);
  }

  getAllRegions(): RegionConfig[] {
    return Array.from(this.regions.values()).sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  }

  getLocalRegionId(): string {
    return process.env["REGION_ID"] ?? "local";
  }

  isLocalRegion(id: string): boolean {
    return id === this.getLocalRegionId();
  }

  getHealthyRegions(): RegionConfig[] {
    const healthy = Array.from(this.healthCache.entries())
      .filter(([_, h]) => h.healthy)
      .map(([id]) => this.regions.get(id))
      .filter((r): r is RegionConfig => r !== undefined);

    return healthy.length > 0 ? healthy : this.getAllRegions();
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
      };
    }

    const start = Date.now();
    try {
      const res = await fetch(`${region.endpoint}/api/health`, {
        signal: AbortSignal.timeout(5000),
      });

      const health: RegionHealth = {
        region: target,
        healthy: res.ok,
        latencyMs: Date.now() - start,
        lastChecked: new Date().toISOString(),
      };

      this.healthCache.set(target, health);
      return health;
    } catch (err) {
      const health: RegionHealth = {
        region: target,
        healthy: false,
        lastChecked: new Date().toISOString(),
        error: err instanceof Error ? err.message : "Unknown error",
      };

      this.healthCache.set(target, health);
      return health;
    }
  }

  async checkAllRegions(): Promise<RegionHealth[]> {
    const checks = this.getAllRegions().map((r) => this.checkHealth(r.id));
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

  pickRegion(preferred?: string): RegionConfig {
    if (preferred) {
      const region = this.regions.get(preferred);
      if (region) return region;
    }

    const healthy = this.getHealthyRegions();
    if (healthy.length === 0) return this.getAllRegions()[0];

    return healthy[0];
  }

  async forwardRequest(regionId: string, path: string, options?: RequestInit): Promise<Response> {
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
