/**
 * P1-17: Dashboard SSE endpoint.
 *
 * `GET /dashboards/:id/stream` — opens a long-lived Server-Sent Events
 * connection that pushes dashboard refresh events to the client. Each event
 * carries the current dashboard snapshot so the client can re-render
 * without polling.
 *
 * Event types pushed on this stream:
 *   - `connected` : emitted once on connection open (carries clientId).
 *   - `snapshot`  : emitted once on connection open with the current
 *                   dashboard summary (workflows / executions / connectors).
 *   - `refresh`   : emitted on every refresh tick (default 30s, env
 *                   `DASHBOARD_REFRESH_INTERVAL_MS`) and whenever a refresh
 *                   is requested via the in-process `triggerDashboardRefresh`
 *                   callback (used when an upstream event lands that affects
 *                   the dashboard — e.g. a workflow execution finished).
 *
 * The endpoint is mounted under both `/api/dashboards/:id/stream` and
 * `/api/v1/dashboards/:id/stream` for backwards compatibility with the
 * unversioned and versioned API roots.
 */

import { Router, type Request, type Response } from "express";
import { prisma } from "@longox/db/prisma";
import { authorize } from "@longox/shared-rbac";

const router = Router();

const REFRESH_INTERVAL_MS = Number(
  process.env.DASHBOARD_REFRESH_INTERVAL_MS ?? 30_000,
);

type DashboardStreamClient = {
  res: Response;
  seq: number;
  dashboardId: string;
  lastSnapshotSig: string;
};

const clients = new Map<string, Set<DashboardStreamClient>>();

function addClient(dashboardId: string, client: DashboardStreamClient): void {
  if (!clients.has(dashboardId)) clients.set(dashboardId, new Set());
  clients.get(dashboardId)!.add(client);
}

function removeClient(dashboardId: string, client: DashboardStreamClient): void {
  clients.get(dashboardId)?.delete(client);
  if (clients.get(dashboardId)?.size === 0) clients.delete(dashboardId);
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
    // socket already closed — ignore
  }
}

function sendHeartbeat(res: Response): void {
  try {
    res.write(`: heartbeat\n\n`);
    if (typeof (res as any).flush === "function") (res as any).flush();
  } catch {
    // ignore
  }
}

/**
 * Build a dashboard snapshot for the given dashboard id. The snapshot is a
 * minimal summary the client can use to re-render without a full fetch.
 */
async function buildDashboardSnapshot(
  dashboardId: string,
): Promise<Record<string, unknown>> {
  // The dashboard row may not exist yet (clients can subscribe to a
  // dashboard id that is still being provisioned). We treat that as an
  // empty snapshot rather than 404-ing the stream — the next refresh tick
  // will pick up the row once it's created.
  const dashboard = (await prisma.dashboard.findUnique({
    where: { id: dashboardId },
  })) as any;
  if (!dashboard) {
    return { dashboardId, exists: false, updatedAt: null, data: null };
  }

  // Best-effort counts for the snapshot. Failures here don't kill the
  // stream — we just return whatever we got.
  let workflowCount = 0;
  let executionCount = 0;
  let recentExecutions: any[] = [];
  try {
    [workflowCount, executionCount, recentExecutions] = await Promise.all([
      prisma.workflow.count(),
      prisma.workflowExecution.count(),
      prisma.workflowExecution.findMany({
        orderBy: { startedAt: "desc" } as any,
        take: 10,
      }) as Promise<any[]>,
    ]);
  } catch {
    // counts are best-effort
  }

  return {
    dashboardId,
    exists: true,
    name: dashboard.name,
    updatedAt:
      dashboard.updatedAt instanceof Date
        ? dashboard.updatedAt.toISOString()
        : dashboard.updatedAt
          ? new Date(dashboard.updatedAt).toISOString()
          : null,
    counts: {
      workflows: workflowCount,
      executions: executionCount,
    },
    recentExecutions: recentExecutions.map((e: any) => ({
      id: e.id,
      workflowId: e.workflowId,
      status: e.status,
      startedAt:
        e.startedAt instanceof Date
          ? e.startedAt.toISOString()
          : new Date(e.startedAt).toISOString(),
    })),
  };
}

/**
 * Compute a cheap signature of the snapshot so we only push `refresh`
 * events when the snapshot actually changed (avoids spamming clients when
 * nothing has happened).
 */
function snapshotSignature(snap: Record<string, unknown>): string {
  return JSON.stringify(snap);
}

/**
 * Push a `refresh` event to every client watching the given dashboard id.
 * Used by upstream event handlers (e.g. when a workflow execution finishes)
 * to fan out a refresh without waiting for the next tick.
 */
export function triggerDashboardRefresh(dashboardId: string): void {
  const set = clients.get(dashboardId);
  if (!set || set.size === 0) return;
  for (const client of set) {
    if (client.res.writableEnded) continue;
    buildDashboardSnapshot(dashboardId)
      .then((snap) => {
        const sig = snapshotSignature(snap);
        if (sig === client.lastSnapshotSig) return; // no change → skip
        client.lastSnapshotSig = sig;
        client.seq++;
        sendSSEEvent(client.res, {
          id: `${dashboardId}/${client.seq}`,
          event: "refresh",
          data: { dashboardId, ...snap },
        });
      })
      .catch(() => {
        // snapshot build failure — don't kill the stream
      });
  }
}

router.get(
  [
    "/api/dashboards/:id/stream",
    "/api/v1/dashboards/:id/stream",
  ],
  authorize("dashboards:read"),
  async (req: Request, res: Response): Promise<void> => {
    const dashboardId = String(req.params["id"] ?? "");
    if (!dashboardId) {
      res.status(400).json({ error: "Dashboard ID is required" });
      return;
    }

    // SSE headers — keep-alive, no buffering, CORS-open for browser clients.
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.flushHeaders();

    const clientId = `dash_sse_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const client: DashboardStreamClient = {
      res,
      seq: 0,
      dashboardId,
      lastSnapshotSig: "",
    };
    addClient(dashboardId, client);

    // `connected` event — emitted once on connection open.
    client.seq++;
    sendSSEEvent(res, {
      id: `${dashboardId}/${client.seq}`,
      event: "connected",
      data: {
        clientId,
        dashboardId,
        refreshIntervalMs: REFRESH_INTERVAL_MS,
      },
    });

    // `snapshot` event — emit the current dashboard state so the client
    // has something to render before the first refresh tick.
    try {
      const snap = await buildDashboardSnapshot(dashboardId);
      client.lastSnapshotSig = snapshotSignature(snap);
      client.seq++;
      sendSSEEvent(res, {
        id: `${dashboardId}/${client.seq}`,
        event: "snapshot",
        data: { dashboardId, ...snap },
      });
    } catch {
      // snapshot failed — connection stays open; next tick will retry
    }

    // Periodic refresh ticker. Each tick re-fetches the snapshot and
    // pushes a `refresh` event only if the snapshot changed.
    const refreshTimer = setInterval(() => {
      if (res.writableEnded) {
        clearInterval(refreshTimer);
        return;
      }
      buildDashboardSnapshot(dashboardId)
        .then((snap) => {
          const sig = snapshotSignature(snap);
          if (sig === client.lastSnapshotSig) return;
          client.lastSnapshotSig = sig;
          client.seq++;
          sendSSEEvent(res, {
            id: `${dashboardId}/${client.seq}`,
            event: "refresh",
            data: { dashboardId, ...snap },
          });
        })
        .catch(() => {
          // ignore — next tick will retry
        });
    }, REFRESH_INTERVAL_MS);

    // Heartbeat every 15s keeps the connection alive through proxies
    // that would otherwise close idle connections.
    const heartbeatTimer = setInterval(() => {
      if (res.writableEnded) {
        clearInterval(heartbeatTimer);
        return;
      }
      sendHeartbeat(res);
    }, 15_000);

    const cleanup = () => {
      clearInterval(refreshTimer);
      clearInterval(heartbeatTimer);
      removeClient(dashboardId, client);
      if (!res.writableEnded) res.end();
    };

    req.on("close", cleanup);
    req.on("error", cleanup);
  },
);

export { clients as dashboardSseClients };
export default router;
