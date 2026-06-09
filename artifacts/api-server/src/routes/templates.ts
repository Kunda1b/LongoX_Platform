import { Router, type IRouter } from "express";
import { eq, like, and, sql } from "drizzle-orm";
import { db, templatesTable, workflowsTable } from "@workspace/db";
import { ListTemplatesQueryParams, GetTemplateParams } from "@workspace/api-zod";

const router: IRouter = Router();

function serializeTemplate(t: typeof templatesTable.$inferSelect) {
  return {
    id: t.id,
    name: t.name,
    description: t.description,
    category: t.category,
    triggerType: t.triggerType,
    nodeCount: t.nodeCount,
    uses: t.uses,
    complexity: t.complexity,
    tags: t.tags,
    nodes: Array.isArray(t.nodes) ? t.nodes : [],
    createdAt: t.createdAt.toISOString(),
  };
}

router.get("/templates", async (req, res): Promise<void> => {
  const params = ListTemplatesQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const conditions = [];
  if (params.data.category) {
    conditions.push(eq(templatesTable.category, params.data.category));
  }
  if (params.data.search) {
    conditions.push(like(templatesTable.name, `%${params.data.search}%`));
  }

  const templates = await db
    .select()
    .from(templatesTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(templatesTable.uses);

  res.json(templates.map(serializeTemplate));
});

router.get("/templates/:id", async (req, res): Promise<void> => {
  const params = GetTemplateParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [template] = await db
    .select()
    .from(templatesTable)
    .where(eq(templatesTable.id, params.data.id));

  if (!template) {
    res.status(404).json({ error: "Template not found" });
    return;
  }

  res.json(serializeTemplate(template));
});

router.post("/templates/:id/use", async (req, res): Promise<void> => {
  const params = GetTemplateParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [template] = await db
    .select()
    .from(templatesTable)
    .where(eq(templatesTable.id, params.data.id));

  if (!template) {
    res.status(404).json({ error: "Template not found" });
    return;
  }

  await db
    .update(templatesTable)
    .set({ uses: sql`${templatesTable.uses} + 1` })
    .where(eq(templatesTable.id, template.id));

  const nodes = Array.isArray(template.nodes) ? template.nodes : [];

  const [workflow] = await db
    .insert(workflowsTable)
    .values({
      name: `${template.name} (from template)`,
      description: template.description,
      status: "draft",
      triggerType: template.triggerType,
      nodeCount: template.nodeCount,
      executionCount: 0,
      nodes,
    })
    .returning();

  res.status(201).json({
    ...workflow,
    description: workflow.description ?? null,
    lastRunAt: workflow.lastRunAt ? workflow.lastRunAt.toISOString() : null,
    lastRunStatus: workflow.lastRunStatus ?? null,
    nodes: workflow.nodes ?? null,
    createdAt: workflow.createdAt.toISOString(),
    updatedAt: workflow.updatedAt.toISOString(),
  });
});

export default router;
