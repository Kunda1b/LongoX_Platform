import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { promptsTable } from "./prompts";

export const promptApprovalsTable = pgTable("prompt_approvals", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  promptId: text("prompt_id")
    .notNull()
    .references(() => promptsTable.id, { onDelete: "cascade" }),
  version: integer("version").notNull(),
  requesterId: text("requester_id"),
  approverId: text("approver_id"),
  status: text("status").notNull().default("pending"),
  comment: text("comment"),
  decidedAt: timestamp("decided_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type PromptApprovalRecord = typeof promptApprovalsTable.$inferSelect;
