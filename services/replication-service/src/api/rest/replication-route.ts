import { Router, type IRouter } from "express";
import { authorize } from "@longox/shared-rbac";
import { getRegionManager } from "@longox/shared-region";
import { db, replicationConfigsTable, replicationLogTable, regionsTable } from "@longox/db";

const router: IRouter = Router();

router.get(
  "/replication/regions",
  authorize({ resource: "admin", action: "read" }),
  async (_req, res): Promise<void> => {
    const manager = getRegionManager();
    const regions = manager.getAllRegions();
    const health = await manager.checkAllRegions();

    res.json({
      regions: regions.map((r) => ({
        ...r,
        health: health.find((h) => h.region === r.id),
      })),
    });
  },
);

router.post(
  "/replication/regions/sync",
  authorize({ resource: "admin", action: "write" }),
  async (req, res): Promise<void> => {
    const { regionId, entityType, entityIds } = req.body as {
      regionId?: string;
      entityType?: string;
      entityIds?: string[];
    };

    if (!regionId || !entityType) {
      res.status(400).json({ error: "regionId and entityType are required" });
      return;
    }

    const manager = getRegionManager();
    const region = manager.getRegion(regionId);
    if (!region) {
      res.status(404).json({ error: "Region not found" });
      return;
    }

    const configs = await db
      .select()
      .from(replicationConfigsTable)
      .where(
        (() => {
          const { eq, and } = require("drizzle-orm");
          return and(
            eq(replicationConfigsTable.sourceRegionId, manager.getLocalRegionId()),
            eq(replicationConfigsTable.targetRegionId, regionId),
            eq(replicationConfigsTable.entityType, entityType),
            eq(replicationConfigsTable.isActive, true),
          );
        })(),
      );

    if (configs.length === 0) {
      res.status(400).json({ error: "No active replication config for this region and entity type" });
      return;
    }

    const config = configs[0];
    const ids = entityIds ?? [];

    for (const entityId of ids) {
      await db.insert(replicationLogTable).values({
        configId: config.id,
        entityId,
        entityType,
        sourceRegion: manager.getLocalRegionId(),
        targetRegion: regionId,
        status: "pending",
      });
    }

    res.json({
      success: true,
      queued: ids.length,
      configId: config.id,
    });
  },
);

router.get(
  "/replication/configs",
  authorize({ resource: "admin", action: "read" }),
  async (_req, res): Promise<void> => {
    const configs = await db
      .select()
      .from(replicationConfigsTable)
      .orderBy(replicationConfigsTable.sourceRegionId);

    res.json(configs);
  },
);

router.post(
  "/replication/configs",
  authorize({ resource: "admin", action: "write" }),
  async (req, res): Promise<void> => {
    const {
      sourceRegionId,
      targetRegionId,
      entityType,
      replicationMode,
      batchSize,
      syncIntervalMs,
      conflictResolution,
    } = req.body as Record<string, unknown>;

    if (!sourceRegionId || !targetRegionId || !entityType) {
      res.status(400).json({ error: "sourceRegionId, targetRegionId, and entityType are required" });
      return;
    }

    const [config] = await db
      .insert(replicationConfigsTable)
      .values({
        sourceRegionId: String(sourceRegionId),
        targetRegionId: String(targetRegionId),
        entityType: String(entityType),
        replicationMode: String(replicationMode ?? "async"),
        batchSize: Number(batchSize ?? 100),
        syncIntervalMs: Number(syncIntervalMs ?? 30000),
        conflictResolution: String(conflictResolution ?? "last-write-wins"),
      })
      .returning();

    res.status(201).json(config);
  },
);

router.put(
  "/replication/configs/:id",
  authorize({ resource: "admin", action: "write" }),
  async (req, res): Promise<void> => {
    const id = req.params.id;
    if (!id) {
      res.status(400).json({ error: "id is required" });
      return;
    }

    const updates = req.body as Record<string, unknown>;
    const allowedFields = [
      "replicationMode",
      "batchSize",
      "syncIntervalMs",
      "conflictResolution",
      "isActive",
    ];

    const filtered: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        filtered[field] = updates[field];
      }
    }

    const [updated] = await db
      .update(replicationConfigsTable)
      .set(filtered)
      .where(
        (() => {
          const { eq } = require("drizzle-orm");
          return eq(replicationConfigsTable.id, id);
        })(),
      )
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Config not found" });
      return;
    }

    res.json(updated);
  },
);

router.get(
  "/replication/log",
  authorize({ resource: "admin", action: "read" }),
  async (req, res): Promise<void> => {
    const { status, entityType, limit: limitStr, offset: offsetStr } =
      req.query as Record<string, string | undefined>;

    let query: any = db.select().from(replicationLogTable);

    if (status) {
      const { eq } = require("drizzle-orm");
      query = query.where(eq(replicationLogTable.status, status));
    }
    if (entityType) {
      const { eq } = require("drizzle-orm");
      query = query.where(eq(replicationLogTable.entityType, entityType));
    }

    const rows = await query
      .orderBy(replicationLogTable.createdAt)
      .limit(Number(limitStr ?? 100))
      .offset(Number(offsetStr ?? 0));

    res.json(rows);
  },
);

router.post(
  "/replication/failover",
  authorize({ resource: "admin", action: "write" }),
  async (req, res): Promise<void> => {
    const { targetRegionId } = req.body as { targetRegionId?: string };
    const manager = getRegionManager();

    try {
      const target = await manager.performFailover(targetRegionId);
      res.json({
        success: true,
        activeRegion: target.id,
        failoverCount: manager.getFailoverStatus().failoverCount,
      });
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  },
);

router.post(
  "/replication/failover/reset",
  authorize({ resource: "admin", action: "write" }),
  async (_req, res): Promise<void> => {
    const manager = getRegionManager();
    manager.resetFailover();
    res.json({ success: true });
  },
);

router.get(
  "/replication/failover/status",
  authorize({ resource: "admin", action: "read" }),
  async (_req, res): Promise<void> => {
    const manager = getRegionManager();
    const status = manager.getFailoverStatus();
    const health = await manager.checkAllRegions();

    res.json({ ...status, regionHealth: health });
  },
);

router.post(
  "/replication/dr-policies",
  authorize({ resource: "admin", action: "write" }),
  async (req, res): Promise<void> => {
    const {
      name,
      description,
      primaryRegionId,
      failoverRegionId,
      recoveryTier,
      rpoSeconds,
      rtoSeconds,
      autoFailover,
      healthThreshold,
    } = req.body as Record<string, unknown>;

    if (!name || !primaryRegionId || !failoverRegionId) {
      res.status(400).json({ error: "name, primaryRegionId, and failoverRegionId are required" });
      return;
    }

    const { drPoliciesTable } = require("@longox/db");
    const policyResults = await (db as any)
      .insert(drPoliciesTable)
      .values({
        name: String(name),
        description: description ? String(description) : null,
        primaryRegionId: String(primaryRegionId),
        failoverRegionId: String(failoverRegionId),
        recoveryTier: String(recoveryTier ?? "standard"),
        rpoSeconds: Number(rpoSeconds ?? 300),
        rtoSeconds: Number(rtoSeconds ?? 900),
        autoFailover: Boolean(autoFailover ?? false),
        healthThreshold: Number(healthThreshold ?? 0.3),
      })
      .returning();
    const [policy] = policyResults;

    res.status(201).json(policy);
  },
);

router.get(
  "/replication/dr-policies",
  authorize({ resource: "admin", action: "read" }),
  async (_req, res): Promise<void> => {
    const { drPoliciesTable } = require("@longox/db");
    const policies = await db.select().from(drPoliciesTable);
    res.json(policies);
  },
);

export default router;
