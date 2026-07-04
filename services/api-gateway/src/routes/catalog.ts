import { Router, type IRouter } from "express";
import { prisma } from "@longox/db/prisma";
import { authorize } from "@longox/shared-rbac";
import { ftsSearchService } from "../services/search.service";

const router: IRouter = Router();

function serializeConnector(row: any) {
  return {
    id: row.id,
    name: row.name,
    displayName: row.displayName ?? null,
    version: (row as any).version ?? null,
    category: row.category,
    description: row.description,
    icon: row.icon,
    color: (row as any).color ?? null,
    author: (row as any).author ?? null,
    certificationLevel: (row as any).certificationLevel ?? row.trustLevel ?? null,
    authType: row.authType ?? null,
    authConfig: (row as any).authConfig ?? null,
    permissions: (row as any).permissions ?? [],
    capabilities: (row as any).capabilities ?? null,
    rateLimit: (row as any).rateLimit ?? null,
    healthStatus: (row as any).healthStatus ?? null,
    isInstalled: (row as any).isInstalled ?? false,
    isFeatured: (row as any).isFeatured ?? false,
    actionCount: (row as any).actionCount ?? 0,
    triggerCount: (row as any).triggerCount ?? 0,
    installCount: (row as any).installCount ?? 0,
    rating: (row as any).rating ?? null,
  };
}

function serializeApp(row: any) {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? null,
    type: row.type,
    status: row.status,
    pageCount: row.pageCount,
    lastEditedAt: row.lastEditedAt instanceof Date ? row.lastEditedAt.toISOString() : new Date(row.lastEditedAt).toISOString(),
    viewCount: row.viewCount,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : new Date(row.createdAt).toISOString(),
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : new Date(row.updatedAt).toISOString(),
    layout: row.layout ?? null,
  };
}

function serializeCredential(row: any) {
  return {
    id: row.id,
    name: row.name,
    connectorId: String(row.connectorId),
    connectorName: row.connectorName,
    fields: row.fields,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : new Date(row.createdAt).toISOString(),
  };
}

router.get("/connectors/categories", authorize({ resource: "connectors", action: "read" }), async (_req, res): Promise<void> => {
  const rows = (await prisma.connector.findMany()) as any[];
  const counts = new Map<string, number>();
  for (const row of rows) {
    counts.set(row.category, (counts.get(row.category) ?? 0) + 1);
  }
  res.json(
    [...counts.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, count]) => ({ name, count })),
  );
});

router.get("/connectors", authorize({ resource: "connectors", action: "read" }), async (req, res): Promise<void> => {
  const where: any = {};
  if (req.query.category) where.category = String(req.query.category);
  if (req.query.installed) where.isInstalled = String(req.query.installed) === "true";

  const searchQuery = req.query.search as string | undefined;
  if (searchQuery) {
    const searchResult = await ftsSearchService.search(searchQuery, {
      resourceTypes: ["connector"],
      limit: 100,
    });
    const ids = searchResult.results.map((r) => r.resourceId);
    if (ids.length > 0) {
      where.id = { in: ids };
    } else {
      res.json([]);
      return;
    }
  }

  const rows = (await prisma.connector.findMany({
    where,
    orderBy: [{ isFeatured: "desc" }, { name: "asc" }] as any,
  })) as any[];

  res.json(rows.map(serializeConnector));
});

router.get("/connectors/:id", authorize({ resource: "connectors", action: "read" }), async (req, res): Promise<void> => {
  const id = String(req.params.id);
  if (!Number.isInteger(Number(id))) {
    res.status(400).json({ error: "Invalid connector id" });
    return;
  }
  const row = (await prisma.connector.findUnique({ where: { id } })) as any;
  if (!row) {
    res.status(404).json({ error: "Connector not found" });
    return;
  }
  res.json(serializeConnector(row));
});

router.post("/connectors/:id/install", authorize({ resource: "connectors", action: "install" }), async (req, res): Promise<void> => {
  const id = String(req.params.id);
  if (!Number.isInteger(Number(id))) {
    res.status(400).json({ error: "Invalid connector id" });
    return;
  }
  const row = (await prisma.connector.update({
    where: { id },
    data: {
      isInstalled: true,
      installCount: { increment: 1 },
    } as any,
  })) as any;
  if (!row) {
    res.status(404).json({ error: "Connector not found" });
    return;
  }
  res.json(serializeConnector(row));
});

router.post("/connectors/:id/configure", authorize({ resource: "connectors", action: "write" }), async (req, res): Promise<void> => {
  const id = String(req.params.id);
  if (!Number.isInteger(Number(id))) {
    res.status(400).json({ error: "Invalid connector id" });
    return;
  }
  const config = req.body.config || {};
  const row = (await prisma.connector.update({
    where: { id },
    data: { authConfig: config } as any,
  })) as any;
  if (!row) {
    res.status(404).json({ error: "Connector not found" });
    return;
  }
  res.json(serializeConnector(row));
});

router.post("/connectors/:id/upgrade", authorize({ resource: "connectors", action: "install" }), async (req, res): Promise<void> => {
  const id = String(req.params.id);
  if (!Number.isInteger(Number(id))) {
    res.status(400).json({ error: "Invalid connector id" });
    return;
  }
  const version = req.body.version || "1.0.1";
  const row = (await prisma.connector.update({
    where: { id },
    data: { version } as any,
  })) as any;
  if (!row) {
    res.status(404).json({ error: "Connector not found" });
    return;
  }
  res.json(serializeConnector(row));
});

router.post("/connectors/:id/remove", authorize({ resource: "connectors", action: "install" }), async (req, res): Promise<void> => {
  const id = String(req.params.id);
  if (!Number.isInteger(Number(id))) {
    res.status(400).json({ error: "Invalid connector id" });
    return;
  }
  const row = (await prisma.connector.update({
    where: { id },
    data: { isInstalled: false } as any,
  })) as any;
  if (!row) {
    res.status(404).json({ error: "Connector not found" });
    return;
  }
  res.json(serializeConnector(row));
});

router.get("/apps/stats", authorize({ resource: "apps", action: "read" }), async (_req, res): Promise<void> => {
  const rows = (await prisma.app.findMany()) as any[];
  const byType = new Map<string, number>();
  for (const row of rows) {
    byType.set(row.type, (byType.get(row.type) ?? 0) + 1);
  }
  res.json({
    totalApps: rows.length,
    publishedApps: rows.filter((row) => row.status === "published").length,
    draftApps: rows.filter((row) => row.status === "draft").length,
    totalViews: rows.reduce((sum, row) => sum + row.viewCount, 0),
    byType: [...byType.entries()].map(([type, count]) => ({ type, count })),
  });
});

router.get("/apps", authorize({ resource: "apps", action: "read" }), async (req, res): Promise<void> => {
  const where: any = {};
  if (req.query.type) where.type = String(req.query.type);
  if (req.query.status) where.status = String(req.query.status);

  const searchQuery = req.query.search as string | undefined;
  if (searchQuery) {
    const searchResult = await ftsSearchService.search(searchQuery, {
      resourceTypes: ["app"],
      limit: 100,
    });
    const ids = searchResult.results.map((r) => r.resourceId);
    if (ids.length > 0) {
      where.id = { in: ids };
    } else {
      res.json([]);
      return;
    }
  }

  const rows = (await prisma.app.findMany({
    where,
    orderBy: { updatedAt: "desc" },
  })) as any[];

  res.json(rows.map(serializeApp));
});

router.post("/apps", authorize({ resource: "apps", action: "write" }), async (req, res): Promise<void> => {
  const body = req.body as {
    name?: string;
    description?: string;
    type?: string;
    layout?: Record<string, unknown>;
  };
  if (!body.name?.trim()) {
    res.status(400).json({ error: "name is required" });
    return;
  }

  const row = (await prisma.app.create({
    data: {
      name: body.name.trim(),
      description: body.description ?? null,
      type: body.type ?? "dashboard",
      layout: body.layout ?? undefined,
    } as any,
  })) as any;

  res.status(201).json(serializeApp(row));
});

router.get("/apps/:id", authorize({ resource: "apps", action: "read" }), async (req, res): Promise<void> => {
  const id = String(req.params.id);
  if (!Number.isInteger(Number(id))) {
    res.status(400).json({ error: "Invalid app id" });
    return;
  }
  const row = (await prisma.app.findUnique({ where: { id } })) as any;
  if (!row) {
    res.status(404).json({ error: "App not found" });
    return;
  }
  res.json(serializeApp(row));
});

router.patch("/apps/:id", authorize({ resource: "apps", action: "write" }), async (req, res): Promise<void> => {
  const id = String(req.params.id);
  if (!Number.isInteger(Number(id))) {
    res.status(400).json({ error: "Invalid app id" });
    return;
  }
  const body = req.body as {
    name?: string;
    description?: string;
    status?: string;
    layout?: Record<string, unknown>;
  };
  const updates: Record<string, unknown> = { lastEditedAt: new Date() };
  if (body.name !== undefined) updates.name = body.name;
  if (body.description !== undefined) updates.description = body.description;
  if (body.status !== undefined) updates.status = body.status;
  if (body.layout !== undefined) updates.layout = body.layout;

  const row = (await prisma.app.update({
    where: { id },
    data: updates as any,
  })) as any;
  if (!row) {
    res.status(404).json({ error: "App not found" });
    return;
  }
  res.json(serializeApp(row));
});

router.delete("/apps/:id", authorize({ resource: "apps", action: "delete" }), async (req, res): Promise<void> => {
  const id = String(req.params.id);
  if (!Number.isInteger(Number(id))) {
    res.status(400).json({ error: "Invalid app id" });
    return;
  }
  await prisma.app.delete({ where: { id } });
  res.status(204).end();
});

router.get("/credentials", authorize({ resource: "credentials", action: "read" }), async (_req, res): Promise<void> => {
  const rows = (await prisma.credential.findMany({
    orderBy: { createdAt: "desc" },
  })) as any[];
  res.json(rows.map(serializeCredential));
});

router.post("/credentials", authorize({ resource: "credentials", action: "write" }), async (req, res): Promise<void> => {
  const body = req.body as {
    name?: string;
    connectorId?: string;
    connectorName?: string;
    fields?: string[];
  };
  if (!body.name?.trim() || !body.connectorId || !body.connectorName?.trim()) {
    res
      .status(400)
      .json({ error: "name, connectorId, and connectorName are required" });
    return;
  }

  const row = (await prisma.credential.create({
    data: {
      name: body.name.trim(),
      connectorId: Number(body.connectorId),
      connectorName: body.connectorName.trim(),
      fields: body.fields ?? [],
    } as any,
  })) as any;
  res.status(201).json(serializeCredential(row));
});

router.delete("/credentials/:id", authorize({ resource: "credentials", action: "write" }), async (req, res): Promise<void> => {
  const id = String(req.params.id);
  if (!Number.isInteger(Number(id))) {
    res.status(400).json({ error: "Invalid credential id" });
    return;
  }
  await prisma.credential.delete({ where: { id } });
  res.status(204).end();
});

export default router;
