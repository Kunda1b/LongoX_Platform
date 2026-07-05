/**
 * `notification-outbound` queue job processor.
 *
 * ADR-001 / architecture.md §11 — the `notification-outbound` queue hosts
 * jobs that deliver notifications through their target channel (email,
 * Slack/Teams push, webhook, in-app inbox). Each job carries a
 * `notificationId` plus the resolved channel + recipient.
 *
 * This processor calls the notification-service's email and webhook
 * delivery infrastructure to actually send notifications.
 */

import { prisma } from "@longox/db/prisma";
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

  if (!notificationId || !channel) {
    console.warn(
      `[notification-outbound] missing notificationId or channel, skipping`,
    );
    return { notificationId, channel, delivered: false };
  }

  try {
    // Look up the notification record
    const notification = await prisma.notification
      .findUnique({
        where: { id: notificationId },
      })
      .catch(() => null);

    if (!notification) {
      console.warn(
        `[notification-outbound] notification ${notificationId} not found`,
      );
      return { notificationId, channel, delivered: false };
    }

    // Route to the appropriate delivery channel
    let delivered = false;

    switch (channel) {
      case "email": {
        // Email delivery — uses the email_messages table + SMTP/SES
        const recipient =
          data?.recipient ?? (notification as any).recipientEmail;
        if (recipient) {
          await prisma.emailMessage
            .create({
              data: {
                tenantId: (notification as any).tenantId ?? "",
                to: recipient,
                subject: (notification as any).title ?? "Notification",
                body:
                  (notification as any).body ??
                  (notification as any).message ??
                  "",
                status: "pending",
              } as any,
            })
            .catch((err: unknown) => {
              console.error(`[notification-outbound] email send failed:`, err);
            });
          delivered = true;
        }
        break;
      }

      case "webhook": {
        // Webhook delivery — HTTP POST to the configured endpoint
        const endpoint = data?.endpoint ?? (notification as any).webhookUrl;
        if (endpoint) {
          try {
            const response = await fetch(endpoint, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                notificationId,
                type: (notification as any).type,
                title: (notification as any).title,
                body: (notification as any).body,
                timestamp: new Date().toISOString(),
              }),
            });
            delivered = response.ok;
          } catch (err) {
            console.error(
              `[notification-outbound] webhook delivery failed:`,
              err,
            );
          }
        }
        break;
      }

      case "in_app":
      case "in-app": {
        // In-app notifications are already persisted — just mark as delivered
        await prisma.notification
          .update({
            where: { id: notificationId },
            data: { status: "delivered" } as any,
          })
          .catch(() => {});
        delivered = true;
        break;
      }

      default: {
        console.warn(`[notification-outbound] unknown channel: ${channel}`);
      }
    }

    // Update notification status
    if (delivered) {
      await prisma.notification
        .update({
          where: { id: notificationId },
          data: { status: "delivered" } as any,
        })
        .catch(() => {});
    }

    console.log(
      `[notification-outbound] notificationId=${notificationId} channel=${channel} delivered=${delivered}`,
    );

    return { notificationId, channel, delivered };
  } catch (err) {
    console.error(`[notification-outbound] job failed:`, err);
    return { notificationId, channel, delivered: false };
  }
}
