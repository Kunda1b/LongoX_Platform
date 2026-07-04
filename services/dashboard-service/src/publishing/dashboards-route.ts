/**
 * Dashboard publishing REST routes.
 *
 * Migrated from Drizzle to Prisma per ADR-013 Phase 3.
 * Uses `prisma.dashboard` delegate with `as any` casts for legacy columns
 * (`name`, `widgets`, `publishedAt`) that don't exist in the canonical
 * Prisma schema but are still present in the underlying `dashboards` table.
 */

import { Router, type IRouter } from "express";
import { prisma } from "@longox/db/prisma";
import { authorize } from "@longox/shared-rbac";

const router: IRouter = Router();

function serializeDashboard(d: any) {
  return {
    id: d.id,
    name: d.name,
    description: d.description ?? null,
    status: d.status,
    widgets: (d.widgets as object[]) ?? [],
    publishedAt: d.publishedAt ? new Date(d.publishedAt).toISOString() : null,
    createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : null,
    updatedAt: d.updatedAt ? new Date(d.updatedAt).toISOString() : null,
  };
}

router.get("/dashboards/stats", authorize("dashboards:read"), async (_req, res): Promise<void> => {
  const all = await prisma.dashboard.findMany();
  const total = all.length;
  const published = all.filter((d: any) => d.status === "published").length;
  const draft = all.filter((d: any) => d.status === "draft").length;
  const totalWidgets = all.reduce((sum, d: any) => {
    const widgets = Array.isArray(d.widgets)
      ? (d.widgets as unknown[]).length
      : 0;
    return sum + widgets;
  }, 0);
  res.json({ total, published, draft, totalWidgets });
});

router.get("/dashboards", authorize("dashboards:read"), async (req, res): Promise<void> => {
  const where: Record<string, unknown> = {};
  if (req.query.status) where.status = String(req.query.status);
  if (req.query.search) where.name = { contains: String(req.query.search), mode: "insensitive" };

  const dashboards = await prisma.dashboard.findMany({
    where: where as any,
    orderBy: { updatedAt: "asc" } as any,
  });

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

  const dashboard = await prisma.dashboard.create({
    data: {
      name: name.trim(),
      title: name.trim(),
      description: description ?? null,
      widgets: widgets ?? [],
    } as any,
  });

  res.status(201).json(serializeDashboard(dashboard));
});

router.get("/dashboards/:id", authorize("dashboards:read"), async (req, res): Promise<void> => {
  const id = String(req.params.id);
  if (!id) {
    res.status(400).json({ error: "id is required" });
    return;
  }

  const dashboard = await prisma.dashboard.findUnique({ where: { id } });
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
  if (name !== undefined) {
    updates.name = name;
    updates.title = name;
  }
  if (description !== undefined) updates.description = description;
  if (widgets !== undefined) updates.widgets = widgets;
  if (status !== undefined) updates.status = status;

  const dashboard = await prisma.dashboard.update({
    where: { id },
    data: updates as any,
  }).catch(() => null);

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

  const dashboard = await prisma.dashboard.delete({ where: { id } }).catch(() => null);
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

  const dashboard = await prisma.dashboard.update({
    where: { id },
    data: { status: "published", publishedAt: new Date() } as any,
  }).catch(() => null);

  if (!dashboard) {
    res.status(404).json({ error: "Dashboard not found" });
    return;
  }

  res.json(serializeDashboard(dashboard));
});

export default router;
