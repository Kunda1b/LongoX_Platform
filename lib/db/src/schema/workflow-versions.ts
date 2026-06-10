import { pgTable, text, serial, timestamp, integer, jsonb, boolean } from "drizzle-orm/pg-core";

export const workflowVersionsTable = pgTable("workflow_versions", {
  id: serial("id").primaryKey(),
  workflowId: integer("workflow_id").notNull(),
  version: integer("version").notNull(),
  name: text("name").notNull(),
  nodes: jsonb("nodes").notNull().default([]),
  changeNote: text("change_note"),
  published: boolean("published").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type WorkflowVersion = typeof workflowVersionsTable.$inferSelect;
