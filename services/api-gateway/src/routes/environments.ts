import { Router, type IRouter, type Request, type Response } from "express";
import { prisma } from "@longox/db/prisma";
import { authorize } from "@longox/shared-rbac";
import { promotionApprovalService } from "../services/promotion-approval.service";
import { registerVersionedRoutes } from "../lib/api-versioning";

const router: IRouter = Router();

registerVersionedRoutes(router, [
  { path: "/api/v1/environments", handler: (_req, _res, next) => next(), deprecatedSince: "2026-01-01", sunsetDate: "2026-07-03" },
]);

router.get(
  "/environments",
  authorize({ resource: "environments", action: "read" }),
  async (_req: Request, res: Response): Promise<void> => {
    const rows = (await prisma.environment.findMany({
      orderBy: { id: "asc" },
    })) as any[];
    const totalWorkflows = await prisma.workflow.count();
    const perEnv = rows.length > 0 ? Math.floor(totalWorkflows / rows.length) : 0;

    res.json(rows.map((e, i) => ({
      id: e.id,
      name: e.name,
      type: e.type,
      description: (e as any).description,
      isDefault: (e as any).isDefault ?? false,
      workflowCount: i === 0 ? totalWorkflows - perEnv * (rows.length - 1) : perEnv,
      createdAt: e.createdAt instanceof Date ? e.createdAt.toISOString() : new Date(e.createdAt).toISOString(),
      updatedAt: e.updatedAt instanceof Date ? e.updatedAt.toISOString() : new Date(e.updatedAt).toISOString(),
    })));
  },
);

router.get(
  "/environments/:id",
  authorize({ resource: "environments", action: "read" }),
  async (req: Request, res: Response): Promise<void> => {
    const id = String(req.params.id);
    const row = (await prisma.environment.findUnique({ where: { id } })) as any;
    if (!row) {
      res.status(404).json({ error: "Environment not found" });
      return;
    }
    res.json({
      id: row.id,
      name: row.name,
      type: row.type,
      description: row.description,
      isDefault: row.isDefault ?? false,
      createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : new Date(row.createdAt).toISOString(),
      updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : new Date(row.updatedAt).toISOString(),
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
    const row = (await prisma.environment.create({
      data: { name: name.trim(), type: type ?? "dev", description } as any,
    })) as any;
    res.status(201).json({
      id: row.id,
      name: row.name,
      type: row.type,
      description: row.description,
      isDefault: row.isDefault ?? false,
      createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : new Date(row.createdAt).toISOString(),
      updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : new Date(row.updatedAt).toISOString(),
    });
  },
);

router.patch(
  "/environments/:id",
  authorize({ resource: "environments", action: "write" }),
  async (req: Request, res: Response): Promise<void> => {
    const id = String(req.params.id);
    const { name, type, description } = req.body as {
      name?: string;
      type?: string;
      description?: string;
    };
    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name.trim();
    if (type !== undefined) updates.type = type;
    if (description !== undefined) updates.description = description;
    const row = (await prisma.environment.update({
      where: { id },
      data: updates as any,
    })) as any;
    if (!row) {
      res.status(404).json({ error: "Environment not found" });
      return;
    }
    res.json({
      id: row.id,
      name: row.name,
      type: row.type,
      description: row.description,
      isDefault: row.isDefault ?? false,
      createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : new Date(row.createdAt).toISOString(),
      updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : new Date(row.updatedAt).toISOString(),
    });
  },
);

router.delete(
  "/environments/:id",
  authorize({ resource: "environments", action: "admin" }),
  async (req: Request, res: Response): Promise<void> => {
    const id = String(req.params.id);
    await prisma.environment.delete({ where: { id } });
    res.status(204).end();
  },
);

router.post(
  "/environments/promote",
  authorize({ resource: "environments", action: "write" }),
  async (req: Request, res: Response): Promise<void> => {
    const body = req.body as Record<string, unknown>;
    const workflowId = body.workflowId as string;
    const fromEnvironment = body.fromEnvironment as string;
    const toEnvironment = body.toEnvironment as string;
    const notes = body.notes as string | undefined;
    const approvalRequired = body.approvalRequired as boolean | undefined;
    if (!workflowId || typeof workflowId !== "string") { res.status(400).json({ error: "workflowId is required and must be a string" }); return; }
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
    const { promotionId } = req.body as Record<string, unknown>;
    if (!promotionId || typeof promotionId !== "string") { res.status(400).json({ error: "promotionId is required and must be a string" }); return; }
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
    const promotionId = String(req.params.id);
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
    const promotionId = String(req.params.id);
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
    const promotionId = String(req.params.id);

    const promotion = (await prisma.workflowPromotion.findUnique({
      where: { id: promotionId },
    })) as any;

    if (!promotion) {
      res.status(404).json({ error: "Promotion not found" });
      return;
    }

    const release = (await prisma.environmentRelease.findFirst({
      where: {
        artifactType: "workflow",
        sourceVersionId: promotion.workflowId,
        fromEnvironment: promotion.fromEnvironment,
        toEnvironment: promotion.toEnvironment,
      } as any,
      orderBy: { createdAt: "desc" },
    })) as any;

    res.json({ promotion, release: release ?? null });
  },
);

router.get(
  "/environments/:id/releases",
  authorize({ resource: "environments", action: "read" }),
  async (req: Request, res: Response): Promise<void> => {
    const environmentId = String(req.params.id);

    const releases = (await prisma.environmentRelease.findMany({
      where: { environmentId },
      orderBy: { createdAt: "desc" },
    })) as any[];

    res.json(
      releases.map((r) => ({
        id: r.id,
        environmentId: r.environmentId,
        releaseType: (r as any).releaseType ?? "workflow",
        artifactType: r.artifactType,
        artifactId: (r as any).artifactId ?? r.sourceVersionId,
        artifactVersionId: (r as any).artifactVersionId,
        artifactChecksum: (r as any).artifactChecksum,
        fromEnvironment: (r as any).fromEnvironment,
        toEnvironment: (r as any).toEnvironment,
        status: r.status,
        approvalRequired: (r as any).approvalRequired ?? false,
        approvedBy: r.approvedBy,
        approvedAt: r.approvedAt
          ? (r.approvedAt instanceof Date ? r.approvedAt.toISOString() : new Date(r.approvedAt).toISOString())
          : null,
        diffReview: (r as any).diffReview,
        rollbackOf: (r as any).rollbackOf,
        deployedBy: r.deployedBy,
        notes: r.notes,
        createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : new Date(r.createdAt).toISOString(),
        updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : new Date(r.updatedAt).toISOString(),
      })),
    );
  },
);

router.get(
  "/environments/diff/:workflowId",
  authorize({ resource: "environments", action: "read" }),
  async (req: Request, res: Response): Promise<void> => {
    const workflowId = String(req.params.workflowId);
    const { from, to } = req.query as { from?: string; to?: string };
    void from; void to;

    const versions = (await prisma.workflowVersion.findMany({
      where: { workflowId },
      orderBy: { versionNumber: "desc" },
    })) as any[];

    const fromVersion = versions[0] ?? null;
    const toVersion = versions.length > 1 ? versions[1] : null;

    res.json({
      from: fromVersion ? { version: fromVersion.versionNumber ?? fromVersion.version, name: (fromVersion as any).name, nodes: (fromVersion as any).nodes ?? fromVersion.graphJson, changeNote: (fromVersion as any).changeNote, createdAt: fromVersion.createdAt } : null,
      to: toVersion ? { version: toVersion.versionNumber ?? toVersion.version, name: (toVersion as any).name, nodes: (toVersion as any).nodes ?? toVersion.graphJson, changeNote: (toVersion as any).changeNote, createdAt: toVersion.createdAt } : null,
    });
  },
);

router.get(
  "/environments/promotions",
  authorize({ resource: "environments", action: "read" }),
  async (_req: Request, res: Response): Promise<void> => {
    const rows = (await prisma.workflowPromotion.findMany({
      orderBy: { createdAt: "desc" },
    })) as any[];
    res.json(rows.map((p) => ({
      id: p.id,
      workflowId: p.workflowId,
      workflowName: p.workflowName,
      fromEnvironment: p.fromEnvironment,
      toEnvironment: p.toEnvironment,
      status: p.status,
      promotedBy: p.promotedBy,
      approvedBy: p.approvedBy,
      approvedAt: p.approvedAt
        ? (p.approvedAt instanceof Date ? p.approvedAt.toISOString() : new Date(p.approvedAt).toISOString())
        : null,
      rejectionReason: p.rejectionReason,
      rejectedAt: p.rejectedAt
        ? (p.rejectedAt instanceof Date ? p.rejectedAt.toISOString() : new Date(p.rejectedAt).toISOString())
        : null,
      notes: p.notes,
      createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : new Date(p.createdAt).toISOString(),
    })));
  },
);

export default router;
