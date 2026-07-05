/**
 * P1-18: Notification center SSE endpoint.
 *
 * `GET /notifications/stream` — opens a long-lived Server-Sent Events
 * connection that pushes notification-center events to the client. Used by
 * the in-app notification bell to update in real-time without polling.
 *
 * Event types pushed on this stream:
 *   - `connected`      : emitted once on connection open (carries clientId).
 *   - `snapshot`       : emitted once on connection open with the recipient's
 *                        current unread + recent notifications.
 *   - `notification`   : emitted whenever a new notification is created for
 *                        the recipient (via in-process `pushNotification`
 *                        callback) or on the periodic refresh tick if a new
 *                        row landed in the DB.
 *   - `read`           : emitted when a notification is marked read.
 *
 * Query params:
 *   - `recipientId` : the user id whose notifications to stream. Required.
 *   - `intervalMs`  : optional refresh tick override (default 30s).
 */

import { Router, type Request, type Response } from "express";
import { prisma } from "@longox/db/prisma";

const router = Router();

const REFRESH_INTERVAL_MS = Number(
  process.env.NOTIFICATION_REFRESH_INTERVAL_MS ?? 30_000,
);

type NotificationStreamClient = {
  res: Response;
  seq: number;
  recipientId: string;
  lastSeenNotificationId: string | null;
};

const clients = new Map<string, Set<NotificationStreamClient>>();

function addClient(
  recipientId: string,
  client: NotificationStreamClient,
): void {
  if (!clients.has(recipientId)) clients.set(recipientId, new Set());
  clients.get(recipientId)!.add(client);
}

function removeClient(
  recipientId: string,
  client: NotificationStreamClient,
): void {
  clients.get(recipientId)?.delete(client);
  if (clients.get(recipientId)?.size === 0) clients.delete(recipientId);
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
    // socket closed — ignore
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

interface NotificationSnapshot {
  recipientId: string;
  unreadCount: number;
  recent: Array<{
    id: string;
    type: string;
    title: string;
    body: string | null;
    channel: string;
    status: string;
    createdAt: string;
  }>;
  latestId: string | null;
}

async function buildNotificationSnapshot(
  recipientId: string,
): Promise<NotificationSnapshot> {
  const [unreadCount, recentRows] = await Promise.all([
    prisma.notification.count({
      where: { recipientId, status: "unread" } as any,
    }) as Promise<number>,
    prisma.notification.findMany({
      where: { recipientId } as any,
      orderBy: { createdAt: "desc" } as any,
      take: 20,
    }) as Promise<any[]>,
  ]);

  const recent = recentRows.map((r: any) => ({
    id: r.id,
    type: r.type,
    title: r.title,
    body: r.body ?? null,
    channel: r.channel,
    status: r.status,
    createdAt:
      r.createdAt instanceof Date
        ? r.createdAt.toISOString()
        : new Date(r.createdAt).toISOString(),
  }));

  return {
    recipientId,
    unreadCount,
    recent,
    latestId: recent.length > 0 ? recent[0]!.id : null,
  };
}

/**
 * Push a `notification` event to every client watching the given recipient.
 * Used by the create-notification flow so clients learn about a new
 * notification immediately, without waiting for the next refresh tick.
 */
export function pushNotification(
  recipientId: string,
  notification: {
    id: string;
    type: string;
    title: string;
    body?: string | null;
    channel?: string;
    status?: string;
    createdAt?: string;
  },
): void {
  const set = clients.get(recipientId);
  if (!set || set.size === 0) return;
  for (const client of set) {
    if (client.res.writableEnded) continue;
    client.lastSeenNotificationId = notification.id;
    client.seq++;
    sendSSEEvent(client.res, {
      id: `notif/${client.seq}`,
      event: "notification",
      data: {
        recipientId,
        notification: {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          body: notification.body ?? null,
          channel: notification.channel ?? "in_app",
          status: notification.status ?? "unread",
          createdAt: notification.createdAt ?? new Date().toISOString(),
        },
      },
    });
  }
}

/**
 * Push a `read` event to every client watching the given recipient. Used
 * by the mark-as-read flow so clients update the bell badge immediately.
 */
export function pushNotificationRead(
  recipientId: string,
  notificationId: string,
): void {
  const set = clients.get(recipientId);
  if (!set || set.size === 0) return;
  for (const client of set) {
    if (client.res.writableEnded) continue;
    client.seq++;
    sendSSEEvent(client.res, {
      id: `notif/${client.seq}`,
      event: "read",
      data: { recipientId, notificationId },
    });
  }
}

router.get(
  ["/api/notifications/stream", "/api/v1/notifications/stream"],
  async (req: Request, res: Response): Promise<void> => {
    const recipientId = String(req.query["recipientId"] ?? "");
    if (!recipientId) {
      res
        .status(400)
        .json({ error: "recipientId query parameter is required" });
      return;
    }

    const intervalMs = Number(req.query["intervalMs"] ?? REFRESH_INTERVAL_MS);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.flushHeaders();

    const clientId = `notif_sse_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const client: NotificationStreamClient = {
      res,
      seq: 0,
      recipientId,
      lastSeenNotificationId: null,
    };
    addClient(recipientId, client);

    client.seq++;
    sendSSEEvent(res, {
      id: `notif/${client.seq}`,
      event: "connected",
      data: { clientId, recipientId, refreshIntervalMs: intervalMs },
    });

    // Initial snapshot — emit the recipient's current unread + recent
    // notifications so the bell can render before the first refresh tick.
    try {
      const snap = await buildNotificationSnapshot(recipientId);
      client.lastSeenNotificationId = snap.latestId;
      client.seq++;
      sendSSEEvent(res, {
        id: `notif/${client.seq}`,
        event: "snapshot",
        data: snap as unknown as Record<string, unknown>,
      });
    } catch {
      // snapshot failed — connection stays open; next tick will retry
    }

    // Periodic refresh ticker. Each tick re-fetches the recipient's
    // notifications and pushes a `notification` event for each new row
    // since the last tick (so the client sees new notifications even if
    // `pushNotification` wasn't called in-process — e.g. notification
    // was created by a different service instance).
    const refreshTimer = setInterval(() => {
      if (res.writableEnded) {
        clearInterval(refreshTimer);
        return;
      }
      buildNotificationSnapshot(recipientId)
        .then((snap) => {
          // If the latest id changed, push any new rows.
          if (
            client.lastSeenNotificationId &&
            snap.latestId &&
            snap.latestId !== client.lastSeenNotificationId
          ) {
            for (const n of snap.recent) {
              if (n.id === client.lastSeenNotificationId) break;
              client.seq++;
              sendSSEEvent(res, {
                id: `notif/${client.seq}`,
                event: "notification",
                data: { recipientId, notification: n },
              });
            }
          } else if (!client.lastSeenNotificationId && snap.latestId) {
            // First tick picked up notifications that didn't fit in the
            // initial snapshot — push them all.
            for (const n of snap.recent) {
              client.seq++;
              sendSSEEvent(res, {
                id: `notif/${client.seq}`,
                event: "notification",
                data: { recipientId, notification: n },
              });
            }
          }
          client.lastSeenNotificationId = snap.latestId;
        })
        .catch(() => {
          // ignore — next tick will retry
        });
    }, intervalMs);

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
      removeClient(recipientId, client);
      if (!res.writableEnded) res.end();
    };

    req.on("close", cleanup);
    req.on("error", cleanup);
  },
);

export { clients as notificationSseClients };
export default router;
