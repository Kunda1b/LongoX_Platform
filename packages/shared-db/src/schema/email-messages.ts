import { pgTable, text, serial, jsonb, timestamp, integer } from "drizzle-orm/pg-core";
import { tenantsTable } from "./tenants";

export const emailMessagesTable = pgTable("email_messages", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id")
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  to: text("to").notNull(),
  from: text("from").notNull().default("noreply@longox.com"),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  htmlBody: text("html_body"),
  templateName: text("template_name"),
  status: text("status").notNull().default("pending"),
  errorMessage: text("error_message"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  sentAt: timestamp("sent_at", { withTimezone: true }),
});

export type EmailMessageRecord = typeof emailMessagesTable.$inferSelect;
