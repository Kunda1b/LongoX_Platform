import { pgTable, text, serial, timestamp, integer, jsonb, boolean } from "drizzle-orm/pg-core";
import { workflowsTable } from "./workflows";
export const approvalTasksTable = pgTable("approval_tasks", {
  id: serial("id").primaryKey(),
  workflowId: integer("workflow_id").notNull().references(() => workflowsTable.id, { onDelete: "cascade" }),
  executionId: integer("execution_id"),
  requesterId: integer("requester_id"),
  approverId: integer("approver_id"),
  status: text("status").notNull().default("pending"),
  note: text("note"),
  config: jsonb("config").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  decidedAt: timestamp("decided_at", { withTimezone: true }),
});
