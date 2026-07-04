import { Router, type Request, type Response } from "express";
import { eq, and } from "drizzle-orm";
import {
  db,
  executionsTable,
  executionCheckpointsTable,
  approvalTasksTable,
  dlqEntriesTable,
} from "@longox/db";
import { authorize } from "@longox/shared-rbac";
import { sseExecutionBus } from "@longox/shared-realtime";

const router = Router();

type SSEClient = {
  res: Response;
  seq: number;
  executionId: string;
};

const clients = new Map<string, Set<SSEClient>>();

function addClient(executionId: string, client: SSEClient): void {
  if (!clients.has(executionId)) clients.set(executionId, new Set());
  clients.get(executionId)!.add(client);
}

function removeClient(executionId: string, client: SSEClient): void {
  clients.get(executionId)?.delete(client);
  if (clients.get(executionId)?.size === 0) clients.delete(executionId);
}

/**
 * Broadcasts an execution event via the shared Redis-backed execution bus so
 * it fans out to SSE clients connected to ANY gateway instance, not just this
 * process. Local subscription (see the /stream route below) delivers it to
 * clients on this instance via sseExecutionBus.onExecutionEvent.
 */
export function broadcastExecutionEvent(
  executionId: string,
  eventType: string,
  payload: Record<string, unknown>,
): void {
  sseExecutionBus.broadcast({ executionId, eventType, data: payload });
}

function sendSSEEvent(
  res: Response,
  opts: { id: string; event: string; data: Record<string, unknown> },
): void {
  try {
    res.write(`id: ${opts.id}\n`);
    res.write(`event: ${opts.event}\n`);
    res.write(`data: ${JSON.stringify(opts.data)}\n`);
    res.write(`retry: 3000\n`);
    res.write(`\n`);
    if (typeof (res as any).flush === "function") (res as any).flush();
  } catch {}
}

function sendHeartbeat(res: Response): void {
  try {
    res.write(`: heartbeat\n\n`);
    if (typeof (res as any).flush === "function") (res as any).flush();
  } catch {}
}

router.get(
  [
    "/api/executions/stream",
    "/api/v1/executions/stream",
    "/api/executions/:id/stream",
    "/api/v1/executions/:id/stream",
  ],
  authorize("executions:read"),
  async (req: Request, res: Response): Promise<void> => {
    const executionIds = req.query["executionIds"]
      ? String(req.query["executionIds"])
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s.length > 0)
      : [];

    const paramId = String(req.params["id"] ?? "");
    if (paramId) executionIds.push(paramId);

    if (executionIds.length === 0) {
      res.status(400).json({ error: "At least one execution ID is required" });
      return;
    }

    const eventFilters = req.query["events"]
      ? String(req.query["events"]).split(",")
      : [];

    for (const executionId of executionIds) {
      const [execution] = await db
        .select()
        .from(executionsTable)
        .where(eq(executionsTable.id, executionId))
        .limit(1);

      if (!execution) {
        res.status(404).json({ error: `Execution ${executionId} not found` });
        return;
      }

      const tenantId = req.user?.tenantId;
      if (tenantId && execution.tenantId && execution.tenantId !== tenantId) {
        res
          .status(403)
          .json({ error: `Forbidden for execution ${executionId}` });
        return;
      }
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.flushHeaders();

    const clientId = `sse_multi_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    res.write(
      `event: connected\ndata: ${JSON.stringify({ clientId, executionIds })}\n\n`,
    );

    const clients: SSEClient[] = executionIds.map((executionId) => {
      const c: SSEClient = { res, seq: 0, executionId };
      addClient(executionId, c);
      return c;
    });

    const subscriptions = executionIds.map((executionId) =>
      sseExecutionBus.onExecutionEvent(executionId, (payload: unknown) => {
        if (res.writableEnded) {
          return;
        }
        if (
          eventFilters.length > 0 &&
          !eventFilters.includes((payload as { eventType: string }).eventType)
        )
          return;
        const client = clients.find((c) => c.executionId === executionId);
        if (!client) return;
        client.seq++;
        sendSSEEvent(res, {
          id: `${executionId}/${client.seq}`,
          event: (payload as { eventType: string }).eventType,
          data: {
            ...(payload as { data?: Record<string, unknown> }).data,
            executionId,
          },
        });
      }),
    );

    const heartbeatInterval = setInterval(() => {
      if (res.writableEnded) {
        clearInterval(heartbeatInterval);
        return;
      }
      sendHeartbeat(res);
    }, 15_000);

    req.on("close", () => {
      clearInterval(heartbeatInterval);
      subscriptions.forEach((u) => u());
      clients.forEach((c) => removeClient(c.executionId, c));
      if (!res.writableEnded) res.end();
    });

    req.on("error", () => {
      clearInterval(heartbeatInterval);
      subscriptions.forEach((u) => u());
      clients.forEach((c) => removeClient(c.executionId, c));
    });
  },
);

async function sendInitialState(
  executionId: string,
  res: Response,
  client: SSEClient,
): Promise<void> {
  const [execution] = await db
    .select()
    .from(executionsTable)
    .where(eq(executionsTable.id, executionId))
    .limit(1);

  if (!execution) return;

  client.seq++;
  sendSSEEvent(res, {
    id: `${executionId}/${client.seq}`,
    event: "execution",
    data: {
      executionId,
      workflowId: execution.workflowId,
      status: execution.status,
      triggerType: (execution as any).triggerType,
      startedAt: execution.startedAt?.toISOString(),
      finishedAt: execution.finishedAt?.toISOString(),
      durationMs: execution.durationMs,
      errorMessage: execution.errorMessage,
    },
  });

  const checkpoints = await db
    .select()
    .from(executionCheckpointsTable)
    .where(eq(executionCheckpointsTable.executionId, executionId))
    .orderBy(executionCheckpointsTable.startedAt);

  for (const cp of checkpoints) {
    client.seq++;
    sendSSEEvent(res, {
      id: `${executionId}/${client.seq}`,
      event: "node",
      data: {
        executionId,
        nodeId: cp.nodeId,
        nodeName: cp.nodeName,
        nodeType: cp.nodeType,
        status: cp.status,
        attemptNumber: cp.attemptNumber,
        durationMs: cp.durationMs,
        errorMessage: cp.errorMessage,
        startedAt: cp.startedAt?.toISOString(),
        completedAt: cp.completedAt?.toISOString(),
      },
    });
  }

  const approvals = await db
    .select()
    .from(approvalTasksTable)
    .where(eq(approvalTasksTable.executionId, executionId));

  for (const approval of approvals) {
    if (approval.status === "pending") {
      client.seq++;
      sendSSEEvent(res, {
        id: `${executionId}/${client.seq}`,
        event: "approval",
        data: {
          executionId,
          taskId: approval.id,
          nodeId: approval.executionId,
          status: approval.status,
          approverId: approval.approverId,
          createdAt: approval.createdAt?.toISOString(),
          decidedAt: approval.decidedAt?.toISOString(),
        },
      });
    }
  }

  const dlqEntries = await db
    .select()
    .from(dlqEntriesTable)
    .where(eq(dlqEntriesTable.executionId, executionId));

  for (const entry of dlqEntries) {
    client.seq++;
    sendSSEEvent(res, {
      id: `${executionId}/${client.seq}`,
      event: "dlq",
      data: {
        executionId,
        nodeId: entry.nodeId,
        nodeName: entry.nodeName,
        nodeType: entry.nodeType,
        errorMessage: entry.errorMessage,
        attempts: entry.attempts,
      },
    });
  }
}

router.post(
  ["/api/executions/:id/approve", "/api/v1/executions/:id/approve"],
  authorize("executions:run"),
  async (req: Request, res: Response): Promise<void> => {
    const executionId = String(req.params["id"] ?? "");
    const { task_id, decision, note } = req.body as {
      task_id?: string;
      decision?: "approved" | "rejected";
      note?: string;
    };

    if (!task_id || !decision) {
      res.status(400).json({ error: "task_id and decision are required" });
      return;
    }

    if (decision !== "approved" && decision !== "rejected") {
      res
        .status(400)
        .json({ error: "decision must be 'approved' or 'rejected'" });
      return;
    }

    const [task] = await db
      .select()
      .from(approvalTasksTable)
      .where(eq(approvalTasksTable.id, task_id))
      .limit(1);

    if (!task || task.executionId !== executionId) {
      res.status(404).json({ error: "Approval task not found" });
      return;
    }

    if (task.status !== "pending") {
      res
        .status(409)
        .json({ error: `Approval task is already ${task.status}` });
      return;
    }

    await db
      .update(approvalTasksTable)
      .set({
        status: decision,
        approverId: req.user?.id ?? null,
        decidedAt: new Date(),
        note: note ?? null,
      } as any)
      .where(eq(approvalTasksTable.id, task_id));

    broadcastExecutionEvent(executionId, "approval", {
      executionId,
      taskId: task_id,
      status: decision,
      decidedBy: req.user?.id,
      note,
      decidedAt: new Date().toISOString(),
    });

    res.json({ success: true, decision });
  },
);

export { clients as sseClients };
export default router;
