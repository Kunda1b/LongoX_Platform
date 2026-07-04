import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { workflowsTable } from "./workflows";
import { workflowVersionsTable } from "./workflow-versions";

export const workflowDiffsTable = pgTable("workflow_diffs", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  workflowId: text("workflow_id")
    .notNull()
    .references(() => workflowsTable.id, { onDelete: "cascade" }),
  fromVersionId: text("from_version_id")
    .notNull()
    .references(() => workflowVersionsTable.id, { onDelete: "cascade" }),
  toVersionId: text("to_version_id")
    .notNull()
    .references(() => workflowVersionsTable.id, { onDelete: "cascade" }),
  patch: jsonb("patch").notNull(),
  patchHash: text("patch_hash").notNull(),
  summary: jsonb("summary"),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type WorkflowDiffRecord = typeof workflowDiffsTable.$inferSelect;
