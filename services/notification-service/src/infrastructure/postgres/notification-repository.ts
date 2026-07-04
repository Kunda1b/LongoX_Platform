/**
 * Prisma-based notification repository.
 *
 * Migrated from Drizzle to Prisma per ADR-013 Phase 3.
 * Uses `prisma.notification` delegate.
 */

import { prisma } from "@longox/db/prisma";
import type { NotificationRepository } from "../../domain/notification/notification-repository";
import type {
  Notification,
  CreateNotificationInput,
  ListNotificationsFilter,
} from "../../domain/notification/notification.entity";
import { ensureNotificationSeed } from "./seed";

function toDomain(row: any): Notification {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body ?? null,
    channel: row.channel,
    status: row.status,
    recipientId: row.recipientId ?? null,
    metadata: (row.metadata ?? null) as Record<string, unknown> | null,
    createdAt: row.createdAt.toISOString(),
  };
}

export class PostgresNotificationRepository
  implements NotificationRepository
{
  async list(filter: ListNotificationsFilter): Promise<Notification[]> {
    await ensureNotificationSeed();
    const limit = Math.min(filter.limit ?? 50, 200);
    const where: Record<string, unknown> = {};
    if (filter.recipientId) where.recipientId = filter.recipientId;
    if (filter.status) where.status = filter.status;

    const rows = await prisma.notification.findMany({
      where: where as any,
      orderBy: { id: "asc" },
      take: limit,
    });
    return rows.map(toDomain);
  }

  async create(input: CreateNotificationInput): Promise<Notification> {
    const row = await prisma.notification.create({
      data: {
        type: input.type ?? "info",
        title: input.title.trim(),
        body: input.body,
        channel: input.channel ?? "in_app",
        status: "unread",
        recipientId: input.recipientId,
        metadata: input.metadata,
      } as any,
    });
    return toDomain(row);
  }

  async markRead(id: string): Promise<Notification | null> {
    try {
      const row = await prisma.notification.update({
        where: { id },
        data: { status: "read" } as any,
      });
      return toDomain(row);
    } catch {
      return null;
    }
  }
}
