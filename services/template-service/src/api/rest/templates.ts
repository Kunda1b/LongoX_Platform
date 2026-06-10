import { Router, type IRouter } from "express";
import { eq, like, and as andOp, or, desc, sql } from "drizzle-orm";
import { db, templatesTable, templateVersionsTable } from "@autoflow/db";

const router: IRouter = Router();

function serialize(t: typeof templatesTable.$inferSelect) {
  return {
    id: t.id,
    name: t.name,
    description: t.description,
    category: t.category,
    tags: t.tags,
    triggerType: t.triggerType,
    nodeCount: t.nodeCount,
    uses: t.uses,
    complexity: t.complexity,
    isCustom: t.isCustom,
    templateType: t.templateType,
    metadata: t.metadata,
    nodes: t.nodes,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
}

router.get("/templates", async (req, res): Promise<void> => {
  const conditions = [];
  const { category, search, type } = req.query as Record<string, string | undefined>;

  if (category) conditions.push(eq(templatesTable.category, category));
  if (search) conditions.push(
    or(like(templatesTable.name, `%${search}%`), like(templatesTable.description, `%${search}%`)),
  );
  if (type) conditions.push(eq(templatesTable.templateType, type));

  const rows = await db.select().from(templatesTable)
    .where(conditions.length ? andOp(...conditions) : undefined)
    .orderBy(desc(templatesTable.uses));

  res.json(rows.map(serialize));
});

router.get("/templates/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [row] = await db.select().from(templatesTable).where(eq(templatesTable.id, id)).limit(1);
  if (!row) { res.status(404).json({ error: "Template not found" }); return; }

  res.json(serialize(row));
});

router.post("/templates", async (req, res): Promise<void> => {
  const { name, description, category, tags, nodes, templateType, complexity, triggerType, metadata } = req.body as Record<string, unknown>;

  if (!name) { res.status(400).json({ error: "name is required" }); return; }

  const [row] = await db.insert(templatesTable).values({
    name: String(name),
    description: description ? String(description) : null,
    category: String(category ?? "general"),
    tags: (tags ?? []) as string[],
    nodes: (nodes ?? []) as any[],
    templateType: String(templateType ?? "workflow"),
    complexity: String(complexity ?? "beginner"),
    triggerType: String(triggerType ?? "manual"),
    nodeCount: Array.isArray(nodes) ? nodes.length : 0,
    isCustom: true,
    metadata: (metadata ?? {}) as Record<string, unknown>,
  }).returning();

  res.status(201).json(serialize(row));
});

router.post("/templates/:id/use", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [row] = await db.update(templatesTable)
    .set({ uses: sql`${templatesTable.uses} + 1` })
    .where(eq(templatesTable.id, id))
    .returning();

  if (!row) { res.status(404).json({ error: "Template not found" }); return; }
  res.json(serialize(row));
});

router.get("/templates/:id/versions", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const versions = await db.select().from(templateVersionsTable)
    .where(eq(templateVersionsTable.templateId, id))
    .orderBy(desc(templateVersionsTable.version));

  res.json(versions);
});

router.post("/templates/:id/fork", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [original] = await db.select().from(templatesTable).where(eq(templatesTable.id, id)).limit(1);
  if (!original) { res.status(404).json({ error: "Template not found" }); return; }

  const [forked] = await db.insert(templatesTable).values({
    name: `${original.name} (Fork)`,
    description: original.description,
    category: original.category,
    tags: original.tags,
    nodes: original.nodes as any[],
    templateType: original.templateType,
    complexity: original.complexity,
    triggerType: original.triggerType,
    nodeCount: original.nodeCount,
    isCustom: true,
    metadata: { ...(original.metadata as any ?? {}), forkedFrom: id },
  }).returning();

  res.status(201).json(serialize(forked));
});

export default router;
