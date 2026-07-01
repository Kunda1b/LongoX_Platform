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
import { aiEvaluationRunsTable } from "./ai-evaluation-runs";
import { aiEvaluationDatasetEntriesTable } from "./ai-evaluation-dataset-entries";

export const aiEvaluationRunResultsTable = pgTable(
  "ai_evaluation_run_results",
  {
    id: serial("id").primaryKey(),
    runId: integer("run_id")
      .notNull()
      .references(() => aiEvaluationRunsTable.id, { onDelete: "cascade" }),
    entryId: integer("entry_id")
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
