import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, workflowsTable } from "@autoflow/db";
import { startWorkflowExecution } from "../lib/execution";

const router: IRouter = Router();

router.post("/webhooks/:workflowId", async (req, res): Promise<void> => {
  const workflowId = parseInt(req.params.workflowId, 10);
  if (isNaN(workflowId)) { res.status(400).json({ error: "Invalid workflowId" }); return; }

  const [workflow] = await db.select().from(workflowsTable).where(eq(workflowsTable.id, workflowId));
  if (!workflow) { res.status(404).json({ error: "Workflow not found" }); return; }

  if (workflow.status !== "active") {
    res.status(409).json({ error: `Workflow is ${workflow.status}, cannot trigger via webhook` });
    return;
  }

  const nodes: any[] = Array.isArray(workflow.nodes) ? (workflow.nodes as any[]) : [];
  const payload: Record<string, unknown> = typeof req.body === "object" && req.body !== null ? req.body : {};

  const execution = await startWorkflowExecution(
    workflow.id,
    workflow.name,
    nodes,
    "webhook",
    { ...payload, _source: "webhook", _headers: { "content-type": req.headers["content-type"] } }
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

export default router;
