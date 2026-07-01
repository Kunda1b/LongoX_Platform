import { Router, type IRouter, type Request, type Response } from "express";
import { eq, desc } from "drizzle-orm";
import { db, tenantTiersTable, tenantTierAssignmentsTable, tenantPlacementTable, tenantSettingsTable } from "@longox/db";
import { authorize } from "@longox/shared-rbac";
import { z } from "zod";
import { tenantPlacementService } from "../services/tenant-placement.service";
import { tenantMigrationService } from "../services/tenant-migration.service";

const router: IRouter = Router();

const createTierSchema = z.object({
  name: z.enum(["free", "pro", "enterprise", "enterprise-plus"]),
  infrastructureLevel: z.enum(["shared", "dedicated-namespace", "dedicated-cluster"]),
  maxWorkflows: z.number().int(),
  maxConnectors: z.number().int(),
  maxEnvironments: z.number().int(),
  maxMembers: z.number().int(),
  maxStorageGb: z.number().int(),
  maxAiTokensMonthly: z.number().int(),
  maxRagQueriesMonthly: z.number().int(),
  includeAuditLogging: z.boolean().optional(),
  includeSso: z.boolean().optional(),
  includeSla: z.string().optional(),
  hotRetentionDays: z.number().int(),
  coldRetentionDays: z.number().int(),
  regionsAllowed: z.array(z.string()).optional(),
  supportLevel: z.enum(["community", "standard", "priority", "dedicated"]).optional(),
  monthlyPriceCents: z.number().int().optional(),
  sortOrder: z.number().int().optional(),
});

const updateTierSchema = createTierSchema.partial();

const changeTierSchema = z.object({
  tierId: z.number().int(),
  reason: z.string().optional(),
});

router.get(
  "/tenants/tiers",
  authorize({ resource: "tenants", action: "admin" }),
  async (_req: Request, res: Response): Promise<void> => {
    const rows = await db
      .select()
      .from(tenantTiersTable)
      .where(eq(tenantTiersTable.isActive, true))
      .orderBy(tenantTiersTable.sortOrder);
    res.json(
      rows.map((t) => ({
        id: t.id,
        name: t.name,
        infrastructureLevel: t.infrastructureLevel,
        maxWorkflows: t.maxWorkflows,
        maxConnectors: t.maxConnectors,
        maxEnvironments: t.maxEnvironments,
        maxMembers: t.maxMembers,
        maxStorageGb: t.maxStorageGb,
        maxAiTokensMonthly: t.maxAiTokensMonthly,
        maxRagQueriesMonthly: t.maxRagQueriesMonthly,
        includeAuditLogging: t.includeAuditLogging,
        includeSso: t.includeSso,
        includeSla: t.includeSla,
        hotRetentionDays: t.hotRetentionDays,
        coldRetentionDays: t.coldRetentionDays,
        regionsAllowed: t.regionsAllowed,
        supportLevel: t.supportLevel,
        monthlyPriceCents: t.monthlyPriceCents,
        sortOrder: t.sortOrder,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      })),
    );
  },
);

router.get(
  "/tenants/tiers/:id",
  authorize({ resource: "tenants", action: "admin" }),
  async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id);
    const [tier] = await db
      .select()
      .from(tenantTiersTable)
      .where(eq(tenantTiersTable.id, id))
      .limit(1);
    if (!tier) {
      res.status(404).json({ error: "Tier not found" });
      return;
    }
    res.json({
      id: tier.id,
      name: tier.name,
      infrastructureLevel: tier.infrastructureLevel,
      maxWorkflows: tier.maxWorkflows,
      maxConnectors: tier.maxConnectors,
      maxEnvironments: tier.maxEnvironments,
      maxMembers: tier.maxMembers,
      maxStorageGb: tier.maxStorageGb,
      maxAiTokensMonthly: tier.maxAiTokensMonthly,
      maxRagQueriesMonthly: tier.maxRagQueriesMonthly,
      includeAuditLogging: tier.includeAuditLogging,
      includeSso: tier.includeSso,
      includeSla: tier.includeSla,
      hotRetentionDays: tier.hotRetentionDays,
      coldRetentionDays: tier.coldRetentionDays,
      regionsAllowed: tier.regionsAllowed,
      supportLevel: tier.supportLevel,
      monthlyPriceCents: tier.monthlyPriceCents,
      sortOrder: tier.sortOrder,
      createdAt: tier.createdAt.toISOString(),
      updatedAt: tier.updatedAt.toISOString(),
    });
  },
);

router.post(
  "/tenants/tiers",
  authorize({ resource: "tenants", action: "admin" }),
  async (req: Request, res: Response): Promise<void> => {
    const parsed = createTierSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const [tier] = await db
      .insert(tenantTiersTable)
      .values(parsed.data)
      .returning();
    res.status(201).json({
      id: tier.id,
      name: tier.name,
      infrastructureLevel: tier.infrastructureLevel,
      maxWorkflows: tier.maxWorkflows,
      maxConnectors: tier.maxConnectors,
      maxEnvironments: tier.maxEnvironments,
      maxMembers: tier.maxMembers,
      maxStorageGb: tier.maxStorageGb,
      maxAiTokensMonthly: tier.maxAiTokensMonthly,
      maxRagQueriesMonthly: tier.maxRagQueriesMonthly,
      includeAuditLogging: tier.includeAuditLogging,
      includeSso: tier.includeSso,
      includeSla: tier.includeSla,
      hotRetentionDays: tier.hotRetentionDays,
      coldRetentionDays: tier.coldRetentionDays,
      regionsAllowed: tier.regionsAllowed,
      supportLevel: tier.supportLevel,
      monthlyPriceCents: tier.monthlyPriceCents,
      sortOrder: tier.sortOrder,
      createdAt: tier.createdAt.toISOString(),
      updatedAt: tier.updatedAt.toISOString(),
    });
  },
);

router.put(
  "/tenants/tiers/:id",
  authorize({ resource: "tenants", action: "admin" }),
  async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id);
    const parsed = updateTierSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const [tier] = await db
      .update(tenantTiersTable)
      .set(parsed.data)
      .where(eq(tenantTiersTable.id, id))
      .returning();
    if (!tier) {
      res.status(404).json({ error: "Tier not found" });
      return;
    }
    res.json({
      id: tier.id,
      name: tier.name,
      infrastructureLevel: tier.infrastructureLevel,
      maxWorkflows: tier.maxWorkflows,
      maxConnectors: tier.maxConnectors,
      maxEnvironments: tier.maxEnvironments,
      maxMembers: tier.maxMembers,
      maxStorageGb: tier.maxStorageGb,
      maxAiTokensMonthly: tier.maxAiTokensMonthly,
      maxRagQueriesMonthly: tier.maxRagQueriesMonthly,
      includeAuditLogging: tier.includeAuditLogging,
      includeSso: tier.includeSso,
      includeSla: tier.includeSla,
      hotRetentionDays: tier.hotRetentionDays,
      coldRetentionDays: tier.coldRetentionDays,
      regionsAllowed: tier.regionsAllowed,
      supportLevel: tier.supportLevel,
      monthlyPriceCents: tier.monthlyPriceCents,
      sortOrder: tier.sortOrder,
      createdAt: tier.createdAt.toISOString(),
      updatedAt: tier.updatedAt.toISOString(),
    });
  },
);

router.get(
  "/tenants/current/tier",
  authorize({ resource: "tenants", action: "read" }),
  async (req: Request, res: Response): Promise<void> => {
    const tenantId = req.tenantId ?? req.user?.tenantId;
    if (!tenantId) {
      res.status(400).json({ error: "Tenant context required" });
      return;
    }

    const [assignment] = await db
      .select()
      .from(tenantTierAssignmentsTable)
      .where(eq(tenantTierAssignmentsTable.tenantId, tenantId))
      .limit(1);

    if (!assignment) {
      res.json({ tier: null, assignment: null });
      return;
    }

    const [tier] = await db
      .select()
      .from(tenantTiersTable)
      .where(eq(tenantTiersTable.id, assignment.tierId))
      .limit(1);

    res.json({
      tier: tier
        ? {
            id: tier.id,
            name: tier.name,
            infrastructureLevel: tier.infrastructureLevel,
            maxWorkflows: tier.maxWorkflows,
            maxConnectors: tier.maxConnectors,
            maxEnvironments: tier.maxEnvironments,
            maxMembers: tier.maxMembers,
            maxStorageGb: tier.maxStorageGb,
            maxAiTokensMonthly: tier.maxAiTokensMonthly,
            maxRagQueriesMonthly: tier.maxRagQueriesMonthly,
            includeAuditLogging: tier.includeAuditLogging,
            includeSso: tier.includeSso,
            includeSla: tier.includeSla,
            hotRetentionDays: tier.hotRetentionDays,
            coldRetentionDays: tier.coldRetentionDays,
            regionsAllowed: tier.regionsAllowed,
            supportLevel: tier.supportLevel,
            monthlyPriceCents: tier.monthlyPriceCents,
            sortOrder: tier.sortOrder,
            createdAt: tier.createdAt.toISOString(),
            updatedAt: tier.updatedAt.toISOString(),
          }
        : null,
      assignment: {
        id: assignment.id,
        tenantId: assignment.tenantId,
        tierId: assignment.tierId,
        assignedAt: assignment.assignedAt.toISOString(),
        expiresAt: assignment.expiresAt?.toISOString() ?? null,
        assignedBy: assignment.assignedBy,
        changeReason: assignment.changeReason,
        infrastructureLevel: assignment.infrastructureLevel,
        dedicatedNamespace: assignment.dedicatedNamespace,
        dedicatedClusterId: assignment.dedicatedClusterId,
      },
    });
  },
);

router.put(
  "/tenants/current/tier",
  authorize({ resource: "tenants", action: "admin" }),
  async (req: Request, res: Response): Promise<void> => {
    const tenantId = req.tenantId ?? req.user?.tenantId;
    if (!tenantId) {
      res.status(400).json({ error: "Tenant context required" });
      return;
    }

    const parsed = changeTierSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    const { tierId, reason } = parsed.data;

    const [targetTier] = await db
      .select()
      .from(tenantTiersTable)
      .where(eq(tenantTiersTable.id, tierId))
      .limit(1);

    if (!targetTier) {
      res.status(404).json({ error: "Target tier not found" });
      return;
    }

    const [existingAssignment] = await db
      .select()
      .from(tenantTierAssignmentsTable)
      .where(eq(tenantTierAssignmentsTable.tenantId, tenantId))
      .limit(1);

    const [settings] = await db
      .select()
      .from(tenantSettingsTable)
      .where(eq(tenantSettingsTable.tenantId, tenantId))
      .limit(1);

    if (existingAssignment) {
      await db
        .update(tenantTierAssignmentsTable)
        .set({
          tierId,
          infrastructureLevel: targetTier.infrastructureLevel,
          assignedAt: new Date(),
          assignedBy: req.user?.email ?? "system",
          changeReason: reason ?? null,
          updatedAt: new Date(),
        })
        .where(eq(tenantTierAssignmentsTable.tenantId, tenantId));
    } else {
      await db.insert(tenantTierAssignmentsTable).values({
        tenantId,
        tierId,
        infrastructureLevel: targetTier.infrastructureLevel,
        assignedBy: req.user?.email ?? "system",
        changeReason: reason ?? null,
      });
    }

    if (settings) {
      await db
        .update(tenantSettingsTable)
        .set({
          tierId,
          infrastructureLevel: targetTier.infrastructureLevel,
          updatedAt: new Date(),
        })
        .where(eq(tenantSettingsTable.tenantId, tenantId));
    } else {
      await db.insert(tenantSettingsTable).values({
        tenantId,
        tierId,
        infrastructureLevel: targetTier.infrastructureLevel,
      });
    }

    const placement = await tenantPlacementService.determinePlacement(tenantId, tierId);

    res.json({
      message: "Tier changed successfully",
      tierId,
      infrastructureLevel: targetTier.infrastructureLevel,
      placement,
    });
  },
);

router.get(
  "/tenants/current/placement",
  authorize({ resource: "tenants", action: "read" }),
  async (req: Request, res: Response): Promise<void> => {
    const tenantId = req.tenantId ?? req.user?.tenantId;
    if (!tenantId) {
      res.status(400).json({ error: "Tenant context required" });
      return;
    }

    const placement = await tenantPlacementService.getPlacement(tenantId);
    if (!placement) {
      res.status(404).json({ error: "No placement found for tenant" });
      return;
    }

    res.json(placement);
  },
);

router.get(
  "/tenants/current/migrations",
  authorize({ resource: "tenants", action: "read" }),
  async (req: Request, res: Response): Promise<void> => {
    const tenantId = req.tenantId ?? req.user?.tenantId;
    if (!tenantId) {
      res.status(400).json({ error: "Tenant context required" });
      return;
    }

    const history = await tenantMigrationService.getMigrationHistory(tenantId);
    res.json(history);
  },
);

router.post(
  "/tenants/current/plan-migration",
  authorize({ resource: "tenants", action: "admin" }),
  async (req: Request, res: Response): Promise<void> => {
    const tenantId = req.tenantId ?? req.user?.tenantId;
    if (!tenantId) {
      res.status(400).json({ error: "Tenant context required" });
      return;
    }

    const { targetTierId } = req.body as { targetTierId?: number };
    if (!targetTierId) {
      res.status(400).json({ error: "targetTierId is required" });
      return;
    }

    try {
      const plan = await tenantMigrationService.planMigration(tenantId, targetTierId);

      const [migration] = await db
        .insert(tenantMigrationsTable)
        .values({
          tenantId,
          fromTierId: plan.plan.fromTierId,
          toTierId: plan.plan.toTierId,
          fromPlacement: plan.plan.fromPlacement,
          toPlacement: plan.plan.toPlacement,
          fromCluster: plan.plan.fromCluster,
          toCluster: plan.plan.toCluster,
          status: "planned",
          steps: plan.steps as unknown as Record<string, unknown>[],
        })
        .returning();

      res.status(201).json({
        planId: migration.id,
        plan,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Planning failed";
      res.status(400).json({ error: message });
    }
  },
);

router.post(
  "/tenants/current/migrations/:id/execute",
  authorize({ resource: "tenants", action: "admin" }),
  async (req: Request, res: Response): Promise<void> => {
    const tenantId = req.tenantId ?? req.user?.tenantId;
    if (!tenantId) {
      res.status(400).json({ error: "Tenant context required" });
      return;
    }

    const planId = Number(req.params.id);

    try {
      const result = await tenantMigrationService.executeMigration(tenantId, planId);
      res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Migration failed";
      res.status(400).json({ error: message });
    }
  },
);

router.post(
  "/tenants/current/migrations/:id/rollback",
  authorize({ resource: "tenants", action: "admin" }),
  async (req: Request, res: Response): Promise<void> => {
    const tenantId = req.tenantId ?? req.user?.tenantId;
    if (!tenantId) {
      res.status(400).json({ error: "Tenant context required" });
      return;
    }

    const migrationId = Number(req.params.id);

    try {
      const result = await tenantMigrationService.rollbackMigration(tenantId, migrationId);
      res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Rollback failed";
      res.status(400).json({ error: message });
    }
  },
);

router.post(
  "/tenants/current/migrations/status",
  authorize({ resource: "tenants", action: "read" }),
  async (req: Request, res: Response): Promise<void> => {
    const tenantId = req.tenantId ?? req.user?.tenantId;
    if (!tenantId) {
      res.status(400).json({ error: "Tenant context required" });
      return;
    }

    const status = await tenantMigrationService.getMigrationStatus(tenantId);
    if (!status) {
      res.json({ status: null });
      return;
    }
    res.json(status);
  },
);

export default router;
