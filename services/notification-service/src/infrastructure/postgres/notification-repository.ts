import { eq, and } from "drizzle-orm";
import { db, notificationsTable } from "@longox/db";
import type { NotificationRepository } from "../../domain/notification/notification-repository";
import type {
  Notification,
  CreateNotificationInput,
  ListNotificationsFilter,
} from "../../domain/notification/notification.entity";
import { ensureNotificationSeed } from "./seed";

function toDomain(
  row: typeof notificationsTable.$inferSelect,
): Notification {
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
    const conditions = [];
    if (filter.recipientId)
      conditions.push(eq(notificationsTable.recipientId, filter.recipientId));
    if (filter.status)
      conditions.push(eq(notificationsTable.status, filter.status));

    const rows = await db
      .select()
      .from(notificationsTable)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(notificationsTable.id)
      .limit(limit);
    return rows.map(toDomain);
  }

  async create(input: CreateNotificationInput): Promise<Notification> {
    const [row] = await db
      .insert(notificationsTable)
      .values({
        type: input.type ?? "info",
        title: input.title.trim(),
        body: input.body,
        channel: input.channel ?? "in_app",
        status: "unread",
        recipientId: input.recipientId,
        metadata: input.metadata,
      })
      .returning();
    return toDomain(row);
  }

  async markRead(id: number): Promise<Notification | null> {
    const [row] = await db
      .update(notificationsTable)
      .set({ status: "read" })
      .where(eq(notificationsTable.id, id))
      .returning();
    return row ? toDomain(row) : null;
  }
}
