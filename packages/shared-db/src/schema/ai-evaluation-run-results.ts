import { pgTable, text, timestamp, real, boolean, jsonb } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { aiEvaluationRunsTable } from "./ai-evaluation-runs";
import { aiEvaluationDatasetEntriesTable } from "./ai-evaluation-dataset-entries";

export const aiEvaluationRunResultsTable = pgTable(
  "ai_evaluation_run_results",
  {
    id: text("id").primaryKey().$defaultFn(() => createId()),
    runId: text("run_id")
      .notNull()
      .references(() => aiEvaluationRunsTable.id, { onDelete: "cascade" }),
    entryId: text("entry_id")
      .notNull()
      .references(() => aiEvaluationDatasetEntriesTable.id, {
        onDelete: "cascade",
      }),
    input: text("input").notNull(),
    expectedOutput: text("expected_output"),
    actualOutput: text("actual_output"),
    score: real("score"),
    passed: boolean("passed"),
    metrics: jsonb("metrics")
      .$type<{
        latency?: number;
        tokenCount?: number;
        cost?: number;
      }>()
      .default({}),
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
);

export type AiEvaluationRunResultRecord =
  typeof aiEvaluationRunResultsTable.$inferSelect;
