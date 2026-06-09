import { pgTable, text, serial, timestamp, integer, jsonb } from "drizzle-orm/pg-core";

export const workflowVersionsTable = pgTable("workflow_versions", {
  id: serial("id").primaryKey(),
  workflowId: integer("workflow_id").notNull(),
  version: integer("version").notNull(),
  name: text("name").notNull(),
  nodes: jsonb("nodes").notNull().default([]),
  changeNote: text("change_note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type WorkflowVersion = typeof workflowVersionsTable.$inferSelect;
