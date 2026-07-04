import { Router, type IRouter, type Request, type Response } from "express";
import { prisma } from "@longox/db/prisma";
import { authorize } from "@longox/shared-rbac";
import { tenantPlacementService } from "../services/tenant-placement.service";
import { tenantMigrationService } from "../services/tenant-migration.service";

const router: IRouter = Router();

router.get(
  "/tenants/tiers",
  authorize({ resource: "tenants", action: "admin" }),
  async (_req: Request, res: Response): Promise<void> => {
    const rows = (await prisma.tenantTier.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    })) as any[];
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
        maxAiTokensMonthly: t.maxAiTokensMonthly?.toString() ?? "0",
        maxRagQueriesMonthly: t.maxRagQueriesMonthly?.toString() ?? "0",
        includeAuditLogging: t.includeAuditLogging,
        includeSso: t.includeSso,
        includeSla: t.includeSla,
        hotRetentionDays: t.hotRetentionDays,
        coldRetentionDays: t.coldRetentionDays,
        regionsAllowed: t.regionsAllowed,
        supportLevel: t.supportLevel,
        monthlyPriceCents: t.monthlyPriceCents,
        sortOrder: t.sortOrder,
        createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : new Date(t.createdAt).toISOString(),
        updatedAt: t.updatedAt instanceof Date ? t.updatedAt.toISOString() : new Date(t.updatedAt).toISOString(),
      })),
    );
  },
);

router.get(
  "/tenants/tiers/:id",
  authorize({ resource: "tenants", action: "admin" }),
  async (req: Request, res: Response): Promise<void> => {
    const id = String(req.params.id);
    const tier = (await prisma.tenantTier.findUnique({ where: { id } })) as any;
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
      maxAiTokensMonthly: tier.maxAiTokensMonthly?.toString() ?? "0",
      maxRagQueriesMonthly: tier.maxRagQueriesMonthly?.toString() ?? "0",
      includeAuditLogging: tier.includeAuditLogging,
      includeSso: tier.includeSso,
      includeSla: tier.includeSla,
      hotRetentionDays: tier.hotRetentionDays,
      coldRetentionDays: tier.coldRetentionDays,
      regionsAllowed: tier.regionsAllowed,
      supportLevel: tier.supportLevel,
      monthlyPriceCents: tier.monthlyPriceCents,
      sortOrder: tier.sortOrder,
      createdAt: tier.createdAt instanceof Date ? tier.createdAt.toISOString() : new Date(tier.createdAt).toISOString(),
      updatedAt: tier.updatedAt instanceof Date ? tier.updatedAt.toISOString() : new Date(tier.updatedAt).toISOString(),
    });
  },
);

router.post(
  "/tenants/tiers",
  authorize({ resource: "tenants", action: "admin" }),
  async (req: Request, res: Response): Promise<void> => {
    // Request validation defined in lib/api-spec/openapi.yaml — single source of truth
    const body = req.body as Record<string, unknown>;
    const tier = (await prisma.tenantTier.create({
      data: body as any,
    })) as any;
    res.status(201).json({
      id: tier.id,
      name: tier.name,
      infrastructureLevel: tier.infrastructureLevel,
      maxWorkflows: tier.maxWorkflows,
      maxConnectors: tier.maxConnectors,
      maxEnvironments: tier.maxEnvironments,
      maxMembers: tier.maxMembers,
      maxStorageGb: tier.maxStorageGb,
      maxAiTokensMonthly: tier.maxAiTokensMonthly?.toString() ?? "0",
      maxRagQueriesMonthly: tier.maxRagQueriesMonthly?.toString() ?? "0",
      includeAuditLogging: tier.includeAuditLogging,
      includeSso: tier.includeSso,
      includeSla: tier.includeSla,
      hotRetentionDays: tier.hotRetentionDays,
      coldRetentionDays: tier.coldRetentionDays,
      regionsAllowed: tier.regionsAllowed,
      supportLevel: tier.supportLevel,
      monthlyPriceCents: tier.monthlyPriceCents,
      sortOrder: tier.sortOrder,
      createdAt: tier.createdAt instanceof Date ? tier.createdAt.toISOString() : new Date(tier.createdAt).toISOString(),
      updatedAt: tier.updatedAt instanceof Date ? tier.updatedAt.toISOString() : new Date(tier.updatedAt).toISOString(),
    });
  },
);

router.put(
  "/tenants/tiers/:id",
  authorize({ resource: "tenants", action: "admin" }),
  async (req: Request, res: Response): Promise<void> => {
    const id = String(req.params.id);
    const body = req.body as Record<string, unknown>;
    const tier = (await prisma.tenantTier.update({
      where: { id },
      data: body as any,
    })) as any;
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
      maxAiTokensMonthly: tier.maxAiTokensMonthly?.toString() ?? "0",
      maxRagQueriesMonthly: tier.maxRagQueriesMonthly?.toString() ?? "0",
      includeAuditLogging: tier.includeAuditLogging,
      includeSso: tier.includeSso,
      includeSla: tier.includeSla,
      hotRetentionDays: tier.hotRetentionDays,
      coldRetentionDays: tier.coldRetentionDays,
      regionsAllowed: tier.regionsAllowed,
      supportLevel: tier.supportLevel,
      monthlyPriceCents: tier.monthlyPriceCents,
      sortOrder: tier.sortOrder,
      createdAt: tier.createdAt instanceof Date ? tier.createdAt.toISOString() : new Date(tier.createdAt).toISOString(),
      updatedAt: tier.updatedAt instanceof Date ? tier.updatedAt.toISOString() : new Date(tier.updatedAt).toISOString(),
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

    const assignment = (await prisma.tenantTierAssignment.findUnique({
      where: { tenantId },
    })) as any;

    if (!assignment) {
      res.json({ tier: null, assignment: null });
      return;
    }

    const tier = (await prisma.tenantTier.findUnique({
      where: { id: assignment.tierId },
    })) as any;

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
            maxAiTokensMonthly: tier.maxAiTokensMonthly?.toString() ?? "0",
            maxRagQueriesMonthly: tier.maxRagQueriesMonthly?.toString() ?? "0",
            includeAuditLogging: tier.includeAuditLogging,
            includeSso: tier.includeSso,
            includeSla: tier.includeSla,
            hotRetentionDays: tier.hotRetentionDays,
            coldRetentionDays: tier.coldRetentionDays,
            regionsAllowed: tier.regionsAllowed,
            supportLevel: tier.supportLevel,
            monthlyPriceCents: tier.monthlyPriceCents,
            sortOrder: tier.sortOrder,
            createdAt: tier.createdAt instanceof Date ? tier.createdAt.toISOString() : new Date(tier.createdAt).toISOString(),
            updatedAt: tier.updatedAt instanceof Date ? tier.updatedAt.toISOString() : new Date(tier.updatedAt).toISOString(),
          }
        : null,
      assignment: {
        id: assignment.id,
        tenantId: assignment.tenantId,
        tierId: assignment.tierId,
        assignedAt: assignment.assignedAt instanceof Date ? assignment.assignedAt.toISOString() : new Date(assignment.assignedAt).toISOString(),
        expiresAt: assignment.expiresAt
          ? (assignment.expiresAt instanceof Date ? assignment.expiresAt.toISOString() : new Date(assignment.expiresAt).toISOString())
          : null,
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

    const { tierId, reason } = req.body as { tierId?: string; reason?: string };

    const targetTier = (await prisma.tenantTier.findUnique({
      where: { id: tierId ?? "" },
    })) as any;

    if (!targetTier) {
      res.status(404).json({ error: "Target tier not found" });
      return;
    }

    const existingAssignment = (await prisma.tenantTierAssignment.findUnique({
      where: { tenantId },
    })) as any;

    const settings = (await prisma.tenantSettings.findUnique({
      where: { tenantId },
    })) as any;

    if (existingAssignment) {
      await prisma.tenantTierAssignment.update({
        where: { tenantId },
        data: {
          tierId: tierId ?? "",
          infrastructureLevel: targetTier.infrastructureLevel,
          assignedAt: new Date(),
          assignedBy: req.user?.email ?? "system",
          changeReason: reason ?? null,
          updatedAt: new Date(),
        } as any,
      });
    } else {
      await prisma.tenantTierAssignment.create({
        data: {
          tenantId,
          tierId: tierId ?? "",
          infrastructureLevel: targetTier.infrastructureLevel,
          assignedBy: req.user?.email ?? "system",
          changeReason: reason ?? null,
        } as any,
      });
    }

    if (settings) {
      await prisma.tenantSettings.update({
        where: { tenantId },
        data: {
          tierId,
          infrastructureLevel: targetTier.infrastructureLevel,
          updatedAt: new Date(),
        } as any,
      });
    } else {
      await prisma.tenantSettings.create({
        data: {
          tenantId,
          tierId,
          infrastructureLevel: targetTier.infrastructureLevel,
        } as any,
      });
    }

    const placement = await tenantPlacementService.determinePlacement(
      tenantId,
      tierId ?? "",
    );

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

    const { targetTierId } = req.body as { targetTierId?: string };
    if (!targetTierId) {
      res.status(400).json({ error: "targetTierId is required" });
      return;
    }

    try {
      const plan = await tenantMigrationService.planMigration(
        tenantId,
        targetTierId,
      );

      const migration = (await prisma.tenantMigration.create({
        data: {
          tenantId,
          fromTierId: plan.plan.fromTierId,
          toTierId: plan.plan.toTierId,
          fromPlacement: plan.plan.fromPlacement,
          toPlacement: plan.plan.toPlacement,
          fromCluster: plan.plan.fromCluster,
          toCluster: plan.plan.toCluster,
          status: "planned",
          steps: plan.steps as any,
        } as any,
      })) as any;

      res.status(201).json({
        planId: migration.id,
        plan,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Planning failed";
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

    const planId = String(req.params.id);

    try {
      const result = await tenantMigrationService.executeMigration(
        tenantId,
        planId,
      );
      res.json(result);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Migration failed";
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

    const migrationId = String(req.params.id);

    try {
      const result = await tenantMigrationService.rollbackMigration(
        tenantId,
        migrationId,
      );
      res.json(result);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Rollback failed";
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
