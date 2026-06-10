import { Router, type IRouter } from "express";
import { eq, isNull, isNotNull } from "drizzle-orm";
import {
  db,
  dlqEntriesTable,
  workflowsTable,
  executionsTable,
} from "@longox/db";
import { startWorkflowExecution } from "../lib/execution";

const router: IRouter = Router();

function serializeDlq(e: typeof dlqEntriesTable.$inferSelect) {
  return {
    id: e.id,
    executionId: e.executionId,
    workflowId: e.workflowId,
    workflowName: e.workflowName,
    nodeId: e.nodeId,
    nodeName: e.nodeName,
    nodeType: e.nodeType,
    errorMessage: e.errorMessage,
    attempts: e.attempts,
    jobData: e.jobData ?? {},
    createdAt: e.createdAt.toISOString(),
    resolvedAt: e.resolvedAt ? e.resolvedAt.toISOString() : null,
    resolution: e.resolution ?? null,
  };
}

router.get("/dlq", async (req, res): Promise<void> => {
  const resolvedParam = req.query.resolved;
  const limit = parseInt(String(req.query.limit ?? "50"), 10);

  let entries;
  if (resolvedParam === "true") {
    entries = await db
      .select()
      .from(dlqEntriesTable)
      .where(isNotNull(dlqEntriesTable.resolvedAt))
      .orderBy(dlqEntriesTable.createdAt)
      .limit(limit);
  } else if (resolvedParam === "false") {
    entries = await db
      .select()
      .from(dlqEntriesTable)
      .where(isNull(dlqEntriesTable.resolvedAt))
      .orderBy(dlqEntriesTable.createdAt)
      .limit(limit);
  } else {
    entries = await db
      .select()
      .from(dlqEntriesTable)
      .orderBy(dlqEntriesTable.createdAt)
      .limit(limit);
  }

  res.json(entries.map(serializeDlq));
});

router.post("/dlq/:id/retry", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [entry] = await db
    .select()
    .from(dlqEntriesTable)
    .where(eq(dlqEntriesTable.id, id));
  if (!entry) {
    res.status(404).json({ error: "DLQ entry not found" });
    return;
  }

  const [workflow] = await db
    .select()
    .from(workflowsTable)
    .where(eq(workflowsTable.id, entry.workflowId));
  if (!workflow) {
    res.status(404).json({ error: "Workflow not found" });
    return;
  }

  const nodes: any[] = Array.isArray(workflow.nodes)
    ? (workflow.nodes as any[])
    : [];
  const execution = await startWorkflowExecution(
    workflow.id,
    workflow.name,
    nodes,
    "manual",
    { _retriedFromDlq: entry.id },
  );

  await db
    .update(dlqEntriesTable)
    .set({ resolvedAt: new Date(), resolution: "retried" })
    .where(eq(dlqEntriesTable.id, id));

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

router.post("/dlq/:id/dismiss", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [entry] = await db
    .select()
    .from(dlqEntriesTable)
    .where(eq(dlqEntriesTable.id, id));
  if (!entry) {
    res.status(404).json({ error: "DLQ entry not found" });
    return;
  }

  const [updated] = await db
    .update(dlqEntriesTable)
    .set({ resolvedAt: new Date(), resolution: "dismissed" })
    .where(eq(dlqEntriesTable.id, id))
    .returning();

  res.json(serializeDlq(updated));
});

export default router;
