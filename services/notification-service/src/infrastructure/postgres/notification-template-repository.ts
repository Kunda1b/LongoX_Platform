import { db, notificationTemplatesTable } from "@longox/db";
import type { NotificationTemplateRepository } from "../../domain/template/notification-template-repository";
import type {
  NotificationTemplate,
  CreateNotificationTemplateInput,
} from "../../domain/template/notification-template.entity";
import { ensureNotificationSeed } from "./seed";

function toDomain(
  row: typeof notificationTemplatesTable.$inferSelect,
): NotificationTemplate {
  return {
    id: row.id,
    name: row.name,
    channel: row.channel,
    subject: row.subject ?? null,
    body: row.body,
    variables: (row.variables as unknown) ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export class PostgresNotificationTemplateRepository
  implements NotificationTemplateRepository
{
  async list(): Promise<NotificationTemplate[]> {
    await ensureNotificationSeed();
    const rows = await db
      .select()
      .from(notificationTemplatesTable)
      .orderBy(notificationTemplatesTable.id);
    return rows.map(toDomain);
  }

  async create(
    input: CreateNotificationTemplateInput,
  ): Promise<NotificationTemplate> {
    const [row] = await db
      .insert(notificationTemplatesTable)
      .values({
        name: input.name.trim(),
        channel: input.channel ?? "in_app",
        subject: input.subject,
        body: input.body.trim(),
        variables: JSON.stringify(input.variables ?? []),
      })
      .returning();
    return toDomain(row);
  }
}
