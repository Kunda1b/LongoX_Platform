import { Router, type IRouter } from "express";
import { eq, like, and } from "drizzle-orm";
import { db, dashboardsTable } from "@longox/db";

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

router.get("/dashboards/stats", async (_req, res): Promise<void> => {
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

router.get("/dashboards", async (req, res): Promise<void> => {
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

router.post("/dashboards", async (req, res): Promise<void> => {
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
    })
    .returning();

  res.status(201).json(serializeDashboard(dashboard));
});

router.get("/dashboards/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
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

router.patch("/dashboards/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
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

router.delete("/dashboards/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
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

router.post("/dashboards/:id/publish", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
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
