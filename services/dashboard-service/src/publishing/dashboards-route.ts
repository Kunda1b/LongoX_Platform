import { Router, type IRouter } from "express";
import { eq, like, and } from "drizzle-orm";
import { db, dashboardsTable } from "@longox/db";
import { authorize } from "@longox/shared-rbac";

const router: IRouter = Router();

function serializeDashboard(d: typeof dashboardsTable.$inferSelect) {
  return {
    id: d.id,
    name: d.name,
    description: d.description ?? null,
    status: d.status,
    widgets: (d.widgets as object[]) ?? [],
    publishedAt: d.publishedAt ? d.publishedAt.toISOString() : null,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
  };
}

router.get("/dashboards/stats", authorize("dashboards:read"), async (_req, res): Promise<void> => {
  const all = await db.select().from(dashboardsTable);
  const total = all.length;
  const published = all.filter((d) => d.status === "published").length;
  const draft = all.filter((d) => d.status === "draft").length;
  const totalWidgets = all.reduce((sum, d) => {
    const widgets = Array.isArray(d.widgets)
      ? (d.widgets as unknown[]).length
      : 0;
    return sum + widgets;
  }, 0);
  res.json({ total, published, draft, totalWidgets });
});

router.get("/dashboards", authorize("dashboards:read"), async (req, res): Promise<void> => {
  const conditions = [];
  if (req.query.status)
    conditions.push(eq(dashboardsTable.status, String(req.query.status)));
  if (req.query.search)
    conditions.push(like(dashboardsTable.name, `%${req.query.search}%`));

  const dashboards = await db
    .select()
    .from(dashboardsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(dashboardsTable.updatedAt);

  res.json(dashboards.map(serializeDashboard));
});

router.post("/dashboards", authorize("dashboards:write"), async (req, res): Promise<void> => {
  const { name, description, widgets } = req.body as {
    name?: string;
    description?: string;
    widgets?: object[];
  };

  if (!name || typeof name !== "string" || !name.trim()) {
    res.status(400).json({ error: "name is required" });
    return;
  }

  const [dashboard] = await db
    .insert(dashboardsTable)
    .values({
      name: name.trim(),
      description: description ?? null,
      widgets: widgets ?? [],
    } as any)
    .returning();

  res.status(201).json(serializeDashboard(dashboard));
});

router.get("/dashboards/:id", authorize("dashboards:read"), async (req, res): Promise<void> => {
  const id = String(req.params.id);
  if (!id) {
    res.status(400).json({ error: "id is required" });
    return;
  }

  const [dashboard] = await db
    .select()
    .from(dashboardsTable)
    .where(eq(dashboardsTable.id, id));
  if (!dashboard) {
    res.status(404).json({ error: "Dashboard not found" });
    return;
  }

  res.json(serializeDashboard(dashboard));
});

router.patch("/dashboards/:id", authorize("dashboards:write"), async (req, res): Promise<void> => {
  const id = String(req.params.id);
  if (!id) {
    res.status(400).json({ error: "id is required" });
    return;
  }

  const { name, description, widgets, status } = req.body as {
    name?: string;
    description?: string;
    widgets?: object[];
    status?: string;
  };

  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description;
  if (widgets !== undefined) updates.widgets = widgets;
  if (status !== undefined) updates.status = status;

  const [dashboard] = await db
    .update(dashboardsTable)
    .set(updates)
    .where(eq(dashboardsTable.id, id))
    .returning();

  if (!dashboard) {
    res.status(404).json({ error: "Dashboard not found" });
    return;
  }

  res.json(serializeDashboard(dashboard));
});

router.delete("/dashboards/:id", authorize("dashboards:delete"), async (req, res): Promise<void> => {
  const id = String(req.params.id);
  if (!id) {
    res.status(400).json({ error: "id is required" });
    return;
  }

  const [dashboard] = await db
    .delete(dashboardsTable)
    .where(eq(dashboardsTable.id, id))
    .returning();
  if (!dashboard) {
    res.status(404).json({ error: "Dashboard not found" });
    return;
  }

  res.sendStatus(204);
});

router.post("/dashboards/:id/publish", authorize("dashboards:write"), async (req, res): Promise<void> => {
  const id = String(req.params.id);
  if (!id) {
    res.status(400).json({ error: "id is required" });
    return;
  }

  const [dashboard] = await db
    .update(dashboardsTable)
    .set({ status: "published", publishedAt: new Date() })
    .where(eq(dashboardsTable.id, id))
    .returning();

  if (!dashboard) {
    res.status(404).json({ error: "Dashboard not found" });
    return;
  }

  res.json(serializeDashboard(dashboard));
});

export default router;
