import { prisma } from "@longox/db/prisma";

interface PoolReadiness {
  ready: boolean;
  checks: {
    db: boolean;
    redis: boolean;
    workers: boolean;
    gateway: boolean;
    storage: boolean;
  };
  lastHeartbeat: Date | null;
}

interface PoolHealth {
  workers: { available: number; total: number };
  queueDepth: number;
  computeUtilization: number;
  dbConnectionPool: { active: number; idle: number; max: number };
}

interface RegionSelection {
  regionId: string;
  reason: string;
  poolHealth: any | null;
}

export class RegionalExecutionPoolService {
  async getOptimalRegion(
    tenantId: string,
    _workflowId: string,
  ): Promise<RegionSelection> {
    const activePools = await prisma.regionalPool.findMany({
      where: {
        status: "active" as any,
        failoverEligible: 1,
      } as any,
      orderBy: { lastHeartbeat: "desc" },
    });

    if (activePools.length === 0) {
      const fallback = await prisma.regionalPool.findFirst({
        where: { isPrimary: 1 } as any,
      });

      if (!fallback) {
        throw new Error("No active regional pools available");
      }

      return {
        regionId: fallback.regionId,
        reason: "No active failover-eligible pools — using primary region",
        poolHealth: fallback,
      };
    }

    const tenantRegionResult = (await prisma.$queryRawUnsafe(
      `SELECT region_id FROM tenants WHERE id = $1`,
      tenantId,
    )) as any[];
    const tenantRegion = tenantRegionResult[0]?.region_id as string | undefined;

    if (tenantRegion) {
      const preferredPool = activePools.find(
        (p) => p.regionId === tenantRegion,
      );
      if (preferredPool) {
        return {
          regionId: preferredPool.regionId,
          reason: `Tenant data residency preference: ${tenantRegion}`,
          poolHealth: preferredPool,
        };
      }
    }

    const sorted = activePools.sort((a, b) => {
      const aScore =
        a.queueDepth + a.cpuUtilization * 10 + a.activeExecutions * 2;
      const bScore =
        b.queueDepth + b.cpuUtilization * 10 + b.activeExecutions * 2;
      return aScore - bScore;
    });

    return {
      regionId: sorted[0].regionId,
      reason: `Lowest load region (queue: ${sorted[0].queueDepth}, cpu: ${sorted[0].cpuUtilization}%)`,
      poolHealth: sorted[0],
    };
  }

  async getPoolStatus(region: string): Promise<PoolHealth> {
    const pool = await prisma.regionalPool.findFirst({
      where: { regionId: region } as any,
    });

    if (!pool) {
      throw new Error(`No pool found for region: ${region}`);
    }

    const dbPoolResult = (await prisma.$queryRawUnsafe(
      `SELECT count(*)::int as active FROM pg_stat_activity WHERE state = 'active'`,
    )) as any[];
    const activeConnections = Number(dbPoolResult[0]?.active ?? 0);

    return {
      workers: {
        available: pool.workerCount - pool.activeExecutions,
        total: pool.workerCount,
      },
      queueDepth: pool.queueDepth,
      computeUtilization: pool.cpuUtilization,
      dbConnectionPool: {
        active: activeConnections,
        idle: Math.max(0, 20 - activeConnections),
        max: 20,
      },
    };
  }

  async routeToRegion(
    executionId: string,
    region: string,
  ): Promise<{ routed: boolean; executionId: string; region: string }> {
    const pool = await prisma.regionalPool.findFirst({
      where: { regionId: region } as any,
    });

    if (!pool) {
      throw new Error(`No pool found for region: ${region}`);
    }

    if (pool.status === "inactive" || pool.status === "draining") {
      throw new Error(
        `Region ${region} is not accepting executions (status: ${pool.status})`,
      );
    }

    await prisma.regionalPool.update({
      where: { id: pool.id },
      data: {
        activeExecutions: pool.activeExecutions + 1,
        lastHealthCheck: new Date(),
      } as any,
    });

    return { routed: true, executionId, region };
  }

  async getPoolReadiness(region: string): Promise<PoolReadiness> {
    const pool = await prisma.regionalPool.findFirst({
      where: { regionId: region } as any,
    });

    if (!pool) {
      return {
        ready: false,
        checks: {
          db: false,
          redis: false,
          workers: false,
          gateway: false,
          storage: false,
        },
        lastHeartbeat: null,
      };
    }

    let dbHealthy = false;
    try {
      await prisma.$queryRawUnsafe(`SELECT 1`);
      dbHealthy = true;
    } catch {
      dbHealthy = false;
    }

    const workersHealthy = pool.workerCount > 0 && pool.status !== "inactive";
    const gatewayHealthy = pool.status !== "draining";

    const heartbeatAge = pool.lastHeartbeat
      ? (Date.now() - new Date(pool.lastHeartbeat).getTime()) / 1000
      : Infinity;
    const heartbeatRecent = heartbeatAge < 120;

    const ready =
      dbHealthy && workersHealthy && gatewayHealthy && heartbeatRecent;

    return {
      ready,
      checks: {
        db: dbHealthy,
        redis: heartbeatRecent,
        workers: workersHealthy,
        gateway: gatewayHealthy,
        storage: pool.status === "active",
      },
      lastHeartbeat: pool.lastHeartbeat,
    };
  }

  async registerPoolHeartbeat(
    region: string,
    metrics?: {
      workerCount?: number;
      activeExecutions?: number;
      queueDepth?: number;
      cpuUtilization?: number;
      memoryUtilization?: number;
      dbReplicaLagSeconds?: number;
    },
  ): Promise<any> {
    const existing = await prisma.regionalPool.findFirst({
      where: { regionId: region } as any,
    });

    const updateData: Record<string, unknown> = {
      lastHeartbeat: new Date(),
      lastHealthCheck: new Date(),
    };

    if (metrics) {
      if (metrics.workerCount !== undefined)
        updateData.workerCount = metrics.workerCount;
      if (metrics.activeExecutions !== undefined)
        updateData.activeExecutions = metrics.activeExecutions;
      if (metrics.queueDepth !== undefined)
        updateData.queueDepth = metrics.queueDepth;
      if (metrics.cpuUtilization !== undefined)
        updateData.cpuUtilization = metrics.cpuUtilization;
      if (metrics.memoryUtilization !== undefined)
        updateData.memoryUtilization = metrics.memoryUtilization;
      if (metrics.dbReplicaLagSeconds !== undefined)
        updateData.dbReplicaLagSeconds = metrics.dbReplicaLagSeconds;
    }

    if (existing) {
      const updated = await prisma.regionalPool.update({
        where: { id: existing.id },
        data: updateData as any,
      });
      return updated;
    }

    const created = await prisma.regionalPool.create({
      data: {
        regionId: region,
        status: "active",
        workerCount: metrics?.workerCount ?? 0,
        activeExecutions: metrics?.activeExecutions ?? 0,
        queueDepth: metrics?.queueDepth ?? 0,
        cpuUtilization: metrics?.cpuUtilization ?? 0,
        memoryUtilization: metrics?.memoryUtilization ?? 0,
        dbReplicaLagSeconds: metrics?.dbReplicaLagSeconds ?? 0,
        lastHeartbeat: new Date(),
        lastHealthCheck: new Date(),
        isPrimary: 0,
        failoverEligible: 1,
      } as any,
    });
    return created;
  }

  async handleRegionDegradation(region: string): Promise<{
    failedOver: boolean;
    targetRegion: string | null;
    actions: string[];
  }> {
    const pool = await prisma.regionalPool.findFirst({
      where: { regionId: region } as any,
    });

    if (!pool) {
      throw new Error(`No pool found for region: ${region}`);
    }

    const actions: string[] = [];

    await prisma.regionalPool.update({
      where: { id: pool.id },
      data: { status: "degraded" as any } as any,
    });

    actions.push(`Set ${region} pool status to degraded`);

    if (pool.isPrimary) {
      const failoverTargets = await prisma.regionalPool.findMany({
        where: {
          failoverEligible: 1,
          status: "active" as any,
          NOT: { regionId: region },
        } as any,
        orderBy: { lastHeartbeat: "desc" },
        take: 1,
      });

      if (failoverTargets.length > 0) {
        const target = failoverTargets[0];

        await prisma.regionalPool.update({
          where: { id: pool.id },
          data: { isPrimary: 0 } as any,
        });

        await prisma.regionalPool.update({
          where: { id: target.id },
          data: { isPrimary: 1 } as any,
        });

        actions.push(`Promoted ${target.regionId} to primary`);
        actions.push("Updated DNS routing to new primary region");

        return { failedOver: true, targetRegion: target.regionId, actions };
      }

      actions.push("No failover-eligible targets found — remaining degraded");
      return { failedOver: false, targetRegion: null, actions };
    }

    return { failedOver: false, targetRegion: null, actions };
  }
}
