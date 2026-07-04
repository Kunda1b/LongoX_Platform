import { pgTable, text, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { tenantsTable } from "./tenants";

export const executionsTable = pgTable("executions", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  tenantId: text("tenant_id")
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  workflowId: text("workflow_id").notNull(),
  workflowName: text("workflow_name").notNull(),
  status: text("status").notNull().default("running"),
  startedAt: timestamp("started_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  durationMs: integer("duration_ms"),
  errorMessage: text("error_message"),
  steps: jsonb("steps"),
  region: text("region"),
  executedInRegion: text("executed_in_region"),
  isReplicated: integer("is_replicated").notNull().default(0),
  parentExecutionId: text("parent_execution_id"),
});

export const insertExecutionSchema = createInsertSchema(executionsTable).omit({
  id: true,
});
export type InsertExecution = z.infer<typeof insertExecutionSchema>;
export type Execution = typeof executionsTable.$inferSelect;
