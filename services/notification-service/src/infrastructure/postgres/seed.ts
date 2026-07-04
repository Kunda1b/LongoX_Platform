/**
 * Prisma-based notification seed.
 *
 * Migrated from Drizzle to Prisma per ADR-013 Phase 3.
 * Uses `prisma.notification` and `prisma.notificationTemplate` delegates.
 */

import { prisma } from "@longox/db/prisma";

let seeded = false;

export async function ensureNotificationSeed(): Promise<void> {
  if (seeded) return;
  seeded = true;

  const count = await prisma.notification.count();
  if (count > 0) return;

  await prisma.notification.createMany({
    data: [
      {
        tenantId: "1",
        type: "success",
        title: "Workflow run completed",
        body: '"Daily Digest" finished successfully with 12 records processed.',
        channel: "in_app",
        status: "unread",
        recipientId: "user-1",
      },
      {
        tenantId: "1",
        type: "error",
        title: "Connector authentication failed",
        body: "Slack connector credentials expired. Please re-authenticate.",
        channel: "in_app",
        status: "unread",
        recipientId: "user-1",
      },
      {
        tenantId: "1",
        type: "info",
        title: "New template available",
        body: 'A new "E-commerce Analytics" template was added to the marketplace.',
        channel: "in_app",
        status: "read",
        recipientId: "user-1",
      },
      {
        tenantId: "1",
        type: "warning",
        title: "Usage limit approaching",
        body: "You have used 85% of your monthly workflow execution quota.",
        channel: "in_app",
        status: "unread",
        recipientId: "user-1",
      },
      {
        tenantId: "1",
        type: "info",
        title: "Deployment succeeded",
        body: "Workflow promoted to production environment successfully.",
        channel: "in_app",
        status: "read",
        recipientId: "user-2",
      },
    ] as any,
  });

  await prisma.notificationTemplate.createMany({
    data: [
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
    ] as any,
  });
}
