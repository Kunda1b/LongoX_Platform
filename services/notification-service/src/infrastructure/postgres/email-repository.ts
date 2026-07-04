/**
 * Prisma-based email repository.
 *
 * Migrated from Drizzle to Prisma per ADR-013 Phase 3.
 * Uses `prisma.emailMessage` delegate with `as any` casts for legacy
 * columns (`from`, `htmlBody`, `templateName`, `errorMessage`, `metadata`)
 * that are not yet reflected on the Prisma model.
 */

import { prisma } from "@longox/db/prisma";
import type { EmailRepository } from "../../domain/email/email-repository";
import type {
  EmailMessage,
  SendEmailInput,
  ListEmailsFilter,
} from "../../domain/email/email.entity";

function toDomain(row: any): EmailMessage {
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
    const where: Record<string, unknown> = {};
    if (filter.status) where.status = filter.status;

    const rows = await prisma.emailMessage.findMany({
      where: where as any,
      orderBy: { id: "desc" },
      take: limit,
    });
    return rows.map(toDomain);
  }

  async create(input: SendEmailInput): Promise<EmailMessage> {
    const row = await prisma.emailMessage.create({
      data: {
        to: input.to,
        from: input.from ?? "noreply@longox.com",
        subject: input.subject,
        body: input.body,
        htmlBody: input.htmlBody,
        templateName: input.templateName,
        status: "pending",
        metadata: input.metadata,
      } as any,
    });
    return toDomain(row);
  }

  async markSent(id: string): Promise<EmailMessage | null> {
    try {
      const row = await prisma.emailMessage.update({
        where: { id },
        data: { status: "sent", sentAt: new Date() } as any,
      });
      return toDomain(row);
    } catch {
      return null;
    }
  }

  async markFailed(id: string, errorMessage: string): Promise<EmailMessage | null> {
    try {
      const row = await prisma.emailMessage.update({
        where: { id },
        data: { status: "failed", errorMessage } as any,
      });
      return toDomain(row);
    } catch {
      return null;
    }
  }
}
