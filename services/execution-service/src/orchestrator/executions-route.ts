import { Router, type IRouter } from "express";
import { prisma } from "@longox/db/prisma";
import { ListExecutionsQueryParams, GetExecutionParams } from "@longox/api-zod";
import { startWorkflowExecution, writeAudit } from "../queue/bullmq-queue";
import { authorize } from "@longox/shared-rbac";

const router: IRouter = Router();

function serializeExecution(e: any) {
  return {
    id: e.id,
    workflowId: e.workflowId,
    workflowName: e.workflowName,
    status: e.status,
    startedAt: e.startedAt instanceof Date ? e.startedAt.toISOString() : e.startedAt,
    finishedAt: e.finishedAt ? (e.finishedAt instanceof Date ? e.finishedAt.toISOString() : e.finishedAt) : null,
    durationMs: e.durationMs ?? null,
    errorMessage: e.errorMessage ?? null,
  };
}

router.get("/executions", authorize({ resource: "workflows", action: "read" }), async (req, res): Promise<void> => {
  const params = ListExecutionsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const where: Record<string, unknown> = {};
  if (params.data.workflowId) where.workflowId = params.data.workflowId;
  if (params.data.status) where.status = params.data.status;

  const limit = params.data.limit ?? 50;

  const executions = await prisma.workflowExecution.findMany({
    where,
    orderBy: { startedAt: "desc" },
    take: limit,
  });

  res.json(executions.map(serializeExecution));
});

router.get("/executions/:id", authorize({ resource: "workflows", action: "read" }), async (req, res): Promise<void> => {
  const params = GetExecutionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const execution = await prisma.workflowExecution.findUnique({
    where: { id: params.data.id },
  });
  if (!execution) {
    res.status(404).json({ error: "Execution not found" });
    return;
  }

  // Fetch real checkpoints; fall back to stored steps for legacy records
  const checkpoints = await prisma.nodeExecutionCheckpoint.findMany({
    where: { executionId: params.data.id },
    orderBy: { id: "asc" },
  });

  let steps;
  if (checkpoints.length > 0) {
    // Only include latest attempt per node (keep first occurrence since we order by id asc)
    const seen = new Set<string>();
    steps = checkpoints
      .map((c: any) => {
        const s = (c.stateJson ?? {}) as Record<string, unknown>;
        return {
          id: c.id,
          nodeId: c.nodeId,
          nodeName: s.nodeName,
          nodeType: s.nodeType,
          status: s.status,
          startedAt: s.startedAt instanceof Date
            ? (s.startedAt as Date).toISOString()
            : (s.startedAt ?? null),
          finishedAt: s.completedAt instanceof Date
            ? (s.completedAt as Date).toISOString()
            : (s.completedAt ?? null),
          durationMs: (s.durationMs as number) ?? null,
          inputData: (s.inputData as Record<string, unknown>) ?? {},
          outputData: (s.outputData as Record<string, unknown>) ?? null,
          errorMessage: (s.errorMessage as string) ?? null,
          itemCount: null,
        };
      })
      .filter((c) => {
        const key = c.nodeId;
        const ok = !seen.has(key);
        seen.add(key);
        return ok;
      });
  } else {
    steps = Array.isArray((execution as any).steps) ? (execution as any).steps : [];
  }

  res.json({ ...serializeExecution(execution), steps });
});

router.post("/executions/:id/retry", authorize({ resource: "workflows", action: "run" }), async (req, res): Promise<void> => {
  const params = GetExecutionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const original = await prisma.workflowExecution.findUnique({
    where: { id: params.data.id },
  });
  if (!original) {
    res.status(404).json({ error: "Execution not found" });
    return;
  }

  const workflow = await prisma.workflow.findUnique({
    where: { id: (original as any).workflowId },
  });
  if (!workflow) {
    res.status(404).json({ error: "Workflow not found" });
    return;
  }

  const nodes: any[] = Array.isArray((workflow as any).nodes)
    ? ((workflow as any).nodes as any[])
    : [];
  const executionNodes =
    nodes.length > 0
      ? nodes
      : [
          {
            id: "node-1",
            name: "Manual Trigger",
            nodeTypeId: "trigger.manual",
            position: { x: 0, y: 0 },
            config: {},
          },
          {
            id: "node-2",
            name: "HTTP Request",
            nodeTypeId: "action.http",
            position: { x: 300, y: 0 },
            config: {},
          },
        ];

  const execution = await startWorkflowExecution(
    workflow.id,
    workflow.name,
    executionNodes,
    "manual",
    { _retriedFrom: original.id },
  );

  await writeAudit(
    "execution.retried",
    "execution",
    String(execution.id),
    { originalExecutionId: original.id, workflowId: workflow.id },
    "user",
  );

  res.status(202).json(serializeExecution(execution));
});

export default router;
