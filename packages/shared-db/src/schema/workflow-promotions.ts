import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

export const workflowPromotionsTable = pgTable("workflow_promotions", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  workflowId: text("workflow_id").notNull(),
  workflowName: text("workflow_name").notNull(),
  fromEnvironment: text("from_environment").notNull(),
  toEnvironment: text("to_environment").notNull(),
  status: text("status").notNull().default("promoted"),
  promotedBy: text("promoted_by").notNull().default("user"),
  approvedBy: text("approved_by"),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  rejectionReason: text("rejection_reason"),
  rejectedAt: timestamp("rejected_at", { withTimezone: true }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type WorkflowPromotionRecord =
  typeof workflowPromotionsTable.$inferSelect;
