import { pgTable, text, serial, jsonb, timestamp } from "drizzle-orm/pg-core";

export const notificationsTable = pgTable("notifications", {
  id: serial("id").primaryKey(),
  type: text("type").notNull().default("info"),
  title: text("title").notNull(),
  body: text("body"),
  channel: text("channel").notNull().default("in_app"),
  status: text("status").notNull().default("unread"),
  recipientId: text("recipient_id"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const notificationTemplatesTable = pgTable("notification_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  channel: text("channel").notNull().default("in_app"),
  subject: text("subject"),
  body: text("body").notNull(),
  variables: jsonb("variables").default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type NotificationRecord = typeof notificationsTable.$inferSelect;
export type NotificationTemplateRecord = typeof notificationTemplatesTable.$inferSelect;
