import {
  pgTable,
  text,
  serial,
  timestamp,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";

export const templateVersionsTable = pgTable("template_versions", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").notNull(),
  version: integer("version").notNull(),
  name: text("name").notNull(),
  nodes: jsonb("nodes").notNull().default([]),
  changeNote: text("change_note"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type TemplateVersionRecord = typeof templateVersionsTable.$inferSelect;
