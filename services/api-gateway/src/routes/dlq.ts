import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import {
  db,
  dlqEntriesTable,
  executionsTable,
  workflowsTable,
} from "@longox/db";
import { startWorkflowExecution, writeAudit } from "@longox/execution-service/workflow-runner";
import { authorize, requireTenantContext } from "@longox/shared-rbac";

const router: IRouter = Router();

function actorFromRequest(req: {
  user?: { id: string; role?: string };
}): { actorType: string; actorId?: string } {
  return req.user
    ? { actorType: "user", actorId: String(req.user.id) }
    : { actorType: "system" };
}

function serializeDlq(row: typeof dlqEntriesTable.$inferSelect) {
  return {
    id: row.id,
    executionId: row.executionId,
    workflowId: row.workflowId,
    workflowName: row.workflowName,
    nodeId: row.nodeId,
    nodeName: row.nodeName,
    nodeType: row.nodeType,
    errorMessage: row.errorMessage,
    attempts: row.attempts,
    jobData: row.jobData ?? {},
    createdAt: row.createdAt.toISOString(),
    resolvedAt: row.resolvedAt?.toISOString() ?? null,
    resolution: row.resolution ?? null,
  };
}

function serializeExecution(row: typeof executionsTable.$inferSelect) {
  return {
    id: row.id,
    workflowId: row.workflowId,
    workflowName: row.workflowName,
    status: row.status,
    startedAt: row.startedAt.toISOString(),
    finishedAt: row.finishedAt?.toISOString() ?? null,
    durationMs: row.durationMs ?? null,
    errorMessage: row.errorMessage ?? null,
  };
}

router.get("/dlq", authorize("executions.read"), requireTenantContext, async (req, res): Promise<void> => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const status = req.query.status ? String(req.query.status) : undefined;
  const workflowId = req.query.workflowId ? Number(req.query.workflowId) : undefined;

  const conditions = [];
  if (status) conditions.push(eq(dlqEntriesTable.status, status));
  if (workflowId) conditions.push(eq(dlqEntriesTable.workflowId, workflowId));

  const rows = await db
    .select()
    .from(dlqEntriesTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(dlqEntriesTable.createdAt))
    .limit(limit);

  res.json(rows.map(serializeDlq));
});

router.post("/dlq/:id/retry", authorize("executions.run"), requireTenantContext, async (req, res): Promise<void> => {
  const id = String(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "Invalid DLQ id" });
    return;
  }

  const [entry] = await db
    .select()
    .from(dlqEntriesTable)
    .where(eq(dlqEntriesTable.id, id))
    .limit(1);
  if (!entry) {
    res.status(404).json({ error: "DLQ entry not found" });
    return;
  }

  const [workflow] = await db
    .select()
    .from(workflowsTable)
    .where(eq(workflowsTable.id, entry.workflowId))
    .limit(1);
  if (!workflow) {
    res.status(404).json({ error: "Workflow not found" });
    return;
  }

  const actor = actorFromRequest(req);
  const nodes = Array.isArray(workflow.nodes) ? (workflow.nodes as any[]) : [];
  const execution = await startWorkflowExecution(
    workflow.id,
    workflow.name,
    nodes,
    "manual",
    { _retriedDlqEntryId: entry.id, _retriedExecutionId: entry.executionId },
  );

  await db
    .update(dlqEntriesTable)
    .set({ status: "retrying", resolution: `Retry execution ${execution.id}` })
    .where(eq(dlqEntriesTable.id, id));

  await writeAudit(
    "dlq.retried",
    "dlq_entry",
    String(id),
    { executionId: execution.id, workflowId: workflow.id },
    actor.actorType,
    actor.actorId,
  );

  res.status(202).json(serializeExecution(execution));
});

router.post("/dlq/:id/dismiss", authorize("executions.run"), requireTenantContext, async (req, res): Promise<void> => {
  const id = String(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "Invalid DLQ id" });
    return;
  }

  const actor = actorFromRequest(req);
  const [entry] = await db
    .update(dlqEntriesTable)
    .set({
      status: "resolved",
      resolvedAt: new Date(),
      resolution: "Dismissed without retry",
    })
    .where(eq(dlqEntriesTable.id, id))
    .returning();

  if (!entry) {
    res.status(404).json({ error: "DLQ entry not found" });
    return;
  }

  await writeAudit(
    "dlq.dismissed",
    "dlq_entry",
    String(id),
    { workflowId: entry.workflowId, executionId: entry.executionId },
    actor.actorType,
    actor.actorId,
  );

  res.json(serializeDlq(entry));
});

export default router;
