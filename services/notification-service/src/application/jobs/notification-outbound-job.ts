/**
 * `notification-outbound` queue job processor.
 *
 * ADR-001 / architecture.md §11 — the `notification-outbound` queue hosts
 * jobs that deliver notifications through their target channel (email,
 * Slack/Teams push, webhook, in-app inbox). Each job carries a
 * `notificationId` plus the resolved channel + recipient.
 *
 * This is a placeholder processor — it logs the job and acks. The real
 * delivery path is wired in `infrastructure/email/` and
 * `infrastructure/webhook/`; once those repositories are constructed
 * outside of `dev-server.ts` we can call them here directly.
 */

import type { NotificationOutboundJobData } from "@longox/shared-queue";

export interface NotificationOutboundJobResult {
  notificationId: string | null;
  channel: string | null;
  delivered: boolean;
}

export async function processNotificationOutboundJob(
  data: NotificationOutboundJobData,
): Promise<NotificationOutboundJobResult> {
  const notificationId = data?.notificationId ?? null;
  const channel = data?.channel ?? null;

  // TODO(longox-platform#P1-9): wire to the real EmailSender /
  // WebhookDeliveryService once they're constructable without an Express
  // request context. For now this is a logged placeholder so the
  // `notification-outbound` queue can be drained safely in dev mode.
  console.log(
    `[notification-outbound] placeholder job notificationId=${notificationId} channel=${channel} recipient=${data?.recipient ?? "<none>"}`,
  );

  return { notificationId, channel, delivered: false };
}
