import { Router, type IRouter } from "express";
import { eq, like, and, desc } from "drizzle-orm";
import {
  db,
  workflowsTable,
  workflowVersionsTable,
  workflowPromotionsTable,
} from "@longox/db";
import {
  ListWorkflowsQueryParams,
  CreateWorkflowBody,
  GetWorkflowParams,
  UpdateWorkflowParams,
  UpdateWorkflowBody,
  DeleteWorkflowParams,
  ToggleWorkflowParams,
  RunWorkflowParams,
} from "@longox/api-zod";
import {
  startWorkflowExecution,
  writeAudit,
} from "@longox/execution-service/workflow-runner";
import { authorize } from "@longox/shared-rbac";
import { publishWorkflow } from "../../application/commands/publish-workflow.command";

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

router.get("/workflows", authorize({ resource: "workflows", action: "read" }), async (req, res): Promise<void> => {
  const params = ListWorkflowsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const conditions = [];
  if (params.data.status)
    conditions.push(eq(workflowsTable.status, params.data.status));
  if (params.data.search)
    conditions.push(like(workflowsTable.name, `%${params.data.search}%`));

  const workflows = await db
    .select()
    .from(workflowsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(workflowsTable.updatedAt);

  res.json(workflows.map(serializeWorkflow));
});

router.post("/workflows", authorize({ resource: "workflows", action: "write" }), async (req, res): Promise<void> => {
  const parsed = CreateWorkflowBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { nodes, ...rest } = parsed.data;
  const nodeCount = nodes ? nodes.length : 0;

  const [workflow] = await db
    .insert(workflowsTable)
    .values({ ...rest, nodes: nodes ?? null, nodeCount } as any)
    .returning();

  await writeAudit(
    "workflow.created",
    "workflow",
    String(workflow.id),
    { name: workflow.name, triggerType: workflow.triggerType },
    "user",
  );
  res.status(201).json(serializeWorkflow(workflow));
});

router.get("/workflows/:id", authorize({ resource: "workflows", action: "read" }), async (req, res): Promise<void> => {
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
  res.json(serializeWorkflow(workflow));
});

router.patch("/workflows/:id", authorize({ resource: "workflows", action: "write" }), async (req, res): Promise<void> => {
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

  // Save a version snapshot when nodes are updated
  if (nodes !== undefined && nodes.length > 0) {
    const existing = await db
      .select({ version: workflowVersionsTable.version })
      .from(workflowVersionsTable)
      .where(eq(workflowVersionsTable.workflowId, params.data.id))
      .orderBy(desc(workflowVersionsTable.version))
      .limit(1);
    const nextVersion = (existing[0]?.version ?? 0) + 1;
    await db.insert(workflowVersionsTable).values({
      workflowId: params.data.id,
      version: nextVersion,
      name: workflow.name,
      nodes,
      changeNote: "Manual save",
    });
  }

  await writeAudit(
    "workflow.updated",
    "workflow",
    String(workflow.id),
    { name: workflow.name },
    "user",
  );
  res.json(serializeWorkflow(workflow));
});

router.delete("/workflows/:id", authorize({ resource: "workflows", action: "delete" }), async (req, res): Promise<void> => {
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

  await writeAudit(
    "workflow.deleted",
    "workflow",
    String(workflow.id),
    { name: workflow.name },
    "user",
  );
  res.sendStatus(204);
});

router.post("/workflows/:id/toggle", authorize({ resource: "workflows", action: "write" }), async (req, res): Promise<void> => {
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

  await writeAudit(
    `workflow.${newStatus}`,
    "workflow",
    String(workflow.id),
    { previousStatus: existing.status },
    "user",
  );
  res.json(serializeWorkflow(workflow));
});

router.post("/workflows/:id/run", authorize({ resource: "workflows", action: "run" }), async (req, res): Promise<void> => {
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

  const nodes: any[] = Array.isArray(workflow.nodes)
    ? (workflow.nodes as any[])
    : [];

  if (nodes.length === 0) {
    res.status(422).json({
      error: "Workflow has no nodes",
      message: "Add at least one trigger node to this workflow before running it.",
    });
    return;
  }

  const execution = await startWorkflowExecution(
    workflow.id,
    workflow.name,
    nodes,
    "manual",
    { _source: "manual" },
  );

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

router.post("/workflows/:id/publish", authorize({ resource: "workflows", action: "write" }), async (req, res): Promise<void> => {
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

  const changeNote =
    (req.body as { changeNote?: string })?.changeNote ?? "Published";

  const rawNodes = workflow.nodes as any;
  const graph = {
    nodes: Array.isArray(rawNodes) ? rawNodes : Array.isArray(rawNodes?.nodes) ? rawNodes.nodes : [],
    edges: Array.isArray(rawNodes?.edges) ? rawNodes.edges : [],
  };

  try {
    const result = await publishWorkflow({
      workflowId: params.data.id,
      tenantId: req.user!.tenantId ?? "",
      graph,
      changeNote,
      publishedBy: req.user!.name,
    });

    await writeAudit(
      "workflow.published",
      "workflow",
      String(params.data.id),
      { version: result.versionNumber, changeNote, diffId: result.diffId },
      "user",
    );

    res.status(201).json({
      id: result.versionId,
      workflowId: params.data.id,
      version: result.versionNumber,
      changeNote,
      published: true,
      diffComputed: result.diffId !== null,
      createdAt: result.publishedAt,
    });
  } catch (err: any) {
    const status = err.statusCode ?? 500;
    res.status(status).json({ error: err.message ?? "Publish failed" });
  }
});

router.post("/workflows/:id/duplicate", authorize({ resource: "workflows", action: "write" }), async (req, res): Promise<void> => {
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
    } as any)
    .returning();

  await writeAudit(
    "workflow.duplicated",
    "workflow",
    String(workflow.id),
    { sourceId: existing.id, name: workflow.name },
    "user",
  );
  res.status(201).json({
    ...serializeWorkflow(workflow),
    lastRunAt: null,
    lastRunStatus: null,
  });
});

router.get("/workflows/:id/versions", authorize({ resource: "workflows", action: "read" }), async (req, res): Promise<void> => {
  const params = GetWorkflowParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const versions = await db
    .select()
    .from(workflowVersionsTable)
    .where(eq(workflowVersionsTable.workflowId, params.data.id))
    .orderBy(desc(workflowVersionsTable.version))
    .limit(20);

  res.json(
    versions.map((v) => ({
      id: v.id,
      workflowId: v.workflowId,
      version: v.version,
      name: v.name,
      nodes: v.nodes,
      changeNote: v.changeNote ?? null,
      createdAt: v.createdAt.toISOString(),
    })),
  );
});

// ─── Workflow Promotions ──────────────────────────────────────────────────────

router.get("/workflows/:id/promotions", authorize({ resource: "workflows", action: "read" }), async (req, res): Promise<void> => {
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

  const promotions = await db
    .select()
    .from(workflowPromotionsTable)
    .where(eq(workflowPromotionsTable.workflowId, params.data.id))
    .orderBy(desc(workflowPromotionsTable.createdAt))
    .limit(20);

  res.json(
    promotions.map((p) => ({
      id: p.id,
      workflowId: p.workflowId,
      workflowName: p.workflowName,
      fromEnvironment: p.fromEnvironment,
      toEnvironment: p.toEnvironment,
      status: p.status,
      promotedBy: p.promotedBy,
      approvedBy: p.approvedBy ?? null,
      notes: p.notes ?? null,
      createdAt: p.createdAt.toISOString(),
    })),
  );
});

router.post("/workflows/:id/promotions", authorize({ resource: "workflows", action: "write" }), async (req, res): Promise<void> => {
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

  const { fromEnvironment, toEnvironment, notes } = req.body as {
    fromEnvironment?: string;
    toEnvironment?: string;
    notes?: string;
  };

  if (!fromEnvironment || !toEnvironment) {
    res
      .status(400)
      .json({ error: "fromEnvironment and toEnvironment are required" });
    return;
  }

  const [promotion] = await db
    .insert(workflowPromotionsTable)
    .values({
      workflowId: workflow.id,
      workflowName: workflow.name,
      fromEnvironment,
      toEnvironment,
      status: "promoted",
      promotedBy: "user",
      notes: notes ?? null,
    })
    .returning();

  await writeAudit(
    "workflow.promoted",
    "workflow",
    String(workflow.id),
    { fromEnvironment, toEnvironment },
    "user",
  );

  res.status(201).json({
    id: promotion.id,
    workflowId: promotion.workflowId,
    workflowName: promotion.workflowName,
    fromEnvironment: promotion.fromEnvironment,
    toEnvironment: promotion.toEnvironment,
    status: promotion.status,
    promotedBy: promotion.promotedBy,
    approvedBy: promotion.approvedBy ?? null,
    notes: promotion.notes ?? null,
    createdAt: promotion.createdAt.toISOString(),
  });
});

export default router;
