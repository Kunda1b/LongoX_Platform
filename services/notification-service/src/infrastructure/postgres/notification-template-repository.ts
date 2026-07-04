/**
 * Prisma-based notification template repository.
 *
 * Migrated from Drizzle to Prisma per ADR-013 Phase 3.
 * Uses `prisma.notificationTemplate` delegate.
 */

import { prisma } from "@longox/db/prisma";
import type { NotificationTemplateRepository } from "../../domain/template/notification-template-repository";
import type {
  NotificationTemplate,
  CreateNotificationTemplateInput,
} from "../../domain/template/notification-template.entity";
import { ensureNotificationSeed } from "./seed";

function toDomain(row: any): NotificationTemplate {
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
    const rows = await prisma.notificationTemplate.findMany({
      orderBy: { id: "asc" },
    });
    return rows.map(toDomain);
  }

  async create(
    input: CreateNotificationTemplateInput,
  ): Promise<NotificationTemplate> {
    const row = await prisma.notificationTemplate.create({
      data: {
        name: input.name.trim(),
        channel: input.channel ?? "in_app",
        subject: input.subject,
        body: input.body.trim(),
        variables: JSON.stringify(input.variables ?? []) as any,
      } as any,
    });
    return toDomain(row);
  }
}
