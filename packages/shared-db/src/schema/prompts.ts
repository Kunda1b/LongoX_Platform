import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";

export const promptsTable = pgTable("prompts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  content: text("content").notNull(),
  version: integer("version").notNull().default(1),
  status: text("status").notNull().default("draft"),
  tags: text("tags").array(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const promptVersionsTable = pgTable("prompt_versions", {
  id: serial("id").primaryKey(),
  promptId: integer("prompt_id").notNull(),
  content: text("content").notNull(),
  version: integer("version").notNull(),
  status: text("status").notNull().default("draft"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type PromptRecord = typeof promptsTable.$inferSelect;
export type PromptVersionRecord = typeof promptVersionsTable.$inferSelect;
