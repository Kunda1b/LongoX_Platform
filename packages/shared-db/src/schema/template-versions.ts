import { pgTable, text, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

export const templateVersionsTable = pgTable("template_versions", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  templateId: text("template_id").notNull(),
  version: integer("version").notNull(),
  name: text("name").notNull(),
  nodes: jsonb("nodes").notNull().default([]),
  changeNote: text("change_note"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type TemplateVersionRecord = typeof templateVersionsTable.$inferSelect;
