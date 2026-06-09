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

function syntheticOutput(nodeTypeId: string, config: Record<string, unknown>): Record<string, unknown> {
  const t = nodeTypeId ?? "";
  if (t.startsWith("trigger.")) return { triggeredAt: new Date().toISOString(), payload: { source: "flowcraft", version: "1.0" }, headers: { "content-type": "application/json" } };
  if (t === "action.http") return { statusCode: 200, headers: { "content-type": "application/json" }, body: { success: true, data: { id: 42, name: "example" } }, durationMs: 312 };
  if (t === "action.send_email") return { messageId: `msg_${Math.random().toString(36).slice(2)}`, accepted: [config.to ?? "user@example.com"], rejected: [], envelope: { from: "no-reply@flowcraft.io" } };
  if (t === "action.slack") return { ok: true, channel: config.channel ?? "#general", ts: "1234567890.000200", message: { text: config.message ?? "Hello!" } };
  if (t === "action.db_query") return { rowCount: 3, rows: [{ id: 1, name: "Alice" }, { id: 2, name: "Bob" }, { id: 3, name: "Carol" }], command: "SELECT" };
  if (t === "action.spreadsheet") return { updatedRange: "Sheet1!A2:E2", updatedRows: 1, updatedColumns: 5, updatedCells: 5 };
  if (t === "action.create_record") return { id: `rec_${Math.random().toString(36).slice(2)}`, object: config.object_type ?? "Contact", created: true, fields: config.fields ?? {} };
  if (t === "logic.if") return { branch: Math.random() > 0.5 ? "true" : "false", condition: config.field ?? "value", evaluated: true };
  if (t === "logic.filter") return { passed: true, itemsIn: 5, itemsOut: 3 };
  if (t === "logic.router") return { routesDispatched: Number(config.routes ?? 2), items: [{ route: 0 }, { route: 1 }] };
  if (t === "logic.loop") return { iterations: 4, currentIndex: 3, item: { id: 4, value: "last-item" } };
  if (t === "logic.delay") return { delayedMs: Number(config.duration ?? 5) * 1000, resumedAt: new Date().toISOString() };
  if (t === "logic.merge") return { merged: true, inputCount: 2, outputItems: 6 };
  if (t === "logic.sub_workflow") return { subWorkflowId: config.workflow_id ?? 0, status: "success", output: { result: "completed" } };
  if (t === "ai.llm") return { model: config.model ?? "gpt-4o-mini", content: "Based on the input provided, here is a comprehensive analysis:\n\n1. The data shows a clear upward trend\n2. Key metrics are within expected ranges\n3. Recommendation: proceed with next steps", promptTokens: 142, completionTokens: 87, totalTokens: 229 };
  if (t === "ai.classify") return { category: (config.categories as string ?? "Billing,Technical").split(",")[0].trim(), confidence: 0.94, scores: { "Billing": 0.94, "Technical": 0.04, "Other": 0.02 } };
  if (t === "ai.summarize") return { summary: "The document discusses quarterly performance metrics showing a 15% growth in key areas. Main takeaways include improved efficiency and customer satisfaction scores.", wordCount: 42 };
  if (t === "ai.extract") return { extracted: { name: "John Smith", amount: 1250.00, date: "2026-06-09", currency: "USD" }, confidence: 0.97 };
  if (t === "ai.agent") return { goal: config.goal ?? "task", steps: 4, result: { status: "completed", data: { found: true, summary: "Task completed successfully" } } };
  if (t === "ai.scraper") return { url: config.url ?? "https://example.com", items: [{ title: "Product A", price: "$29.99" }, { title: "Product B", price: "$49.99" }], scrapedAt: new Date().toISOString() };
  if (t === "data.transform") return { transformed: true, inputFields: 5, outputFields: 3, result: { fullName: "John Smith", email: "j.smith@example.com", score: 95 } };
  if (t === "data.code") return { result: [{ id: 1, processed: true }, { id: 2, processed: true }], executionTimeMs: 8, console: [] };
  if (t === "data.parse_doc") return { pages: 4, text: "Contract agreement between parties...", tables: [{ rows: 5, cols: 3, data: [[]] }], metadata: { author: "Legal Team" } };
  if (t === "data.store_get") return { key: config.key ?? "variable", value: 42, found: true };
  if (t === "data.store_set") return { key: config.key ?? "variable", value: config.value ?? null, written: true };
  if (t === "data.note") return { skipped: true, reason: "Sticky note — no execution" };
  return { ok: true };
}

function syntheticInput(index: number, prevOutput: Record<string, unknown> | null): Record<string, unknown> {
  if (index === 0) return {};
  return prevOutput ?? { data: { id: 1, processed: true } };
}

function nodeDuration(nodeTypeId: string): number {
  const t = nodeTypeId ?? "";
  if (t.startsWith("trigger.")) return Math.floor(Math.random() * 30) + 10;
  if (t.startsWith("ai.")) return Math.floor(Math.random() * 1800) + 400;
  if (t === "action.http") return Math.floor(Math.random() * 500) + 100;
  if (t === "logic.delay") return Math.floor(Math.random() * 200) + 50;
  return Math.floor(Math.random() * 150) + 20;
}

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

  const nodes: Array<{ id: string; name: string; nodeTypeId?: string; type?: string; config?: Record<string, unknown> }> =
    Array.isArray(workflow.nodes) ? (workflow.nodes as any[]) : [];

  const startedAt = new Date();
  const success = Math.random() > 0.15;
  const failAtIndex = success ? -1 : Math.floor(Math.random() * Math.max(nodes.length, 1)) + (nodes.length > 1 ? 1 : 0);

  let cursor = startedAt.getTime();
  let prevOutput: Record<string, unknown> | null = null;
  const steps: object[] = [];

  for (let i = 0; i < Math.max(nodes.length, 1); i++) {
    const node = nodes[i] ?? { id: `node-${i + 1}`, name: i === 0 ? "Trigger" : "Step " + (i + 1), nodeTypeId: i === 0 ? "trigger.manual" : "action.http", config: {} };
    const nodeTypeId: string = (node.nodeTypeId ?? node.type ?? "action.http") as string;
    const config = (node.config ?? {}) as Record<string, unknown>;
    const dur = nodeDuration(nodeTypeId);
    const stepFailed = !success && i === failAtIndex;
    const stepStatus = stepFailed ? "failed" : "success";
    const stepStart = new Date(cursor);
    const stepEnd = new Date(cursor + dur);
    cursor += dur;

    const output = stepFailed ? null : syntheticOutput(nodeTypeId, config);
    const input = syntheticInput(i, prevOutput);
    if (!stepFailed) prevOutput = output;

    steps.push({
      id: i + 1,
      nodeId: node.id,
      nodeName: node.name,
      nodeType: nodeTypeId,
      status: stepStatus,
      startedAt: stepStart.toISOString(),
      finishedAt: stepEnd.toISOString(),
      durationMs: dur,
      inputData: input,
      outputData: output,
      errorMessage: stepFailed ? `Step failed: ${stepStatus === "failed" ? "Connection timeout" : "Unknown error"} in ${node.name}` : null,
      itemCount: output && "rows" in output ? (output as any).rowCount : output && "items" in output ? (output as any).items?.length ?? 1 : 1,
    });

    if (stepFailed) break;
  }

  const durationMs = cursor - startedAt.getTime();
  const finishedAt = new Date(cursor);
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
      errorMessage: success ? null : `Step failed: Connection timeout in ${nodes[failAtIndex]?.name ?? "Step"}`,
      steps,
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

