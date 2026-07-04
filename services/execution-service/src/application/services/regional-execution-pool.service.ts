import { eq, desc, and, sql } from "drizzle-orm";
import { db, regionalPoolsTable } from "@longox/db";

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
  poolHealth: typeof regionalPoolsTable.$inferSelect | null;
}

export class RegionalExecutionPoolService {
  async getOptimalRegion(
    tenantId: string,
    workflowId: string,
  ): Promise<RegionSelection> {
    const activePools = await db
      .select()
      .from(regionalPoolsTable)
      .where(
        and(
          eq(regionalPoolsTable.status, "active" as any),
          eq(regionalPoolsTable.failoverEligible, 1),
        ),
      )
      .orderBy(desc(regionalPoolsTable.lastHeartbeat));

    if (activePools.length === 0) {
      const fallback = await db
        .select()
        .from(regionalPoolsTable)
        .where(eq(regionalPoolsTable.isPrimary, 1))
        .limit(1);

      if (fallback.length === 0) {
        throw new Error("No active regional pools available");
      }

      return {
        regionId: fallback[0].regionId,
        reason: "No active failover-eligible pools — using primary region",
        poolHealth: fallback[0],
      };
    }

    const tenantRegionResult = await db.execute(sql`
      SELECT region_id FROM tenants WHERE id = ${tenantId}
    `);
    const tenantRegion = (tenantRegionResult.rows ?? tenantRegionResult)[0]?.region_id as string | undefined;

    if (tenantRegion) {
      const preferredPool = activePools.find((p) => p.regionId === tenantRegion);
      if (preferredPool) {
        return {
          regionId: preferredPool.regionId,
          reason: `Tenant data residency preference: ${tenantRegion}`,
          poolHealth: preferredPool,
        };
      }
    }

    const sorted = activePools.sort((a, b) => {
      const aScore = a.queueDepth + a.cpuUtilization * 10 + a.activeExecutions * 2;
      const bScore = b.queueDepth + b.cpuUtilization * 10 + b.activeExecutions * 2;
      return aScore - bScore;
    });

    return {
      regionId: sorted[0].regionId,
      reason: `Lowest load region (queue: ${sorted[0].queueDepth}, cpu: ${sorted[0].cpuUtilization}%)`,
      poolHealth: sorted[0],
    };
  }

  async getPoolStatus(region: string): Promise<PoolHealth> {
    const [pool] = await db
      .select()
      .from(regionalPoolsTable)
      .where(eq(regionalPoolsTable.regionId, region))
      .limit(1);

    if (!pool) {
      throw new Error(`No pool found for region: ${region}`);
    }

    const dbPoolResult = await db.execute(sql`
      SELECT count(*) as active FROM pg_stat_activity WHERE state = 'active'
    `);
    const activeConnections = Number((dbPoolResult.rows ?? dbPoolResult)[0]?.active ?? 0);

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

  async routeToRegion(executionId: string, region: string): Promise<{ routed: boolean; executionId: string; region: string }> {
    const [pool] = await db
      .select()
      .from(regionalPoolsTable)
      .where(eq(regionalPoolsTable.regionId, region))
      .limit(1);

    if (!pool) {
      throw new Error(`No pool found for region: ${region}`);
    }

    if (pool.status === "inactive" || pool.status === "draining") {
      throw new Error(`Region ${region} is not accepting executions (status: ${pool.status})`);
    }

    await db
      .update(regionalPoolsTable)
      .set({
        activeExecutions: pool.activeExecutions + 1,
        lastHealthCheck: new Date(),
      })
      .where(eq(regionalPoolsTable.id, pool.id));

    return { routed: true, executionId, region };
  }

  async getPoolReadiness(region: string): Promise<PoolReadiness> {
    const [pool] = await db
      .select()
      .from(regionalPoolsTable)
      .where(eq(regionalPoolsTable.regionId, region))
      .limit(1);

    if (!pool) {
      return {
        ready: false,
        checks: { db: false, redis: false, workers: false, gateway: false, storage: false },
        lastHeartbeat: null,
      };
    }

    let dbHealthy = false;
    try {
      await db.execute(sql`SELECT 1`);
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

    const ready = dbHealthy && workersHealthy && gatewayHealthy && heartbeatRecent;

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
  ): Promise<typeof regionalPoolsTable.$inferSelect> {
    const [existing] = await db
      .select()
      .from(regionalPoolsTable)
      .where(eq(regionalPoolsTable.regionId, region))
      .limit(1);

    const updateData: Record<string, unknown> = {
      lastHeartbeat: new Date(),
      lastHealthCheck: new Date(),
    };

    if (metrics) {
      if (metrics.workerCount !== undefined) updateData.workerCount = metrics.workerCount;
      if (metrics.activeExecutions !== undefined) updateData.activeExecutions = metrics.activeExecutions;
      if (metrics.queueDepth !== undefined) updateData.queueDepth = metrics.queueDepth;
      if (metrics.cpuUtilization !== undefined) updateData.cpuUtilization = metrics.cpuUtilization;
      if (metrics.memoryUtilization !== undefined) updateData.memoryUtilization = metrics.memoryUtilization;
      if (metrics.dbReplicaLagSeconds !== undefined) updateData.dbReplicaLagSeconds = metrics.dbReplicaLagSeconds;
    }

    if (existing) {
      const [updated] = await db
        .update(regionalPoolsTable)
        .set(updateData)
        .where(eq(regionalPoolsTable.id, existing.id))
        .returning();
      return updated!;
    }

    const [created] = await db
      .insert(regionalPoolsTable)
      .values({
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
      })
      .returning();
    return created!;
  }

  async handleRegionDegradation(region: string): Promise<{ failedOver: boolean; targetRegion: string | null; actions: string[] }> {
    const [pool] = await db
      .select()
      .from(regionalPoolsTable)
      .where(eq(regionalPoolsTable.regionId, region))
      .limit(1);

    if (!pool) {
      throw new Error(`No pool found for region: ${region}`);
    }

    const actions: string[] = [];

    await db
      .update(regionalPoolsTable)
      .set({ status: "degraded" as any })
      .where(eq(regionalPoolsTable.id, pool.id));

    actions.push(`Set ${region} pool status to degraded`);

    if (pool.isPrimary) {
      const failoverTargets = await db
        .select()
        .from(regionalPoolsTable)
        .where(
          and(
            eq(regionalPoolsTable.failoverEligible, 1),
            eq(regionalPoolsTable.status, "active" as any),
            sql`${regionalPoolsTable.regionId} != ${region}`,
          ),
        )
        .orderBy(desc(regionalPoolsTable.lastHeartbeat))
        .limit(1);

      if (failoverTargets.length > 0) {
        const target = failoverTargets[0];

        await db
          .update(regionalPoolsTable)
          .set({ isPrimary: 0 })
          .where(eq(regionalPoolsTable.id, pool.id));

        await db
          .update(regionalPoolsTable)
          .set({ isPrimary: 1 })
          .where(eq(regionalPoolsTable.id, target.id));

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
