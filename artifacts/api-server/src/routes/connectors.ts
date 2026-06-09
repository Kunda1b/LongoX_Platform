import { Router, type IRouter } from "express";
import { eq, like, and, sql } from "drizzle-orm";
import { db, connectorsTable } from "@workspace/db";
import {
  ListConnectorsQueryParams,
  GetConnectorParams,
  InstallConnectorParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function serializeConnector(c: typeof connectorsTable.$inferSelect) {
  return {
    id: c.id,
    name: c.name,
    category: c.category,
    description: c.description,
    icon: c.icon,
    color: c.color ?? null,
    isInstalled: c.isInstalled,
    isFeatured: c.isFeatured,
    actionCount: c.actionCount,
    triggerCount: c.triggerCount,
    installCount: c.installCount,
    rating: c.rating ?? null,
    author: c.author ?? null,
  };
}

router.get("/connectors/categories", async (_req, res): Promise<void> => {
  const rows = await db
    .select({ category: connectorsTable.category })
    .from(connectorsTable);

  const counts: Record<string, number> = {};
  for (const row of rows) {
    counts[row.category] = (counts[row.category] ?? 0) + 1;
  }

  res.json(Object.entries(counts).map(([name, count]) => ({ name, count })));
});

router.get("/connectors", async (req, res): Promise<void> => {
  const params = ListConnectorsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const conditions = [];
  if (params.data.category) {
    conditions.push(eq(connectorsTable.category, params.data.category));
  }
  if (params.data.search) {
    conditions.push(like(connectorsTable.name, `%${params.data.search}%`));
  }
  if (params.data.installed !== undefined) {
    conditions.push(eq(connectorsTable.isInstalled, params.data.installed));
  }

  const connectors = await db
    .select()
    .from(connectorsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(connectorsTable.isFeatured, connectorsTable.name);

  res.json(connectors.map(serializeConnector));
});

router.get("/connectors/:id", async (req, res): Promise<void> => {
  const params = GetConnectorParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [connector] = await db
    .select()
    .from(connectorsTable)
    .where(eq(connectorsTable.id, params.data.id));

  if (!connector) {
    res.status(404).json({ error: "Connector not found" });
    return;
  }

  res.json(serializeConnector(connector));
});

router.post("/connectors/:id/install", async (req, res): Promise<void> => {
  const params = InstallConnectorParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [connector] = await db
    .update(connectorsTable)
    .set({
      isInstalled: true,
      installCount: sql`${connectorsTable.installCount} + 1`,
    })
    .where(eq(connectorsTable.id, params.data.id))
    .returning();

  if (!connector) {
    res.status(404).json({ error: "Connector not found" });
    return;
  }

  res.json(serializeConnector(connector));
});

export default router;
