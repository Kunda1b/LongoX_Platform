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
  executionId: number;
};

const clients = new Map<number, Set<SSEClient>>();

function addClient(executionId: number, client: SSEClient): void {
  if (!clients.has(executionId)) clients.set(executionId, new Set());
  clients.get(executionId)!.add(client);
}

function removeClient(executionId: number, client: SSEClient): void {
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
  executionId: number,
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
  } catch {
  }
}

function sendHeartbeat(res: Response): void {
  try {
    res.write(`: heartbeat\n\n`);
    if (typeof (res as any).flush === "function") (res as any).flush();
  } catch {
  }
}

router.get(
  ["/api/executions/:id/stream", "/api/v1/executions/:id/stream"],
  authorize("executions:read"),
  async (req: Request, res: Response): Promise<void> => {
    const executionId = parseInt(req.params["id"] ?? "0", 10);
    if (isNaN(executionId) || executionId <= 0) {
      res.status(400).json({ error: "Invalid execution ID" });
      return;
    }

    const [execution] = await db
      .select()
      .from(executionsTable)
      .where(eq(executionsTable.id, executionId))
      .limit(1);

    if (!execution) {
      res.status(404).json({ error: "Execution not found" });
      return;
    }

    const tenantId = req.user?.tenantId;
    if (tenantId && execution.tenantId && execution.tenantId !== tenantId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.flushHeaders();

    const client: SSEClient = { res, seq: 0, executionId };
    addClient(executionId, client);

    const lastEventId = req.headers["last-event-id"];
    const lastSeq = lastEventId
      ? parseInt(String(lastEventId).split("/")[1] ?? "0", 10)
      : 0;

    if (lastSeq === 0) {
      await sendInitialState(executionId, res, client);
    } else {
      client.seq++;
      sendSSEEvent(res, {
        id: `${executionId}/${client.seq}`,
        event: "execution",
        data: {
          executionId,
          status: execution.status,
          startedAt: execution.startedAt?.toISOString(),
          finishedAt: execution.finishedAt?.toISOString(),
          durationMs: execution.durationMs,
          errorMessage: execution.errorMessage,
          reconnected: true,
        },
      });
    }

    const unsubscribe = sseExecutionBus.onExecutionEvent(
      executionId,
      (payload) => {
        if (res.writableEnded) {
          unsubscribe();
          return;
        }
        client.seq++;
        sendSSEEvent(res, {
          id: `${executionId}/${client.seq}`,
          event: payload.eventType,
          data: payload.data,
        });
      },
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
      unsubscribe();
      removeClient(executionId, client);
      if (!res.writableEnded) res.end();
    });

    req.on("error", () => {
      clearInterval(heartbeatInterval);
      unsubscribe();
      removeClient(executionId, client);
    });
  },
);

async function sendInitialState(
  executionId: number,
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
    const executionId = parseInt(req.params["id"] ?? "0", 10);
    const { task_id, decision, note } = req.body as {
      task_id?: number;
      decision?: "approved" | "rejected";
      note?: string;
    };

    if (!task_id || !decision) {
      res.status(400).json({ error: "task_id and decision are required" });
      return;
    }

    if (decision !== "approved" && decision !== "rejected") {
      res.status(400).json({ error: "decision must be 'approved' or 'rejected'" });
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
      res.status(409).json({ error: `Approval task is already ${task.status}` });
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
