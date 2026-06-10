import { Router, type IRouter } from "express";
import { ilike, or } from "drizzle-orm";
import { db, workflowsTable, appsTable, templatesTable, connectorsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/search", async (req, res): Promise<void> => {
  const q = (req.query.q as string ?? "").trim();
  const typesParam = (req.query.types as string ?? "workflows,apps,templates,connectors");
  const types = typesParam.split(",").map((t) => t.trim());

  if (!q) { res.json({ query: q, results: [], total: 0 }); return; }

  const pattern = `%${q}%`;
  const results: Array<{ id: number; type: string; title: string; description: string | null; url: string; metadata: Record<string, unknown> | null }> = [];

  if (types.includes("workflows")) {
    const rows = await db.select().from(workflowsTable)
      .where(or(ilike(workflowsTable.name, pattern), ilike(workflowsTable.description, pattern)))
      .limit(10);
    for (const r of rows) results.push({ id: r.id, type: "workflow", title: r.name, description: r.description ?? null, url: `/workflows/${r.id}`, metadata: { status: r.status, triggerType: r.triggerType } });
  }

  if (types.includes("apps")) {
    const rows = await db.select().from(appsTable)
      .where(or(ilike(appsTable.name, pattern), ilike(appsTable.description, pattern)))
      .limit(10);
    for (const r of rows) results.push({ id: r.id, type: "app", title: r.name, description: r.description ?? null, url: `/apps/${r.id}`, metadata: { type: r.type, status: r.status } });
  }

  if (types.includes("templates")) {
    const rows = await db.select().from(templatesTable)
      .where(or(ilike(templatesTable.name, pattern), ilike(templatesTable.description, pattern)))
      .limit(10);
    for (const r of rows) results.push({ id: r.id, type: "template", title: r.name, description: r.description ?? null, url: `/templates`, metadata: { category: r.category } });
  }

  if (types.includes("connectors")) {
    const rows = await db.select().from(connectorsTable)
      .where(or(ilike(connectorsTable.name, pattern), ilike(connectorsTable.description, pattern)))
      .limit(10);
    for (const r of rows) results.push({ id: r.id, type: "connector", title: r.name, description: r.description ?? null, url: `/connectors`, metadata: { category: r.category, isInstalled: r.isInstalled } });
  }

  res.json({ query: q, results, total: results.length });
});

export default router;
