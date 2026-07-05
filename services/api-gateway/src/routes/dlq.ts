import { Router, type IRouter } from "express";
import { prisma } from "@longox/db/prisma";
import {
  startWorkflowExecution,
  writeAudit,
} from "@longox/execution-service/workflow-runner";
import { authorize, requireTenantContext } from "@longox/shared-rbac";

const router: IRouter = Router();

function actorFromRequest(req: { user?: { id: string; role?: string } }): {
  actorType: string;
  actorId?: string;
} {
  return req.user
    ? { actorType: "user", actorId: String(req.user.id) }
    : { actorType: "system" };
}

function serializeDlq(row: any) {
  return {
    id: row.id,
    executionId: row.executionId,
    workflowId: (row as any).workflowId,
    workflowName: (row as any).workflowName,
    nodeId: row.nodeId,
    nodeName: (row as any).nodeName,
    nodeType: (row as any).nodeType,
    errorMessage: (row as any).errorMessage ?? row.reason,
    attempts: (row as any).attempts ?? 0,
    jobData: (row as any).jobData ?? row.payloadJson ?? {},
    createdAt:
      row.createdAt instanceof Date
        ? row.createdAt.toISOString()
        : new Date(row.createdAt).toISOString(),
    resolvedAt: (row as any).resolvedAt
      ? row.resolvedAt instanceof Date
        ? row.resolvedAt.toISOString()
        : new Date(row.resolvedAt).toISOString()
      : null,
    resolution: (row as any).resolution ?? null,
  };
}

function serializeExecution(row: any) {
  return {
    id: row.id,
    workflowId: row.workflowId,
    workflowName: (row as any).workflowName,
    status: row.status,
    startedAt:
      row.startedAt instanceof Date
        ? row.startedAt.toISOString()
        : new Date(row.startedAt).toISOString(),
    finishedAt: row.finishedAt
      ? row.finishedAt instanceof Date
        ? row.finishedAt.toISOString()
        : new Date(row.finishedAt).toISOString()
      : null,
    durationMs: row.durationMs ?? null,
    errorMessage: row.errorMessage ?? null,
  };
}

router.get(
  "/dlq",
  authorize("executions.read"),
  requireTenantContext,
  async (req, res): Promise<void> => {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const status = req.query.status ? String(req.query.status) : undefined;
    const workflowId = req.query.workflowId
      ? String(req.query.workflowId)
      : undefined;

    const where: any = {};
    if (status) where.status = status;
    if (workflowId) where.workflowId = workflowId;

    const rows = (await prisma.deadLetterQueue.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    })) as any[];

    res.json(rows.map(serializeDlq));
  },
);

router.post(
  "/dlq/:id/retry",
  authorize("executions.run"),
  requireTenantContext,
  async (req, res): Promise<void> => {
    const id = String(req.params.id);
    if (!Number.isInteger(Number(id))) {
      res.status(400).json({ error: "Invalid DLQ id" });
      return;
    }

    const entry = (await prisma.deadLetterQueue.findUnique({
      where: { id },
    })) as any;
    if (!entry) {
      res.status(404).json({ error: "DLQ entry not found" });
      return;
    }

    const workflow = (await prisma.workflow.findUnique({
      where: { id: entry.workflowId },
    })) as any;
    if (!workflow) {
      res.status(404).json({ error: "Workflow not found" });
      return;
    }

    const actor = actorFromRequest(req);
    const nodes = Array.isArray(workflow.nodes)
      ? (workflow.nodes as any[])
      : [];
    const execution = await startWorkflowExecution(
      workflow.id,
      workflow.name,
      nodes,
      "manual",
      { _retriedDlqEntryId: entry.id, _retriedExecutionId: entry.executionId },
    );

    await prisma.deadLetterQueue.update({
      where: { id },
      data: {
        status: "retrying",
        resolution: `Retry execution ${execution.id}`,
      } as any,
    });

    await writeAudit(
      "dlq.retried",
      "dlq_entry",
      String(id),
      { executionId: execution.id, workflowId: workflow.id },
      actor.actorType,
      actor.actorId,
    );

    res.status(202).json(serializeExecution(execution));
  },
);

router.post(
  "/dlq/:id/dismiss",
  authorize("executions.run"),
  requireTenantContext,
  async (req, res): Promise<void> => {
    const id = String(req.params.id);
    if (!Number.isInteger(Number(id))) {
      res.status(400).json({ error: "Invalid DLQ id" });
      return;
    }

    const actor = actorFromRequest(req);
    const entry = (await prisma.deadLetterQueue.update({
      where: { id },
      data: {
        status: "resolved",
        resolvedAt: new Date(),
        resolution: "Dismissed without retry",
      } as any,
    })) as any;

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
  },
);

export default router;
