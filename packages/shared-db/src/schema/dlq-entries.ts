import {
  pgTable,
  text,
  serial,
  timestamp,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";

export const dlqEntriesTable = pgTable("dlq_entries", {
  id: serial("id").primaryKey(),
  executionId: integer("execution_id").notNull(),
  workflowId: integer("workflow_id").notNull(),
  workflowName: text("workflow_name").notNull(),
  nodeId: text("node_id").notNull(),
  nodeName: text("node_name").notNull(),
  nodeType: text("node_type").notNull(),
  errorMessage: text("error_message").notNull(),
  attempts: integer("attempts").notNull().default(1),
  jobData: jsonb("job_data").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  resolution: text("resolution"),
});

export type DlqEntry = typeof dlqEntriesTable.$inferSelect;
