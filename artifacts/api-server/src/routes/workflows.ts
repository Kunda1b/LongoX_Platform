import { Router, type IRouter } from "express";
import { eq, like, and, desc } from "drizzle-orm";
import { db, workflowsTable, workflowVersionsTable } from "@workspace/db";
import {
  ListWorkflowsQueryParams,
  CreateWorkflowBody,
  GetWorkflowParams,
  UpdateWorkflowParams,
  UpdateWorkflowBody,
  DeleteWorkflowParams,
  ToggleWorkflowParams,
  RunWorkflowParams,
} from "@workspace/api-zod";
import { startWorkflowExecution, writeAudit } from "../engine/workflow-runner";

const router: IRouter = Router();

function serializeWorkflow(w: typeof workflowsTable.$inferSelect) {
  return {
    ...w,
    description: w.description ?? null,
    lastRunAt: w.lastRunAt ? w.lastRunAt.toISOString() : null,
    lastRunStatus: w.lastRunStatus ?? null,
    nodes: w.nodes ?? null,
    createdAt: w.createdAt.toISOString(),
    updatedAt: w.updatedAt.toISOString(),
  };
}

router.get("/workflows", async (req, res): Promise<void> => {
  const params = ListWorkflowsQueryParams.safeParse(req.query);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const conditions = [];
  if (params.data.status) conditions.push(eq(workflowsTable.status, params.data.status));
  if (params.data.search) conditions.push(like(workflowsTable.name, `%${params.data.search}%`));

  const workflows = await db
    .select().from(workflowsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(workflowsTable.updatedAt);

  res.json(workflows.map(serializeWorkflow));
});

router.post("/workflows", async (req, res): Promise<void> => {
  const parsed = CreateWorkflowBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { nodes, ...rest } = parsed.data;
  const nodeCount = nodes ? nodes.length : 0;

  const [workflow] = await db.insert(workflowsTable).values({ ...rest, nodes: nodes ?? null, nodeCount }).returning();

  await writeAudit("workflow.created", "workflow", String(workflow.id), { name: workflow.name, triggerType: workflow.triggerType }, "user");
  res.status(201).json(serializeWorkflow(workflow));
});

router.get("/workflows/:id", async (req, res): Promise<void> => {
  const params = GetWorkflowParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [workflow] = await db.select().from(workflowsTable).where(eq(workflowsTable.id, params.data.id));
  if (!workflow) { res.status(404).json({ error: "Workflow not found" }); return; }
  res.json(serializeWorkflow(workflow));
});

router.patch("/workflows/:id", async (req, res): Promise<void> => {
  const params = UpdateWorkflowParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const parsed = UpdateWorkflowBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { nodes, ...rest } = parsed.data;
  const updates: Record<string, unknown> = { ...rest };
  if (nodes !== undefined) { updates.nodes = nodes; updates.nodeCount = nodes.length; }

  const [workflow] = await db.update(workflowsTable).set(updates).where(eq(workflowsTable.id, params.data.id)).returning();
  if (!workflow) { res.status(404).json({ error: "Workflow not found" }); return; }

  // Save a version snapshot when nodes are updated
  if (nodes !== undefined && nodes.length > 0) {
    const existing = await db.select({ version: workflowVersionsTable.version })
      .from(workflowVersionsTable)
      .where(eq(workflowVersionsTable.workflowId, params.data.id))
      .orderBy(desc(workflowVersionsTable.version)).limit(1);
    const nextVersion = (existing[0]?.version ?? 0) + 1;
    await db.insert(workflowVersionsTable).values({
      workflowId: params.data.id,
      version: nextVersion,
      name: workflow.name,
      nodes,
      changeNote: "Manual save",
    });
  }

  await writeAudit("workflow.updated", "workflow", String(workflow.id), { name: workflow.name }, "user");
  res.json(serializeWorkflow(workflow));
});

router.delete("/workflows/:id", async (req, res): Promise<void> => {
  const params = DeleteWorkflowParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [workflow] = await db.delete(workflowsTable).where(eq(workflowsTable.id, params.data.id)).returning();
  if (!workflow) { res.status(404).json({ error: "Workflow not found" }); return; }

  await writeAudit("workflow.deleted", "workflow", String(workflow.id), { name: workflow.name }, "user");
  res.sendStatus(204);
});

router.post("/workflows/:id/toggle", async (req, res): Promise<void> => {
  const params = ToggleWorkflowParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [existing] = await db.select().from(workflowsTable).where(eq(workflowsTable.id, params.data.id));
  if (!existing) { res.status(404).json({ error: "Workflow not found" }); return; }

  const newStatus = existing.status === "active" ? "inactive" : "active";
  const [workflow] = await db.update(workflowsTable).set({ status: newStatus }).where(eq(workflowsTable.id, params.data.id)).returning();

  await writeAudit(`workflow.${newStatus}`, "workflow", String(workflow.id), { previousStatus: existing.status }, "user");
  res.json(serializeWorkflow(workflow));
});

router.post("/workflows/:id/run", async (req, res): Promise<void> => {
  const params = RunWorkflowParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [workflow] = await db.select().from(workflowsTable).where(eq(workflowsTable.id, params.data.id));
  if (!workflow) { res.status(404).json({ error: "Workflow not found" }); return; }

  const nodes: any[] = Array.isArray(workflow.nodes) ? (workflow.nodes as any[]) : [];

  // Use at least one placeholder node so empty workflows still produce a step
  const executionNodes = nodes.length > 0 ? nodes : [
    { id: "node-1", name: "Manual Trigger", nodeTypeId: "trigger.manual", position: { x: 0, y: 0 }, config: {} },
    { id: "node-2", name: "HTTP Request", nodeTypeId: "action.http", position: { x: 300, y: 0 }, config: { url: "https://api.example.com/data" } },
  ];

  const execution = await startWorkflowExecution(workflow.id, workflow.name, executionNodes, "manual", { _source: "manual" });

  res.status(202).json({
    id: execution.id,
    workflowId: execution.workflowId,
    workflowName: execution.workflowName,
    status: execution.status,
    startedAt: execution.startedAt.toISOString(),
    finishedAt: null,
    durationMs: null,
    errorMessage: null,
  });
});

router.post("/workflows/:id/publish", async (req, res): Promise<void> => {
  const params = GetWorkflowParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [workflow] = await db.select().from(workflowsTable).where(eq(workflowsTable.id, params.data.id));
  if (!workflow) { res.status(404).json({ error: "Workflow not found" }); return; }

  const changeNote = (req.body as { changeNote?: string })?.changeNote ?? "Published";

  const existing = await db.select({ version: workflowVersionsTable.version })
    .from(workflowVersionsTable)
    .where(eq(workflowVersionsTable.workflowId, params.data.id))
    .orderBy(desc(workflowVersionsTable.version)).limit(1);
  const nextVersion = (existing[0]?.version ?? 0) + 1;

  const [version] = await db.insert(workflowVersionsTable).values({
    workflowId: params.data.id,
    version: nextVersion,
    name: workflow.name,
    nodes: (workflow.nodes ?? []) as Parameters<typeof db.insert>[0],
    changeNote,
    published: true,
  }).returning();

  await db.update(workflowsTable).set({ status: "active" }).where(eq(workflowsTable.id, params.data.id));

  await writeAudit("workflow.published", "workflow", String(workflow.id), { version: nextVersion, changeNote }, "user");

  res.status(201).json({
    id: version.id,
    workflowId: version.workflowId,
    version: version.version,
    name: version.name,
    nodes: version.nodes,
    changeNote: version.changeNote ?? null,
    published: version.published,
    createdAt: version.createdAt.toISOString(),
  });
});

router.post("/workflows/:id/duplicate", async (req, res): Promise<void> => {
  const params = GetWorkflowParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [existing] = await db.select().from(workflowsTable).where(eq(workflowsTable.id, params.data.id));
  if (!existing) { res.status(404).json({ error: "Workflow not found" }); return; }

  const [workflow] = await db.insert(workflowsTable).values({
    name: `${existing.name} (copy)`,
    description: existing.description,
    status: "draft",
    triggerType: existing.triggerType,
    nodeCount: existing.nodeCount,
    executionCount: 0,
    nodes: existing.nodes,
  }).returning();

  await writeAudit("workflow.duplicated", "workflow", String(workflow.id), { sourceId: existing.id, name: workflow.name }, "user");
  res.status(201).json({ ...serializeWorkflow(workflow), lastRunAt: null, lastRunStatus: null });
});

router.get("/workflows/:id/versions", async (req, res): Promise<void> => {
  const params = GetWorkflowParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const versions = await db.select().from(workflowVersionsTable)
    .where(eq(workflowVersionsTable.workflowId, params.data.id))
    .orderBy(desc(workflowVersionsTable.version))
    .limit(20);

  res.json(versions.map((v) => ({
    id: v.id,
    workflowId: v.workflowId,
    version: v.version,
    name: v.name,
    nodes: v.nodes,
    changeNote: v.changeNote ?? null,
    createdAt: v.createdAt.toISOString(),
  })));
});

export default router;
