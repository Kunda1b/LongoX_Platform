import { pgTable, text, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

export const promptsTable = pgTable("prompts", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  name: text("name").notNull(),
  description: text("description"),
  content: text("content").notNull().default(""),
  systemPrompt: text("system_prompt").notNull().default(""),
  userTemplate: text("user_template").notNull().default(""),
  model: text("model").notNull().default("gpt-4"),
  provider: text("provider").notNull().default("openai"),
  maxTokens: integer("max_tokens").notNull().default(1024),
  temperature: real("temperature").notNull().default(0.7),
  variables: text("variables"),
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
  id: text("id").primaryKey().$defaultFn(() => createId()),
  promptId: text("prompt_id").notNull(),
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
