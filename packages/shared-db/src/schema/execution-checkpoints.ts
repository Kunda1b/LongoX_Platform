import { pgTable, text, serial, timestamp, integer, jsonb } from "drizzle-orm/pg-core";

export const executionCheckpointsTable = pgTable("execution_checkpoints", {
  id: serial("id").primaryKey(),
  executionId: integer("execution_id").notNull(),
  nodeId: text("node_id").notNull(),
  nodeName: text("node_name").notNull(),
  nodeType: text("node_type").notNull(),
  status: text("status").notNull().default("pending"),
  attemptNumber: integer("attempt_number").notNull().default(1),
  inputData: jsonb("input_data"),
  outputData: jsonb("output_data"),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  durationMs: integer("duration_ms"),
});

export type ExecutionCheckpoint = typeof executionCheckpointsTable.$inferSelect;
