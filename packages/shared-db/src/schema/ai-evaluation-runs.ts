import {
  pgTable,
  text,
  serial,
  timestamp,
  integer,
  real,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";
import { tenantsTable } from "./tenants";
import { aiEvaluationDatasetsTable } from "./ai-evaluation-datasets";
import { promptsTable } from "./prompts";

export const aiEvaluationRunsTable = pgTable("ai_evaluation_runs", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id")
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  datasetId: integer("dataset_id")
    .notNull()
    .references(() => aiEvaluationDatasetsTable.id, { onDelete: "cascade" }),
  promptId: integer("prompt_id")
    .notNull()
    .references(() => promptsTable.id, { onDelete: "cascade" }),
  promptVersion: integer("prompt_version"),
  status: text("status").notNull().default("pending"),
  totalEntries: integer("total_entries").notNull().default(0),
  passedEntries: integer("passed_entries").notNull().default(0),
  failedEntries: integer("failed_entries").notNull().default(0),
  score: real("score"),
  threshold: real("threshold").notNull().default(70),
  passed: boolean("passed"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type AiEvaluationRunRecord = typeof aiEvaluationRunsTable.$inferSelect;
