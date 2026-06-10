import { pgTable, serial, integer, varchar, text, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";

export const schedulesTable = pgTable("schedules", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  workflowId: integer("workflow_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  interval: varchar("interval", { length: 20 }).notNull().default("once"),
  cronExpression: varchar("cron_expression", { length: 100 }),
  timezone: varchar("timezone", { length: 50 }).notNull().default("UTC"),
  startAt: timestamp("start_at").notNull(),
  endAt: timestamp("end_at"),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  lastRunAt: timestamp("last_run_at"),
  nextRunAt: timestamp("next_run_at"),
  maxRuns: integer("max_runs"),
  runCount: integer("run_count").notNull().default(0),
  retryOnFailure: boolean("retry_on_failure").notNull().default(true),
  maxRetries: integer("max_retries").notNull().default(3),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
