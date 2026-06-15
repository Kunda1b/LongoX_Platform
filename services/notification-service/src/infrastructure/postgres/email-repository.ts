import { eq, and, desc } from "drizzle-orm";
import { db, emailMessagesTable } from "@longox/db";
import type { EmailRepository } from "../../domain/email/email-repository";
import type {
  EmailMessage,
  SendEmailInput,
  ListEmailsFilter,
} from "../../domain/email/email.entity";

function toDomain(
  row: typeof emailMessagesTable.$inferSelect,
): EmailMessage {
  return {
    id: row.id,
    to: row.to,
    from: row.from,
    subject: row.subject,
    body: row.body,
    htmlBody: row.htmlBody ?? null,
    templateName: row.templateName ?? null,
    status: row.status as "pending" | "sent" | "failed",
    errorMessage: row.errorMessage ?? null,
    metadata: (row.metadata ?? null) as Record<string, unknown> | null,
    createdAt: row.createdAt.toISOString(),
    sentAt: row.sentAt?.toISOString() ?? null,
  };
}

export class PostgresEmailRepository implements EmailRepository {
  async list(filter: ListEmailsFilter): Promise<EmailMessage[]> {
    const limit = Math.min(filter.limit ?? 50, 200);
    const conditions = [];
    if (filter.status)
      conditions.push(eq(emailMessagesTable.status, filter.status));

    const rows = await db
      .select()
      .from(emailMessagesTable)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(emailMessagesTable.id))
      .limit(limit);
    return rows.map(toDomain);
  }

  async create(input: SendEmailInput): Promise<EmailMessage> {
    const [row] = await db
      .insert(emailMessagesTable)
      .values({
        to: input.to,
        from: input.from ?? "noreply@longox.com",
        subject: input.subject,
        body: input.body,
        htmlBody: input.htmlBody,
        templateName: input.templateName,
        status: "pending",
        metadata: input.metadata,
      } as any)
      .returning();
    return toDomain(row);
  }

  async markSent(id: number): Promise<EmailMessage | null> {
    const [row] = await db
      .update(emailMessagesTable)
      .set({ status: "sent", sentAt: new Date() })
      .where(eq(emailMessagesTable.id, id))
      .returning();
    return row ? toDomain(row) : null;
  }

  async markFailed(id: number, errorMessage: string): Promise<EmailMessage | null> {
    const [row] = await db
      .update(emailMessagesTable)
      .set({ status: "failed", errorMessage })
      .where(eq(emailMessagesTable.id, id))
      .returning();
    return row ? toDomain(row) : null;
  }
}
