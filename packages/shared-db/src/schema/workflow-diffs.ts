import {
  pgTable,
  text,
  serial,
  timestamp,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";
import { workflowsTable } from "./workflows";
import { workflowVersionsTable } from "./workflow-versions";

export const workflowDiffsTable = pgTable("workflow_diffs", {
  id: serial("id").primaryKey(),
  workflowId: integer("workflow_id")
    .notNull()
    .references(() => workflowsTable.id, { onDelete: "cascade" }),
  fromVersionId: integer("from_version_id")
    .notNull()
    .references(() => workflowVersionsTable.id, { onDelete: "cascade" }),
  toVersionId: integer("to_version_id")
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
