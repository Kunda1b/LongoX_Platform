import { Router, type IRouter, type Request, type Response } from "express";
import { prisma } from "@longox/db/prisma";
import { authorize } from "@longox/shared-rbac";

const router: IRouter = Router();

router.get(
  "/compliance/audit/export",
  authorize({ resource: "audit", action: "admin" }),
  async (req: Request, res: Response): Promise<void> => {
    const {
      format = "json",
      startDate,
      endDate,
    } = req.query as {
      format?: string;
      startDate?: string;
      endDate?: string;
    };

    const where: any = { tenantId: req.tenantId ?? "" };
    if (startDate)
      where.occurredAt = {
        ...(where.occurredAt ?? {}),
        gte: new Date(startDate),
      };
    if (endDate)
      where.occurredAt = {
        ...(where.occurredAt ?? {}),
        lte: new Date(endDate),
      };

    const entries = (await prisma.auditLog.findMany({
      where,
      orderBy: { occurredAt: "desc" },
    })) as any[];

    if (format === "csv") {
      const header =
        "id,actor_type,actor_id,action,resource_type,resource_id,created_at";
      const rows = entries.map(
        (e) =>
          `${e.id},${(e as any).actorType ?? "system"},${e.actorId ?? ""},${e.action},${e.targetType},${e.targetId},${e.occurredAt instanceof Date ? e.occurredAt.toISOString() : new Date(e.occurredAt).toISOString()}`,
      );
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=audit-log.csv",
      );
      res.send([header, ...rows].join("\n"));
      return;
    }

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", "attachment; filename=audit-log.json");
    res.json(entries);
  },
);

router.get(
  "/compliance/audit/stats",
  authorize({ resource: "audit", action: "read" }),
  async (req: Request, res: Response): Promise<void> => {
    const tenantId = req.tenantId ?? "";

    const totalEntries = await prisma.auditLog.count({
      where: { tenantId } as any,
    });

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentEntries = await prisma.auditLog.count({
      where: {
        tenantId,
        occurredAt: { gte: thirtyDaysAgo },
      } as any,
    });

    const uniqueActors = await prisma.auditLog.groupBy({
      by: ["actorId"],
      where: { tenantId } as any,
      _count: { _all: true },
    });

    res.json({
      totalEntries,
      recentEntries,
      uniqueActors: uniqueActors.length,
      retentionDays: 90,
      storageEstimateMb: Math.round(totalEntries * 0.5 * 100) / 100,
    });
  },
);

router.get(
  "/compliance/retention",
  authorize({ resource: "compliance", action: "read" }),
  async (req: Request, res: Response): Promise<void> => {
    const tenantId = req.tenantId ?? "";
    const tenant = (await prisma.tenant.findUnique({
      where: { id: tenantId },
    })) as any;

    const settings = (tenant?.settings ?? {}) as Record<string, unknown>;

    res.json({
      auditLogRetentionDays: (settings.auditLogRetentionDays as number) ?? 90,
      executionRetentionDays: (settings.executionRetentionDays as number) ?? 30,
      notificationRetentionDays:
        (settings.notificationRetentionDays as number) ?? 90,
      autoDeleteAfterDays: (settings.autoDeleteAfterDays as number) ?? 180,
      gdprDataExportEnabled:
        (settings.gdprDataExportEnabled as boolean) ?? true,
      anonymizeAfterDays: (settings.anonymizeAfterDays as number) ?? 365,
    });
  },
);

router.patch(
  "/compliance/retention",
  authorize({ resource: "compliance", action: "write" }),
  async (req: Request, res: Response): Promise<void> => {
    const tenantId = req.tenantId ?? "";
    const {
      auditLogRetentionDays,
      executionRetentionDays,
      notificationRetentionDays,
      autoDeleteAfterDays,
      gdprDataExportEnabled,
      anonymizeAfterDays,
    } = req.body as Record<string, unknown>;

    const tenant = (await prisma.tenant.findUnique({
      where: { id: tenantId },
    })) as any;

    if (!tenant) {
      res.status(404).json({ error: "Tenant not found" });
      return;
    }

    const currentSettings = (tenant.settings ?? {}) as Record<string, unknown>;
    const updatedSettings = {
      ...currentSettings,
      ...(auditLogRetentionDays !== undefined && { auditLogRetentionDays }),
      ...(executionRetentionDays !== undefined && { executionRetentionDays }),
      ...(notificationRetentionDays !== undefined && {
        notificationRetentionDays,
      }),
      ...(autoDeleteAfterDays !== undefined && { autoDeleteAfterDays }),
      ...(gdprDataExportEnabled !== undefined && { gdprDataExportEnabled }),
      ...(anonymizeAfterDays !== undefined && { anonymizeAfterDays }),
    };

    await prisma.tenant.update({
      where: { id: tenantId },
      data: { settings: updatedSettings } as any,
    });

    res.json({ success: true, settings: updatedSettings });
  },
);

router.post(
  "/compliance/gdpr/export",
  authorize({ resource: "compliance", action: "read" }),
  async (req: Request, res: Response): Promise<void> => {
    const tenantId = req.tenantId ?? "";
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const user = (await prisma.user.findUnique({
      where: { id: userId },
    })) as any;

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const auditEntries = (await prisma.auditLog.findMany({
      where: { tenantId, actorId: String(userId) } as any,
      orderBy: { occurredAt: "desc" },
    })) as any[];

    const gdprData = {
      exportedAt: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: (user as any).role,
        isActive: user.status === "active",
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      },
      auditEntries: auditEntries.map((e) => ({
        action: e.action,
        resourceType: e.targetType,
        resourceId: e.targetId,
        createdAt: e.occurredAt,
      })),
      retentionPolicy: {
        auditLogRetentionDays: 90,
        dataAnonymizedAfterDays: 365,
      },
    };

    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=gdpr-data-export.json",
    );
    res.json(gdprData);
  },
);

router.post(
  "/compliance/gdpr/delete-account",
  authorize({ resource: "compliance", action: "admin" }),
  async (req: Request, res: Response): Promise<void> => {
    const { userId, confirm } = req.body as {
      userId?: string;
      confirm?: boolean;
    };

    if (!userId || !confirm) {
      res.status(400).json({ error: "userId and confirm=true are required" });
      return;
    }

    const user = (await prisma.user.findUnique({
      where: { id: userId },
    })) as any;

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        status: "deactivated",
        email: `deleted-${userId}@anonymized.longox.io`,
        name: "Deleted User",
        passwordHash: "ANONYMIZED",
      } as any,
    });

    res.json({ success: true, message: "Account anonymized per GDPR request" });
  },
);

router.post(
  "/api/v1/compliance/gdpr/export",
  authorize({ resource: "compliance", action: "read" }),
  async (req: Request, res: Response): Promise<void> => {
    const tenantId = req.tenantId ?? "";
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const user = (await prisma.user.findUnique({
      where: { id: userId },
    })) as any;

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const gdprRequest = (await prisma.gdprRequest.create({
      data: {
        tenantId,
        userId,
        requestType: "export",
        status: "completed",
        dataScope: { allUserData: true } as any,
        exportFormat: "json",
        completedAt: new Date(),
      },
    })) as any;

    const auditEntries = (await prisma.auditLog.findMany({
      where: { tenantId, actorId: String(userId) } as any,
      orderBy: { occurredAt: "desc" },
    })) as any[];

    const gdprData = {
      exportedAt: new Date().toISOString(),
      exportId: gdprRequest.id,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: (user as any).role,
        isActive: user.status === "active",
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      },
      auditEntries: auditEntries.map((e) => ({
        action: e.action,
        resourceType: e.targetType,
        resourceId: e.targetId,
        createdAt: e.occurredAt,
      })),
      retentionPolicy: {
        auditLogRetentionDays: 90,
        dataAnonymizedAfterDays: 365,
      },
    };

    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=gdpr-data-export.json",
    );
    res.json(gdprData);
  },
);

router.post(
  "/api/v1/compliance/gdpr/delete",
  authorize({ resource: "compliance", action: "admin" }),
  async (req: Request, res: Response): Promise<void> => {
    const { userId, reason } = req.body as { userId?: string; reason?: string };

    if (!userId) {
      res.status(400).json({ error: "userId is required" });
      return;
    }

    const user = (await prisma.user.findUnique({
      where: { id: userId },
    })) as any;

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const deletionRequest = (await prisma.gdprRequest.create({
      data: {
        tenantId: req.tenantId ?? "",
        userId,
        requestType: "deletion",
        status: "completed",
        dataScope: {
          reason: reason ?? "Requested by admin",
          allUserData: true,
        } as any,
        completedAt: new Date(),
      },
    })) as any;

    await prisma.user.update({
      where: { id: userId },
      data: {
        status: "deactivated",
        email: `deleted-${userId}@anonymized.longox.io`,
        name: "Deleted User",
        passwordHash: "ANONYMIZED",
      } as any,
    });

    res.json({
      success: true,
      requestId: deletionRequest.id,
      message: "Account anonymized per GDPR request",
    });
  },
);

export default router;
