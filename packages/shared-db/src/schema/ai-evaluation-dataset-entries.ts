import {
  pgTable,
  text,
  serial,
  timestamp,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";
import { aiEvaluationDatasetsTable } from "./ai-evaluation-datasets";

export const aiEvaluationDatasetEntriesTable = pgTable(
  "ai_evaluation_dataset_entries",
  {
    id: serial("id").primaryKey(),
    datasetId: integer("dataset_id")
      .notNull()
      .references(() => aiEvaluationDatasetsTable.id, { onDelete: "cascade" }),
    input: text("input").notNull(),
    expectedOutput: text("expected_output"),
    context: jsonb("context").$type<Record<string, unknown>>().default({}),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
);

export type AiEvaluationDatasetEntryRecord =
  typeof aiEvaluationDatasetEntriesTable.$inferSelect;
