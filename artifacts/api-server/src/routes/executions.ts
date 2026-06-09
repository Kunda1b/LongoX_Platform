import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, executionsTable } from "@workspace/db";
import {
  ListExecutionsQueryParams,
  GetExecutionParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function serializeExecution(e: typeof executionsTable.$inferSelect) {
  return {
    id: e.id,
    workflowId: e.workflowId,
    workflowName: e.workflowName,
    status: e.status,
    startedAt: e.startedAt.toISOString(),
    finishedAt: e.finishedAt ? e.finishedAt.toISOString() : null,
    durationMs: e.durationMs ?? null,
    errorMessage: e.errorMessage ?? null,
  };
}

router.get("/executions", async (req, res): Promise<void> => {
  const params = ListExecutionsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const conditions = [];
  if (params.data.workflowId) {
    conditions.push(eq(executionsTable.workflowId, params.data.workflowId));
  }
  if (params.data.status) {
    conditions.push(eq(executionsTable.status, params.data.status));
  }

  const limit = params.data.limit ?? 50;

  const executions = await db
    .select()
    .from(executionsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(executionsTable.startedAt)
    .limit(limit);

  res.json(executions.map(serializeExecution));
});

router.get("/executions/:id", async (req, res): Promise<void> => {
  const params = GetExecutionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [execution] = await db
    .select()
    .from(executionsTable)
    .where(eq(executionsTable.id, params.data.id));

  if (!execution) {
    res.status(404).json({ error: "Execution not found" });
    return;
  }

  const steps = Array.isArray(execution.steps) ? execution.steps : [];

  res.json({
    ...serializeExecution(execution),
    steps,
  });
});

router.post("/executions/:id/retry", async (req, res): Promise<void> => {
  const params = GetExecutionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [original] = await db
    .select()
    .from(executionsTable)
    .where(eq(executionsTable.id, params.data.id));

  if (!original) {
    res.status(404).json({ error: "Execution not found" });
    return;
  }

  const startedAt = new Date();
  const durationMs = Math.floor(Math.random() * 2000) + 200;
  const finishedAt = new Date(startedAt.getTime() + durationMs);
  const success = Math.random() > 0.1;
  const status = success ? "success" : "failed";

  const steps = [
    { id: 1, nodeId: "node-1", nodeName: "Trigger", nodeType: "trigger.manual", status: "success", startedAt: startedAt.toISOString(), finishedAt: new Date(startedAt.getTime() + 50).toISOString(), durationMs: 50, inputData: {}, outputData: { triggered: true, retried: true }, errorMessage: null, itemCount: 1 },
    { id: 2, nodeId: "node-2", nodeName: "Process", nodeType: "action.http", status: success ? "success" : "failed", startedAt: startedAt.toISOString(), finishedAt: finishedAt.toISOString(), durationMs: durationMs - 50, inputData: { triggered: true }, outputData: success ? { status: 200, body: { ok: true } } : null, errorMessage: success ? null : "Connection timeout", itemCount: success ? 1 : null },
  ];

  const [execution] = await db
    .insert(executionsTable)
    .values({
      workflowId: original.workflowId,
      workflowName: original.workflowName,
      status,
      startedAt,
      finishedAt,
      durationMs,
      errorMessage: success ? null : "Connection timeout on retry",
      steps,
    })
    .returning();

  res.status(202).json(serializeExecution(execution));
});

export default router;

