import { Router, type IRouter } from "express";
import { eq, sql, and } from "drizzle-orm";
import { db, notificationsTable, notificationTemplatesTable } from "@longox/db";

const router: IRouter = Router();

let seeded = false;
async function ensureNotifications() {
  if (seeded) return;
  seeded = true;
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notificationsTable);
  if (count > 0) return;

  await db.insert(notificationsTable).values([
    {
      type: "success",
      title: "Workflow run completed",
      body: '"Daily Digest" finished successfully with 12 records processed.',
      channel: "in_app",
      status: "unread",
      recipientId: "user-1",
    },
    {
      type: "error",
      title: "Connector authentication failed",
      body: "Slack connector credentials expired. Please re-authenticate.",
      channel: "in_app",
      status: "unread",
      recipientId: "user-1",
    },
    {
      type: "info",
      title: "New template available",
      body: 'A new "E-commerce Analytics" template was added to the marketplace.',
      channel: "in_app",
      status: "read",
      recipientId: "user-1",
    },
    {
      type: "warning",
      title: "Usage limit approaching",
      body: "You have used 85% of your monthly workflow execution quota.",
      channel: "in_app",
      status: "unread",
      recipientId: "user-1",
    },
    {
      type: "info",
      title: "Deployment succeeded",
      body: "Workflow promoted to production environment successfully.",
      channel: "in_app",
      status: "read",
      recipientId: "user-2",
    },
  ]);

  await db.insert(notificationTemplatesTable).values([
    {
      name: "Workflow Success",
      channel: "in_app",
      subject: null,
      body: 'Workflow "{{workflowName}}" completed successfully with {{recordCount}} records processed.',
      variables: JSON.stringify(["workflowName", "recordCount"]),
    },
    {
      name: "Workflow Failure",
      channel: "in_app",
      subject: null,
      body: 'Workflow "{{workflowName}}" failed at step "{{stepName}}": {{errorMessage}}',
      variables: JSON.stringify(["workflowName", "stepName", "errorMessage"]),
    },
    {
      name: "Usage Alert",
      channel: "email",
      subject: "LongoX Usage Alert",
      body: "You have used {{percentage}}% of your monthly quota. Upgrade your plan to avoid interruptions.",
      variables: JSON.stringify(["percentage"]),
    },
  ]);
}

function fmtNotif(row: typeof notificationsTable.$inferSelect) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body ?? null,
    channel: row.channel,
    status: row.status,
    recipientId: row.recipientId ?? null,
    metadata: row.metadata ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

router.get("/notifications", async (req, res): Promise<void> => {
  await ensureNotifications();
  const recipientId = req.query.recipientId as string | undefined;
  const status = req.query.status as string | undefined;
  const limit = Math.min(Number(req.query.limit ?? 50), 200);

  const conditions = [];
  if (recipientId)
    conditions.push(eq(notificationsTable.recipientId, recipientId));
  if (status) conditions.push(eq(notificationsTable.status, status));

  const rows = await db
    .select()
    .from(notificationsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(notificationsTable.id)
    .limit(limit);

  res.json(rows.map(fmtNotif));
});

router.post("/notifications", async (req, res): Promise<void> => {
  const {
    type = "info",
    title,
    body,
    channel = "in_app",
    recipientId,
    metadata,
  } = req.body as {
    type?: string;
    title: string;
    body?: string;
    channel?: string;
    recipientId?: string;
    metadata?: Record<string, unknown>;
  };
  if (!title?.trim()) {
    res.status(400).json({ error: "title required" });
    return;
  }
  const [row] = await db
    .insert(notificationsTable)
    .values({
      type,
      title: title.trim(),
      body,
      channel,
      status: "unread",
      recipientId,
      metadata,
    })
    .returning();
  res.status(201).json(fmtNotif(row));
});

router.post("/notifications/:id/read", async (req, res): Promise<void> => {
  const [row] = await db
    .update(notificationsTable)
    .set({ status: "read" })
    .where(eq(notificationsTable.id, Number(req.params.id)))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(fmtNotif(row));
});

router.get("/notification-templates", async (_req, res): Promise<void> => {
  await ensureNotifications();
  const rows = await db
    .select()
    .from(notificationTemplatesTable)
    .orderBy(notificationTemplatesTable.id);
  res.json(
    rows.map((r) => ({
      id: r.id,
      name: r.name,
      channel: r.channel,
      subject: r.subject ?? null,
      body: r.body,
      variables: r.variables ?? null,
      createdAt: r.createdAt.toISOString(),
    })),
  );
});

router.post("/notification-templates", async (req, res): Promise<void> => {
  const {
    name,
    channel = "in_app",
    subject,
    body,
    variables = [],
  } = req.body as {
    name: string;
    channel?: string;
    subject?: string;
    body: string;
    variables?: string[];
  };
  if (!name?.trim() || !body?.trim()) {
    res.status(400).json({ error: "name and body required" });
    return;
  }
  const [row] = await db
    .insert(notificationTemplatesTable)
    .values({
      name: name.trim(),
      channel,
      subject,
      body: body.trim(),
      variables: JSON.stringify(variables),
    })
    .returning();
  res.status(201).json({
    id: row.id,
    name: row.name,
    channel: row.channel,
    subject: row.subject ?? null,
    body: row.body,
    variables: row.variables ?? null,
    createdAt: row.createdAt.toISOString(),
  });
});

export default router;
