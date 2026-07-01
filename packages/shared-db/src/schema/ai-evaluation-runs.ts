import {
  pgTable,
  text,
  serial,
  timestamp,
  integer,
  numeric,
  jsonb,
} from "drizzle-orm/pg-core";
import { tenantsTable } from "./tenants";
import { aiEvaluationDatasetsTable } from "./ai-evaluation-datasets";

export const aiEvaluationRunsTable = pgTable("ai_evaluation_runs", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id")
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  datasetId: integer("dataset_id")
    .notNull()
    .references(() => aiEvaluationDatasetsTable.id, { onDelete: "cascade" }),
  promptId: integer("prompt_id").notNull(),
  promptVersionId: integer("prompt_version_id"),
  modelId: integer("model_id"),
  modelName: text("model_name"),
  provider: text("provider"),
  status: text("status").notNull().default("pending"),
  overallScore: numeric("overall_score", { precision: 5, scale: 2 }),
  results: jsonb("results"),
  passedCount: integer("passed_count").notNull().default(0),
  failedCount: integer("failed_count").notNull().default(0),
  totalCount: integer("total_count").notNull().default(0),
  thresholdMet: text("threshold_met"),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type AiEvaluationRunRecord = typeof aiEvaluationRunsTable.$inferSelect;
