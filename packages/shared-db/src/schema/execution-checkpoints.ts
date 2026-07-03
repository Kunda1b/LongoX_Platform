import {
  pgTable,
  text,
  serial,
  timestamp,
  integer,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const executionCheckpointsTable = pgTable(
  "execution_checkpoints",
  {
    id: serial("id").primaryKey(),
    executionId: integer("execution_id").notNull(),
    nodeId: text("node_id").notNull(),
    nodeName: text("node_name"),
    nodeType: text("node_type"),
    status: text("status").notNull().default("pending"),
    attemptNumber: integer("attempt_number").notNull().default(1),
    retryCount: integer("retry_count").default(0),
    idempotencyKey: text("idempotency_key"),
    compensationStatus: text("compensation_status")
      .default("pending"),
    inputData: jsonb("input_data"),
    outputData: jsonb("output_data"),
    errorMessage: text("error_message"),
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    durationMs: integer("duration_ms"),
  },
  (table) => [
    uniqueIndex("idx_exec_checkpoint_idempotency")
      .on(table.executionId, table.nodeId, table.attemptNumber),
  ],
);

export type ExecutionCheckpoint = typeof executionCheckpointsTable.$inferSelect;
