import {
  pgTable,
  text,
  serial,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";
import { promptsTable } from "./prompts";

export const promptApprovalsTable = pgTable("prompt_approvals", {
  id: serial("id").primaryKey(),
  promptId: integer("prompt_id")
    .notNull()
    .references(() => promptsTable.id, { onDelete: "cascade" }),
  version: integer("version").notNull(),
  requesterId: integer("requester_id"),
  approverId: integer("approver_id"),
  status: text("status").notNull().default("pending"),
  comment: text("comment"),
  decidedAt: timestamp("decided_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type PromptApprovalRecord = typeof promptApprovalsTable.$inferSelect;
