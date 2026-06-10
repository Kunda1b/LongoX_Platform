import { Router, type IRouter } from "express";
import { eq, like, sql } from "drizzle-orm";
import { db, appsTable } from "@autoflow/db";
import {
  ListAppsQueryParams,
  CreateAppBody,
  GetAppParams,
  UpdateAppParams,
  UpdateAppBody,
  DeleteAppParams,
} from "@autoflow/api-zod";

const router: IRouter = Router();

function serializeApp(a: typeof appsTable.$inferSelect) {
  return {
    id: a.id,
    name: a.name,
    description: a.description ?? null,
    type: a.type,
    status: a.status,
    pageCount: a.pageCount,
    viewCount: a.viewCount,
    layout: a.layout ?? null,
    lastEditedAt: a.lastEditedAt.toISOString(),
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}

router.get("/apps/stats", async (_req, res): Promise<void> => {
  const apps = await db.select().from(appsTable);
  const totalApps = apps.length;
  const publishedApps = apps.filter((a) => a.status === "published").length;
  const draftApps = apps.filter((a) => a.status === "draft").length;
  const totalViews = apps.reduce((sum, a) => sum + a.viewCount, 0);

  const byTypeMap: Record<string, number> = {};
  for (const app of apps) {
    byTypeMap[app.type] = (byTypeMap[app.type] ?? 0) + 1;
  }
  const byType = Object.entries(byTypeMap).map(([type, count]) => ({ type, count }));

  res.json({ totalApps, publishedApps, draftApps, totalViews, byType });
});

router.get("/apps", async (req, res): Promise<void> => {
  const params = ListAppsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const apps = await db
    .select()
    .from(appsTable)
    .where(params.data.search ? like(appsTable.name, `%${params.data.search}%`) : undefined)
    .orderBy(appsTable.updatedAt);

  res.json(apps.map(serializeApp));
});

router.post("/apps", async (req, res): Promise<void> => {
  const parsed = CreateAppBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [app] = await db
    .insert(appsTable)
    .values({
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      type: parsed.data.type,
      layout: parsed.data.layout ?? null,
    })
    .returning();

  res.status(201).json(serializeApp(app));
});

router.get("/apps/:id", async (req, res): Promise<void> => {
  const params = GetAppParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [app] = await db
    .select()
    .from(appsTable)
    .where(eq(appsTable.id, params.data.id));

  if (!app) {
    res.status(404).json({ error: "App not found" });
    return;
  }

  res.json(serializeApp(app));
});

router.patch("/apps/:id", async (req, res): Promise<void> => {
  const params = UpdateAppParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateAppBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [app] = await db
    .update(appsTable)
    .set({ ...parsed.data, lastEditedAt: new Date() })
    .where(eq(appsTable.id, params.data.id))
    .returning();

  if (!app) {
    res.status(404).json({ error: "App not found" });
    return;
  }

  res.json(serializeApp(app));
});

router.delete("/apps/:id", async (req, res): Promise<void> => {
  const params = DeleteAppParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [app] = await db
    .delete(appsTable)
    .where(eq(appsTable.id, params.data.id))
    .returning();

  if (!app) {
    res.status(404).json({ error: "App not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
