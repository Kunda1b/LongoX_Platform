import {
  pgTable,
  text,
  serial,
  timestamp,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const executionsTable = pgTable("executions", {
  id: serial("id").primaryKey(),
  workflowId: integer("workflow_id").notNull(),
  workflowName: text("workflow_name").notNull(),
  status: text("status").notNull().default("running"),
  startedAt: timestamp("started_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  durationMs: integer("duration_ms"),
  errorMessage: text("error_message"),
  steps: jsonb("steps"),
});

export const insertExecutionSchema = createInsertSchema(executionsTable).omit({
  id: true,
});
export type InsertExecution = z.infer<typeof insertExecutionSchema>;
export type Execution = typeof executionsTable.$inferSelect;
