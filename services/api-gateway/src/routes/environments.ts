import { Router, type IRouter, type Request, type Response } from "express";
import { eq, and, desc, sql } from "drizzle-orm";
import { db, environmentsTable, workflowPromotionsTable, workflowVersionsTable, workflowsTable } from "@longox/db";
import { authorize } from "@longox/shared-rbac";
import { z } from "zod";

const router: IRouter = Router();

const promoteSchema = z.object({
  workflowId: z.number(),
  fromEnvironment: z.string(),
  toEnvironment: z.string(),
  notes: z.string().optional(),
});

const rollbackSchema = z.object({
  promotionId: z.number(),
});

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
    const parsed = promoteSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const { workflowId, fromEnvironment, toEnvironment, notes } = parsed.data;

    const [workflow] = await db
      .select()
      .from(workflowsTable)
      .where(eq(workflowsTable.id, workflowId))
      .limit(1);

    if (!workflow) {
      res.status(404).json({ error: "Workflow not found" });
      return;
    }

    const [latestVersion] = await db
      .select()
      .from(workflowVersionsTable)
      .where(eq(workflowVersionsTable.workflowId, workflowId))
      .orderBy(desc(workflowVersionsTable.version))
      .limit(1);

    const [promotion] = await db
      .insert(workflowPromotionsTable)
      .values({
        workflowId,
        workflowName: workflow.name,
        fromEnvironment,
        toEnvironment,
        status: "promoted",
        promotedBy: req.user?.email ?? "system",
        notes,
      })
      .returning();

    await db.insert(workflowVersionsTable).values({
      workflowId,
      version: (latestVersion?.version ?? 0) + 1,
      name: workflow.name,
      nodes: workflow.nodes ?? [],
      changeNote: `Promoted from ${fromEnvironment} to ${toEnvironment}`,
    });

    res.status(201).json({ promotion, workflow });
  },
);

router.post(
  "/environments/rollback",
  authorize({ resource: "environments", action: "write" }),
  async (req: Request, res: Response): Promise<void> => {
    const parsed = rollbackSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const { promotionId } = parsed.data;

    const [promotion] = await db
      .select()
      .from(workflowPromotionsTable)
      .where(eq(workflowPromotionsTable.id, promotionId))
      .limit(1);

    if (!promotion) {
      res.status(404).json({ error: "Promotion not found" });
      return;
    }

    await db
      .update(workflowPromotionsTable)
      .set({ status: "rolled_back" })
      .where(eq(workflowPromotionsTable.id, promotionId));

    res.json({ message: `Rolled back ${promotion.workflowName} from ${promotion.toEnvironment} to ${promotion.fromEnvironment}` });
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
      notes: p.notes,
      createdAt: p.createdAt.toISOString(),
    })));
  },
);

export default router;
