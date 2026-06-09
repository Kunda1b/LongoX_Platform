import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";

export const workflowPromotionsTable = pgTable("workflow_promotions", {
  id: serial("id").primaryKey(),
  workflowId: integer("workflow_id").notNull(),
  workflowName: text("workflow_name").notNull(),
  fromEnvironment: text("from_environment").notNull(),
  toEnvironment: text("to_environment").notNull(),
  status: text("status").notNull().default("promoted"),
  promotedBy: text("promoted_by").notNull().default("user"),
  approvedBy: text("approved_by"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type WorkflowPromotionRecord = typeof workflowPromotionsTable.$inferSelect;
