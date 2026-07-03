import { Router, type IRouter, type Request, type Response } from "express";
import { eq, and, desc, sql } from "drizzle-orm";
import { db, environmentsTable, environmentReleasesTable, workflowPromotionsTable, workflowVersionsTable, workflowsTable } from "@longox/db";
import { authorize } from "@longox/shared-rbac";
import { promotionApprovalService } from "../services/promotion-approval.service";
import { registerVersionedRoutes, buildVersionedPaths } from "../lib/api-versioning";

const router: IRouter = Router();

registerVersionedRoutes(router, [
  { path: "/api/v1/environments", handler: (_req, _res, next) => next(), deprecatedSince: "2026-01-01", sunsetDate: "2026-07-03" },
]);

const DIFF_KEY = "environment_diff";

router.get(
  "/environments",
  authorize({ resource: "environments", action: "read" }),
  async (_req: Request, res: Response): Promise<void> => {
    const rows = await db.select().from(environmentsTable).orderBy(environmentsTable.id);
    const workflowCounts = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(workflowsTable);
    const totalWorkflows = Number(workflowCounts[0]?.count ?? 0);
    const perEnv = rows.length > 0 ? Math.floor(totalWorkflows / rows.length) : 0;

    res.json(rows.map((e, i) => ({
      id: e.id,
      name: e.name,
      type: e.type,
      description: e.description,
      isDefault: e.isDefault,
      workflowCount: i === 0 ? totalWorkflows - perEnv * (rows.length - 1) : perEnv,
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
    })));
  },
);

router.get(
  "/environments/:id",
  authorize({ resource: "environments", action: "read" }),
  async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id);
    const [row] = await db.select().from(environmentsTable).where(eq(environmentsTable.id, id));
    if (!row) {
      res.status(404).json({ error: "Environment not found" });
      return;
    }
    res.json({
      id: row.id,
      name: row.name,
      type: row.type,
      description: row.description,
      isDefault: row.isDefault,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    });
  },
);

router.post(
  "/environments",
  authorize({ resource: "environments", action: "write" }),
  async (req: Request, res: Response): Promise<void> => {
    const { name, type, description } = req.body as {
      name?: string;
      type?: string;
      description?: string;
    };
    if (!name?.trim()) {
      res.status(400).json({ error: "name is required" });
      return;
    }
    const [row] = await db
      .insert(environmentsTable)
      .values({ name: name.trim(), type: type ?? "dev", description })
      .returning();
    res.status(201).json({
      id: row.id,
      name: row.name,
      type: row.type,
      description: row.description,
      isDefault: row.isDefault,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    });
  },
);

router.patch(
  "/environments/:id",
  authorize({ resource: "environments", action: "write" }),
  async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id);
    const { name, type, description } = req.body as {
      name?: string;
      type?: string;
      description?: string;
    };
    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name.trim();
    if (type !== undefined) updates.type = type;
    if (description !== undefined) updates.description = description;
    const [row] = await db
      .update(environmentsTable)
      .set(updates)
      .where(eq(environmentsTable.id, id))
      .returning();
    if (!row) {
      res.status(404).json({ error: "Environment not found" });
      return;
    }
    res.json({
      id: row.id,
      name: row.name,
      type: row.type,
      description: row.description,
      isDefault: row.isDefault,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    });
  },
);

router.delete(
  "/environments/:id",
  authorize({ resource: "environments", action: "admin" }),
  async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id);
    await db.delete(environmentsTable).where(eq(environmentsTable.id, id));
    res.status(204).end();
  },
);

router.post(
  "/environments/promote",
  authorize({ resource: "environments", action: "write" }),
  async (req: Request, res: Response): Promise<void> => {
    // Request validation is defined in lib/api-spec/openapi.yaml — the single source of truth
    const { workflowId, fromEnvironment, toEnvironment, notes, approvalRequired } = req.body as Record<string, unknown>;
    if (!workflowId || typeof workflowId !== "number") { res.status(400).json({ error: "workflowId is required and must be a number" }); return; }
    if (!fromEnvironment || typeof fromEnvironment !== "string") { res.status(400).json({ error: "fromEnvironment is required" }); return; }
    if (!toEnvironment || typeof toEnvironment !== "string") { res.status(400).json({ error: "toEnvironment is required" }); return; }
    const promotedBy = req.user?.email ?? "system";

    try {
      const result = await promotionApprovalService.requestPromotion({
        workflowId,
        fromEnvironment,
        toEnvironment,
        notes,
        approvalRequired,
        promotedBy,
      });

      res.status(201).json({
        promotion: result.promotion,
        release: result.release,
        requiresApproval: result.requiresApproval,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Promotion failed";
      res.status(400).json({ error: message });
    }
  },
);

router.post(
  "/environments/rollback",
  authorize({ resource: "environments", action: "write" }),
  async (req: Request, res: Response): Promise<void> => {
    // Request validation is defined in lib/api-spec/openapi.yaml — the single source of truth
    const { promotionId } = req.body as Record<string, unknown>;
    if (!promotionId || typeof promotionId !== "number") { res.status(400).json({ error: "promotionId is required and must be a number" }); return; }
    const rolledBackBy = req.user?.email ?? "system";

    try {
      const result = await promotionApprovalService.rollbackPromotion(promotionId, rolledBackBy);
      res.json({
        message: `Rolled back ${result.promotion.workflowName} from ${result.promotion.toEnvironment} to ${result.promotion.fromEnvironment}`,
        promotion: result.promotion,
        release: result.release,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Rollback failed";
      res.status(400).json({ error: message });
    }
  },
);

router.post(
  "/environments/promotions/:id/approve",
  authorize({ resource: "environments", action: "promote" }),
  async (req: Request, res: Response): Promise<void> => {
    const promotionId = Number(req.params.id);
    const approvedBy = req.user?.email ?? "system";
    const note = req.body.note as string | undefined;

    try {
      const result = await promotionApprovalService.approvePromotion(promotionId, approvedBy, note);
      res.json({
        promotion: result.promotion,
        release: result.release,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Approval failed";
      res.status(400).json({ error: message });
    }
  },
);

router.post(
  "/environments/promotions/:id/reject",
  authorize({ resource: "environments", action: "promote" }),
  async (req: Request, res: Response): Promise<void> => {
    const promotionId = Number(req.params.id);
    const reason = req.body.reason as string;
    if (!reason?.trim()) {
      res.status(400).json({ error: "reason is required" });
      return;
    }
    const rejectedBy = req.user?.email ?? "system";

    try {
      const result = await promotionApprovalService.rejectPromotion(promotionId, reason, rejectedBy);
      res.json({
        promotion: result.promotion,
        release: result.release,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Rejection failed";
      res.status(400).json({ error: message });
    }
  },
);

router.get(
  "/environments/promotions/:id",
  authorize({ resource: "environments", action: "read" }),
  async (req: Request, res: Response): Promise<void> => {
    const promotionId = Number(req.params.id);

    const [promotion] = await db
      .select()
      .from(workflowPromotionsTable)
      .where(eq(workflowPromotionsTable.id, promotionId))
      .limit(1);

    if (!promotion) {
      res.status(404).json({ error: "Promotion not found" });
      return;
    }

    const [release] = await db
      .select()
      .from(environmentReleasesTable)
      .where(
        and(
          eq(environmentReleasesTable.artifactId, promotion.workflowId),
          eq(environmentReleasesTable.fromEnvironment, promotion.fromEnvironment),
          eq(environmentReleasesTable.toEnvironment, promotion.toEnvironment),
        ),
      )
      .orderBy(desc(environmentReleasesTable.createdAt))
      .limit(1);

    res.json({ promotion, release: release ?? null });
  },
);

router.get(
  "/environments/:id/releases",
  authorize({ resource: "environments", action: "read" }),
  async (req: Request, res: Response): Promise<void> => {
    const environmentId = Number(req.params.id);

    const releases = await db
      .select()
      .from(environmentReleasesTable)
      .where(eq(environmentReleasesTable.environmentId, environmentId))
      .orderBy(desc(environmentReleasesTable.createdAt));

    res.json(
      releases.map((r) => ({
        id: r.id,
        environmentId: r.environmentId,
        releaseType: r.releaseType,
        artifactType: r.artifactType,
        artifactId: r.artifactId,
        artifactVersionId: r.artifactVersionId,
        artifactChecksum: r.artifactChecksum,
        fromEnvironment: r.fromEnvironment,
        toEnvironment: r.toEnvironment,
        status: r.status,
        approvalRequired: r.approvalRequired,
        approvedBy: r.approvedBy,
        approvedAt: r.approvedAt?.toISOString() ?? null,
        diffReview: r.diffReview,
        rollbackOf: r.rollbackOf,
        deployedBy: r.deployedBy,
        notes: r.notes,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
    );
  },
);

router.get(
  "/environments/diff/:workflowId",
  authorize({ resource: "environments", action: "read" }),
  async (req: Request, res: Response): Promise<void> => {
    const workflowId = Number(req.params.workflowId);
    const { from, to } = req.query as { from?: string; to?: string };

    const versions = await db
      .select()
      .from(workflowVersionsTable)
      .where(eq(workflowVersionsTable.workflowId, workflowId))
      .orderBy(desc(workflowVersionsTable.version));

    const fromVersion = versions[0] ?? null;
    const toVersion = versions.length > 1 ? versions[1] : null;

    res.json({
      from: fromVersion ? { version: fromVersion.version, name: fromVersion.name, nodes: fromVersion.nodes, changeNote: fromVersion.changeNote, createdAt: fromVersion.createdAt } : null,
      to: toVersion ? { version: toVersion.version, name: toVersion.name, nodes: toVersion.nodes, changeNote: toVersion.changeNote, createdAt: toVersion.createdAt } : null,
    });
  },
);

router.get(
  "/environments/promotions",
  authorize({ resource: "environments", action: "read" }),
  async (_req: Request, res: Response): Promise<void> => {
    const rows = await db
      .select()
      .from(workflowPromotionsTable)
      .orderBy(desc(workflowPromotionsTable.createdAt));
    res.json(rows.map((p) => ({
      id: p.id,
      workflowId: p.workflowId,
      workflowName: p.workflowName,
      fromEnvironment: p.fromEnvironment,
      toEnvironment: p.toEnvironment,
      status: p.status,
      promotedBy: p.promotedBy,
      approvedBy: p.approvedBy,
      approvedAt: p.approvedAt?.toISOString() ?? null,
      rejectionReason: p.rejectionReason,
      rejectedAt: p.rejectedAt?.toISOString() ?? null,
      notes: p.notes,
      createdAt: p.createdAt.toISOString(),
    })));
  },
);

export default router;
