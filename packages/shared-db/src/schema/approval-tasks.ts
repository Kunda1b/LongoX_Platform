import { pgTable, text, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { workflowsTable } from "./workflows";
export const approvalTasksTable = pgTable("approval_tasks", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  workflowId: text("workflow_id")
    .notNull()
    .references(() => workflowsTable.id, { onDelete: "cascade" }),
  executionId: text("execution_id"),
  requesterId: text("requester_id"),
  approverId: text("approver_id"),
  status: text("status").notNull().default("pending"),
  note: text("note"),
  config: jsonb("config").default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  decidedAt: timestamp("decided_at", { withTimezone: true }),
});
