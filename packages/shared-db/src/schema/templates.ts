import {
  pgTable,
  text,
  serial,
  timestamp,
  integer,
  jsonb,
  real,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const templatesTable = pgTable("templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  triggerType: text("trigger_type").notNull(),
  nodeCount: integer("node_count").notNull().default(0),
  uses: integer("uses").notNull().default(0),
  complexity: text("complexity").notNull().default("beginner"),
  tags: text("tags").array().notNull().default([]),
  nodes: jsonb("nodes").notNull().default([]),
  isCustom: boolean("is_custom").notNull().default(false),
  templateType: text("template_type").notNull().default("workflow"),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertTemplateSchema = createInsertSchema(templatesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
export type Template = typeof templatesTable.$inferSelect;
