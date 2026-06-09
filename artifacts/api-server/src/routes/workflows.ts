import { Router, type IRouter } from "express";
import { eq, like, and, sql } from "drizzle-orm";
import { db, workflowsTable, executionsTable } from "@workspace/db";
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

const router: IRouter = Router();

router.get("/workflows", async (req, res): Promise<void> => {
  const params = ListWorkflowsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const conditions = [];
  if (params.data.status) {
    conditions.push(eq(workflowsTable.status, params.data.status));
  }
  if (params.data.search) {
    conditions.push(like(workflowsTable.name, `%${params.data.search}%`));
  }

  const workflows = await db
    .select()
    .from(workflowsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(workflowsTable.updatedAt);

  res.json(workflows.map((w) => ({
    ...w,
    description: w.description ?? null,
    lastRunAt: w.lastRunAt ? w.lastRunAt.toISOString() : null,
    lastRunStatus: w.lastRunStatus ?? null,
    nodes: w.nodes ?? null,
    createdAt: w.createdAt.toISOString(),
    updatedAt: w.updatedAt.toISOString(),
  })));
});

router.post("/workflows", async (req, res): Promise<void> => {
  const parsed = CreateWorkflowBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { nodes, ...rest } = parsed.data;
  const nodeCount = nodes ? nodes.length : 0;

  const [workflow] = await db
    .insert(workflowsTable)
    .values({ ...rest, nodes: nodes ?? null, nodeCount })
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

router.get("/workflows/:id", async (req, res): Promise<void> => {
  const params = GetWorkflowParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [workflow] = await db
    .select()
    .from(workflowsTable)
    .where(eq(workflowsTable.id, params.data.id));

  if (!workflow) {
    res.status(404).json({ error: "Workflow not found" });
    return;
  }

  res.json({
    ...workflow,
    description: workflow.description ?? null,
    lastRunAt: workflow.lastRunAt ? workflow.lastRunAt.toISOString() : null,
    lastRunStatus: workflow.lastRunStatus ?? null,
    nodes: workflow.nodes ?? null,
    createdAt: workflow.createdAt.toISOString(),
    updatedAt: workflow.updatedAt.toISOString(),
  });
});

router.patch("/workflows/:id", async (req, res): Promise<void> => {
  const params = UpdateWorkflowParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateWorkflowBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { nodes, ...rest } = parsed.data;
  const updates: Record<string, unknown> = { ...rest };
  if (nodes !== undefined) {
    updates.nodes = nodes;
    updates.nodeCount = nodes.length;
  }

  const [workflow] = await db
    .update(workflowsTable)
    .set(updates)
    .where(eq(workflowsTable.id, params.data.id))
    .returning();

  if (!workflow) {
    res.status(404).json({ error: "Workflow not found" });
    return;
  }

  res.json({
    ...workflow,
    description: workflow.description ?? null,
    lastRunAt: workflow.lastRunAt ? workflow.lastRunAt.toISOString() : null,
    lastRunStatus: workflow.lastRunStatus ?? null,
    nodes: workflow.nodes ?? null,
    createdAt: workflow.createdAt.toISOString(),
    updatedAt: workflow.updatedAt.toISOString(),
  });
});

router.delete("/workflows/:id", async (req, res): Promise<void> => {
  const params = DeleteWorkflowParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [workflow] = await db
    .delete(workflowsTable)
    .where(eq(workflowsTable.id, params.data.id))
    .returning();

  if (!workflow) {
    res.status(404).json({ error: "Workflow not found" });
    return;
  }

  res.sendStatus(204);
});

router.post("/workflows/:id/toggle", async (req, res): Promise<void> => {
  const params = ToggleWorkflowParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(workflowsTable)
    .where(eq(workflowsTable.id, params.data.id));

  if (!existing) {
    res.status(404).json({ error: "Workflow not found" });
    return;
  }

  const newStatus = existing.status === "active" ? "inactive" : "active";

  const [workflow] = await db
    .update(workflowsTable)
    .set({ status: newStatus })
    .where(eq(workflowsTable.id, params.data.id))
    .returning();

  res.json({
    ...workflow,
    description: workflow.description ?? null,
    lastRunAt: workflow.lastRunAt ? workflow.lastRunAt.toISOString() : null,
    lastRunStatus: workflow.lastRunStatus ?? null,
    nodes: workflow.nodes ?? null,
    createdAt: workflow.createdAt.toISOString(),
    updatedAt: workflow.updatedAt.toISOString(),
  });
});

router.post("/workflows/:id/run", async (req, res): Promise<void> => {
  const params = RunWorkflowParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [workflow] = await db
    .select()
    .from(workflowsTable)
    .where(eq(workflowsTable.id, params.data.id));

  if (!workflow) {
    res.status(404).json({ error: "Workflow not found" });
    return;
  }

  const startedAt = new Date();
  const durationMs = Math.floor(Math.random() * 2000) + 200;
  const finishedAt = new Date(startedAt.getTime() + durationMs);
  const success = Math.random() > 0.15;
  const status = success ? "success" : "failed";

  const [execution] = await db
    .insert(executionsTable)
    .values({
      workflowId: workflow.id,
      workflowName: workflow.name,
      status,
      startedAt,
      finishedAt,
      durationMs,
      errorMessage: success ? null : "Connection timeout on step 3",
      steps: [],
    })
    .returning();

  await db
    .update(workflowsTable)
    .set({
      executionCount: sql`${workflowsTable.executionCount} + 1`,
      lastRunAt: startedAt,
      lastRunStatus: status,
    })
    .where(eq(workflowsTable.id, workflow.id));

  res.status(202).json({
    id: execution.id,
    workflowId: execution.workflowId,
    workflowName: execution.workflowName,
    status: execution.status,
    startedAt: execution.startedAt.toISOString(),
    finishedAt: execution.finishedAt ? execution.finishedAt.toISOString() : null,
    durationMs: execution.durationMs ?? null,
    errorMessage: execution.errorMessage ?? null,
  });
});

router.post("/workflows/:id/duplicate", async (req, res): Promise<void> => {
  const params = GetWorkflowParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(workflowsTable)
    .where(eq(workflowsTable.id, params.data.id));

  if (!existing) {
    res.status(404).json({ error: "Workflow not found" });
    return;
  }

  const [workflow] = await db
    .insert(workflowsTable)
    .values({
      name: `${existing.name} (copy)`,
      description: existing.description,
      status: "draft",
      triggerType: existing.triggerType,
      nodeCount: existing.nodeCount,
      executionCount: 0,
      nodes: existing.nodes,
    })
    .returning();

  res.status(201).json({
    ...workflow,
    description: workflow.description ?? null,
    lastRunAt: null,
    lastRunStatus: null,
    nodes: workflow.nodes ?? null,
    createdAt: workflow.createdAt.toISOString(),
    updatedAt: workflow.updatedAt.toISOString(),
  });
});

export default router;

