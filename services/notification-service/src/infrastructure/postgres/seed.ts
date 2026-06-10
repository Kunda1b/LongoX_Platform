import { sql } from "drizzle-orm";
import { db, notificationsTable, notificationTemplatesTable } from "@longox/db";

let seeded = false;

export async function ensureNotificationSeed(): Promise<void> {
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
