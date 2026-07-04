import { Router, type IRouter } from "express";
import { and, desc, eq, inArray, or, sql } from "drizzle-orm";
import {
  appsTable,
  connectorsTable,
  credentialsTable,
  db,
} from "@longox/db";
import { authorize } from "@longox/shared-rbac";
import { ftsSearchService } from "../services/search.service";

const router: IRouter = Router();

function serializeConnector(row: typeof connectorsTable.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    displayName: row.displayName ?? null,
    version: row.version ?? null,
    category: row.category,
    description: row.description,
    icon: row.icon,
    color: row.color ?? null,
    author: row.author ?? null,
    certificationLevel: row.certificationLevel ?? null,
    authType: row.authType ?? null,
    authConfig: row.authConfig ?? null,
    permissions: row.permissions ?? [],
    capabilities: row.capabilities ?? null,
    rateLimit: row.rateLimit ?? null,
    healthStatus: row.healthStatus ?? null,
    isInstalled: row.isInstalled,
    isFeatured: row.isFeatured,
    actionCount: row.actionCount,
    triggerCount: row.triggerCount,
    installCount: row.installCount,
    rating: row.rating ?? null,
  };
}

function serializeApp(row: typeof appsTable.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? null,
    type: row.type,
    status: row.status,
    pageCount: row.pageCount,
    lastEditedAt: row.lastEditedAt.toISOString(),
    viewCount: row.viewCount,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    layout: row.layout ?? null,
  };
}

function serializeCredential(row: typeof credentialsTable.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    connectorId: row.connectorId,
    connectorName: row.connectorName,
    fields: row.fields,
    createdAt: row.createdAt.toISOString(),
  };
}

router.get("/connectors/categories", authorize({ resource: "connectors", action: "read" }), async (_req, res): Promise<void> => {
  const rows = await db.select().from(connectorsTable);
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
  const conditions = [];
  if (req.query.category)
    conditions.push(eq(connectorsTable.category, String(req.query.category)));
  if (req.query.installed)
    conditions.push(
      eq(connectorsTable.isInstalled, String(req.query.installed) === "true"),
    );

  const searchQuery = req.query.search as string | undefined;
  if (searchQuery) {
    const searchResult = await ftsSearchService.search(searchQuery, {
      resourceTypes: ["connector"],
      limit: 100,
    });
    const ids = searchResult.results.map((r) => parseInt(r.resourceId, 10));
    if (ids.length > 0) {
      conditions.push(inArray(connectorsTable.id, ids));
    } else {
      res.json([]);
      return;
    }
  }

  const rows = await db
    .select()
    .from(connectorsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(connectorsTable.isFeatured), connectorsTable.name);

  res.json(rows.map(serializeConnector));
});

router.get("/connectors/:id", authorize({ resource: "connectors", action: "read" }), async (req, res): Promise<void> => {
  const id = String(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "Invalid connector id" });
    return;
  }
  const [row] = await db
    .select()
    .from(connectorsTable)
    .where(eq(connectorsTable.id, id))
    .limit(1);
  if (!row) {
    res.status(404).json({ error: "Connector not found" });
    return;
  }
  res.json(serializeConnector(row));
});

router.post("/connectors/:id/install", authorize({ resource: "connectors", action: "install" }), async (req, res): Promise<void> => {
  const id = String(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "Invalid connector id" });
    return;
  }
  const [row] = await db
    .update(connectorsTable)
    .set({
      isInstalled: true,
      installCount: sql`${connectorsTable.installCount} + 1`,
    })
    .where(eq(connectorsTable.id, id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Connector not found" });
    return;
  }
  res.json(serializeConnector(row));
});

router.post("/connectors/:id/configure", authorize({ resource: "connectors", action: "write" }), async (req, res): Promise<void> => {
  const id = String(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "Invalid connector id" });
    return;
  }
  const config = req.body.config || {};
  const [row] = await db
    .update(connectorsTable)
    .set({
      authConfig: config,
    })
    .where(eq(connectorsTable.id, id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Connector not found" });
    return;
  }
  res.json(serializeConnector(row));
});

router.post("/connectors/:id/upgrade", authorize({ resource: "connectors", action: "install" }), async (req, res): Promise<void> => {
  const id = String(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "Invalid connector id" });
    return;
  }
  const version = req.body.version || "1.0.1";
  const [row] = await db
    .update(connectorsTable)
    .set({
      version: version,
    })
    .where(eq(connectorsTable.id, id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Connector not found" });
    return;
  }
  res.json(serializeConnector(row));
});

router.post("/connectors/:id/remove", authorize({ resource: "connectors", action: "install" }), async (req, res): Promise<void> => {
  const id = String(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "Invalid connector id" });
    return;
  }
  const [row] = await db
    .update(connectorsTable)
    .set({
      isInstalled: false,
    })
    .where(eq(connectorsTable.id, id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Connector not found" });
    return;
  }
  res.json(serializeConnector(row));
});

router.get("/apps/stats", authorize({ resource: "apps", action: "read" }), async (_req, res): Promise<void> => {
  const rows = await db.select().from(appsTable);
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
  const conditions = [];
  if (req.query.type) conditions.push(eq(appsTable.type, String(req.query.type)));
  if (req.query.status)
    conditions.push(eq(appsTable.status, String(req.query.status)));

  const searchQuery = req.query.search as string | undefined;
  if (searchQuery) {
    const searchResult = await ftsSearchService.search(searchQuery, {
      resourceTypes: ["app"],
      limit: 100,
    });
    const ids = searchResult.results.map((r) => parseInt(r.resourceId, 10));
    if (ids.length > 0) {
      conditions.push(inArray(appsTable.id, ids));
    } else {
      res.json([]);
      return;
    }
  }

  const rows = await db
    .select()
    .from(appsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(appsTable.updatedAt));

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

  const [row] = await db
    .insert(appsTable)
    .values({
      name: body.name.trim(),
      description: body.description ?? null,
      type: body.type ?? "dashboard",
      layout: body.layout ?? null,
    })
    .returning();

  res.status(201).json(serializeApp(row));
});

router.get("/apps/:id", authorize({ resource: "apps", action: "read" }), async (req, res): Promise<void> => {
  const id = String(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "Invalid app id" });
    return;
  }
  const [row] = await db.select().from(appsTable).where(eq(appsTable.id, id));
  if (!row) {
    res.status(404).json({ error: "App not found" });
    return;
  }
  res.json(serializeApp(row));
});

router.patch("/apps/:id", authorize({ resource: "apps", action: "write" }), async (req, res): Promise<void> => {
  const id = String(req.params.id);
  if (!Number.isInteger(id)) {
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

  const [row] = await db
    .update(appsTable)
    .set(updates)
    .where(eq(appsTable.id, id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "App not found" });
    return;
  }
  res.json(serializeApp(row));
});

router.delete("/apps/:id", authorize({ resource: "apps", action: "delete" }), async (req, res): Promise<void> => {
  const id = String(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "Invalid app id" });
    return;
  }
  await db.delete(appsTable).where(eq(appsTable.id, id));
  res.status(204).end();
});

router.get("/credentials", authorize({ resource: "credentials", action: "read" }), async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(credentialsTable)
    .orderBy(desc(credentialsTable.createdAt));
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

  const [row] = await db
    .insert(credentialsTable)
    .values({
      name: body.name.trim(),
      connectorId: Number(body.connectorId),
      connectorName: body.connectorName.trim(),
      fields: body.fields ?? [],
    })
    .returning();
  res.status(201).json(serializeCredential(row));
});

router.delete("/credentials/:id", authorize({ resource: "credentials", action: "write" }), async (req, res): Promise<void> => {
  const id = String(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "Invalid credential id" });
    return;
  }
  await db.delete(credentialsTable).where(eq(credentialsTable.id, id));
  res.status(204).end();
});

export default router;
