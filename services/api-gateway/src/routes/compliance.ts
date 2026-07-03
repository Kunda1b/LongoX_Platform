import { Router, type IRouter, type Request, type Response } from "express";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import { db, auditLogTable, usersTable, tenantsTable, gdprRequestsTable } from "@longox/db";
import { authorize } from "@longox/shared-rbac";

const router: IRouter = Router();

router.get(
  "/compliance/audit/export",
  authorize({ resource: "audit", action: "admin" }),
  async (req: Request, res: Response): Promise<void> => {
    const { format = "json", startDate, endDate } = req.query as {
      format?: string;
      startDate?: string;
      endDate?: string;
    };

    const conditions = [eq(auditLogTable.tenantId, req.tenantId ?? 0)];

    if (startDate) {
      conditions.push(gte(auditLogTable.createdAt, new Date(startDate)));
    }
    if (endDate) {
      conditions.push(lte(auditLogTable.createdAt, new Date(endDate)));
    }

    const entries = await db
      .select()
      .from(auditLogTable)
      .where(and(...conditions))
      .orderBy(desc(auditLogTable.createdAt));

    if (format === "csv") {
      const header = "id,actor_type,actor_id,action,resource_type,resource_id,created_at";
      const rows = entries.map(
        (e) =>
          `${e.id},${e.actorType},${e.actorId ?? ""},${e.action},${e.resourceType},${e.resourceId},${e.createdAt.toISOString()}`,
      );
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=audit-log.csv");
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
    const tenantId = req.tenantId ?? 0;

    const totalEntries = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(auditLogTable)
      .where(eq(auditLogTable.tenantId, tenantId))
      .then((r) => Number(r[0]?.count ?? 0));

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentEntries = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(auditLogTable)
      .where(
        and(
          eq(auditLogTable.tenantId, tenantId),
          gte(auditLogTable.createdAt, thirtyDaysAgo),
        ),
      )
      .then((r) => Number(r[0]?.count ?? 0));

    const uniqueActors = await db
      .select({ count: sql<number>`count(distinct ${auditLogTable.actorId})::int` })
      .from(auditLogTable)
      .where(eq(auditLogTable.tenantId, tenantId))
      .then((r) => Number(r[0]?.count ?? 0));

    res.json({
      totalEntries,
      recentEntries,
      uniqueActors,
      retentionDays: 90,
      storageEstimateMb: Math.round((totalEntries * 0.5) * 100) / 100,
    });
  },
);

router.get(
  "/compliance/retention",
  authorize({ resource: "compliance", action: "read" }),
  async (req: Request, res: Response): Promise<void> => {
    const tenantId = req.tenantId ?? 0;
    const [tenant] = await db
      .select()
      .from(tenantsTable)
      .where(eq(tenantsTable.id, tenantId));

    const settings = (tenant?.settings ?? {}) as Record<string, unknown>;

    res.json({
      auditLogRetentionDays: (settings.auditLogRetentionDays as number) ?? 90,
      executionRetentionDays: (settings.executionRetentionDays as number) ?? 30,
      notificationRetentionDays: (settings.notificationRetentionDays as number) ?? 90,
      autoDeleteAfterDays: (settings.autoDeleteAfterDays as number) ?? 180,
      gdprDataExportEnabled: (settings.gdprDataExportEnabled as boolean) ?? true,
      anonymizeAfterDays: (settings.anonymizeAfterDays as number) ?? 365,
    });
  },
);

router.patch(
  "/compliance/retention",
  authorize({ resource: "compliance", action: "write" }),
  async (req: Request, res: Response): Promise<void> => {
    const tenantId = req.tenantId ?? 0;
    const {
      auditLogRetentionDays,
      executionRetentionDays,
      notificationRetentionDays,
      autoDeleteAfterDays,
      gdprDataExportEnabled,
      anonymizeAfterDays,
    } = req.body as Record<string, unknown>;

    const [tenant] = await db
      .select()
      .from(tenantsTable)
      .where(eq(tenantsTable.id, tenantId));

    if (!tenant) {
      res.status(404).json({ error: "Tenant not found" });
      return;
    }

    const currentSettings = (tenant.settings ?? {}) as Record<string, unknown>;
    const updatedSettings = {
      ...currentSettings,
      ...(auditLogRetentionDays !== undefined && { auditLogRetentionDays }),
      ...(executionRetentionDays !== undefined && { executionRetentionDays }),
      ...(notificationRetentionDays !== undefined && { notificationRetentionDays }),
      ...(autoDeleteAfterDays !== undefined && { autoDeleteAfterDays }),
      ...(gdprDataExportEnabled !== undefined && { gdprDataExportEnabled }),
      ...(anonymizeAfterDays !== undefined && { anonymizeAfterDays }),
    };

    await db
      .update(tenantsTable)
      .set({ settings: updatedSettings })
      .where(eq(tenantsTable.id, tenantId));

    res.json({ success: true, settings: updatedSettings });
  },
);

router.post(
  "/compliance/gdpr/export",
  authorize({ resource: "compliance", action: "read" }),
  async (req: Request, res: Response): Promise<void> => {
    const tenantId = req.tenantId ?? 0;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId));

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const auditEntries = await db
      .select()
      .from(auditLogTable)
      .where(
        and(
          eq(auditLogTable.tenantId, tenantId),
          eq(auditLogTable.actorId, String(userId)),
        ),
      )
      .orderBy(desc(auditLogTable.createdAt));

    const gdprData = {
      exportedAt: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      },
      auditEntries: auditEntries.map((e) => ({
        action: e.action,
        resourceType: e.resourceType,
        resourceId: e.resourceId,
        createdAt: e.createdAt,
      })),
      retentionPolicy: {
        auditLogRetentionDays: 90,
        dataAnonymizedAfterDays: 365,
      },
    };

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", "attachment; filename=gdpr-data-export.json");
    res.json(gdprData);
  },
);

router.post(
  "/compliance/gdpr/delete-account",
  authorize({ resource: "compliance", action: "admin" }),
  async (req: Request, res: Response): Promise<void> => {
    const { userId, confirm } = req.body as { userId?: number; confirm?: boolean };

    if (!userId || !confirm) {
      res.status(400).json({ error: "userId and confirm=true are required" });
      return;
    }

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId));

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    await db
      .update(usersTable)
      .set({
        isActive: false,
        email: `deleted-${userId}@anonymized.longox.io`,
        name: "Deleted User",
        passwordHash: "ANONYMIZED",
      })
      .where(eq(usersTable.id, userId));

    res.json({ success: true, message: "Account anonymized per GDPR request" });
  },
);

router.post(
  "/api/v1/compliance/gdpr/export",
  authorize({ resource: "compliance", action: "read" }),
  async (req: Request, res: Response): Promise<void> => {
    const tenantId = req.tenantId ?? 0;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId));

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const [gdprRequest] = await db
      .insert(gdprRequestsTable)
      .values({
        tenantId,
        userId,
        requestType: "export",
        status: "completed",
        dataScope: { allUserData: true },
        exportFormat: "json",
        completedAt: new Date(),
      })
      .returning();

    const auditEntries = await db
      .select()
      .from(auditLogTable)
      .where(
        and(
          eq(auditLogTable.tenantId, tenantId),
          eq(auditLogTable.actorId, String(userId)),
        ),
      )
      .orderBy(desc(auditLogTable.createdAt));

    const gdprData = {
      exportedAt: new Date().toISOString(),
      exportId: gdprRequest.id,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      },
      auditEntries: auditEntries.map((e) => ({
        action: e.action,
        resourceType: e.resourceType,
        resourceId: e.resourceId,
        createdAt: e.createdAt,
      })),
      retentionPolicy: {
        auditLogRetentionDays: 90,
        dataAnonymizedAfterDays: 365,
      },
    };

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", "attachment; filename=gdpr-data-export.json");
    res.json(gdprData);
  },
);

router.post(
  "/api/v1/compliance/gdpr/delete",
  authorize({ resource: "compliance", action: "admin" }),
  async (req: Request, res: Response): Promise<void> => {
    const { userId, reason } = req.body as { userId?: number; reason?: string };

    if (!userId) {
      res.status(400).json({ error: "userId is required" });
      return;
    }

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId));

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const [deletionRequest] = await db
      .insert(gdprRequestsTable)
      .values({
        tenantId: req.tenantId ?? 0,
        userId,
        requestType: "deletion",
        status: "completed",
        dataScope: { reason: reason ?? "Requested by admin", allUserData: true },
        completedAt: new Date(),
      })
      .returning();

    await db
      .update(usersTable)
      .set({
        isActive: false,
        email: `deleted-${userId}@anonymized.longox.io`,
        name: "Deleted User",
        passwordHash: "ANONYMIZED",
      })
      .where(eq(usersTable.id, userId));

    res.json({ success: true, requestId: deletionRequest.id, message: "Account anonymized per GDPR request" });
  },
);

export default router;
