import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, executionsTable, executionCheckpointsTable, workflowsTable } from "@workspace/db";
import {
  ListExecutionsQueryParams,
  GetExecutionParams,
} from "@workspace/api-zod";
import { startWorkflowExecution, writeAudit } from "../engine/workflow-runner";

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
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const conditions = [];
  if (params.data.workflowId) conditions.push(eq(executionsTable.workflowId, params.data.workflowId));
  if (params.data.status) conditions.push(eq(executionsTable.status, params.data.status));

  const limit = params.data.limit ?? 50;

  const executions = await db.select().from(executionsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(executionsTable.startedAt))
    .limit(limit);

  res.json(executions.map(serializeExecution));
});

router.get("/executions/:id", async (req, res): Promise<void> => {
  const params = GetExecutionParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [execution] = await db.select().from(executionsTable).where(eq(executionsTable.id, params.data.id));
  if (!execution) { res.status(404).json({ error: "Execution not found" }); return; }

  // Fetch real checkpoints; fall back to stored steps for legacy records
  const checkpoints = await db.select().from(executionCheckpointsTable)
    .where(eq(executionCheckpointsTable.executionId, params.data.id))
    .orderBy(executionCheckpointsTable.id);

  let steps;
  if (checkpoints.length > 0) {
    // Only include latest attempt per node (keep first occurrence since we order by id asc)
    const seen = new Set<string>();
    steps = checkpoints
      .filter((c) => { const key = c.nodeId; const ok = !seen.has(key); seen.add(key); return ok; })
      .map((c) => ({
        id: c.id,
        nodeId: c.nodeId,
        nodeName: c.nodeName,
        nodeType: c.nodeType,
        status: c.status,
        startedAt: c.startedAt.toISOString(),
        finishedAt: c.completedAt ? c.completedAt.toISOString() : null,
        durationMs: c.durationMs ?? null,
        inputData: c.inputData ?? {},
        outputData: c.outputData ?? null,
        errorMessage: c.errorMessage ?? null,
        itemCount: null,
      }));
  } else {
    steps = Array.isArray(execution.steps) ? execution.steps : [];
  }

  res.json({ ...serializeExecution(execution), steps });
});

router.post("/executions/:id/retry", async (req, res): Promise<void> => {
  const params = GetExecutionParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [original] = await db.select().from(executionsTable).where(eq(executionsTable.id, params.data.id));
  if (!original) { res.status(404).json({ error: "Execution not found" }); return; }

  const [workflow] = await db.select().from(workflowsTable).where(eq(workflowsTable.id, original.workflowId));
  if (!workflow) { res.status(404).json({ error: "Workflow not found" }); return; }

  const nodes: any[] = Array.isArray(workflow.nodes) ? (workflow.nodes as any[]) : [];
  const executionNodes = nodes.length > 0 ? nodes : [
    { id: "node-1", name: "Manual Trigger", nodeTypeId: "trigger.manual", position: { x: 0, y: 0 }, config: {} },
    { id: "node-2", name: "HTTP Request", nodeTypeId: "action.http", position: { x: 300, y: 0 }, config: {} },
  ];

  const execution = await startWorkflowExecution(workflow.id, workflow.name, executionNodes, "manual", { _retriedFrom: original.id });

  await writeAudit("execution.retried", "execution", String(execution.id), { originalExecutionId: original.id, workflowId: workflow.id }, "user");

  res.status(202).json(serializeExecution(execution));
});

export default router;
