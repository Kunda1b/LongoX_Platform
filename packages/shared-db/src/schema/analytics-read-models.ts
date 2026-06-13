import {
  pgTable,
  text,
  serial,
  integer,
  numeric,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";

export const analyticsEventsTable = pgTable("analytics_events", {
  id: serial("id").primaryKey(),
  eventType: text("event_type").notNull(),
  aggregateId: text("aggregate_id").notNull(),
  aggregateType: text("aggregate_type").notNull(),
  tenantId: integer("tenant_id"),
  userId: integer("user_id"),
  payload: jsonb("payload").default({}),
  metadata: jsonb("metadata").default({}),
  timestamp: timestamp("timestamp", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const analyticsMetricsTable = pgTable("analytics_metrics", {
  id: serial("id").primaryKey(),
  metricName: text("metric_name").notNull(),
  metricValue: numeric("metric_value", { precision: 16, scale: 6 }).notNull(),
  dimensions: jsonb("dimensions").default({}),
  tenantId: integer("tenant_id"),
  period: text("period").notNull().default("hour"),
  recordedAt: timestamp("recorded_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const workflowAnalyticsTable = pgTable("workflow_analytics", {
  id: serial("id").primaryKey(),
  workflowId: integer("workflow_id").notNull(),
  tenantId: integer("tenant_id").notNull(),
  executionCount: integer("execution_count").notNull().default(0),
  successCount: integer("success_count").notNull().default(0),
  failureCount: integer("failure_count").notNull().default(0),
  avgDurationMs: numeric("avg_duration_ms", { precision: 12, scale: 2 }).default("0"),
  totalTokens: integer("total_tokens").notNull().default(0),
  totalCost: numeric("total_cost", { precision: 12, scale: 6 }).default("0"),
  period: text("period").notNull().default("day"),
  recordedAt: timestamp("recorded_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const aiAnalyticsTable = pgTable("ai_analytics", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  provider: text("provider").notNull(),
  model: text("model").notNull(),
  requestCount: integer("request_count").notNull().default(0),
  inputTokens: integer("input_tokens").notNull().default(0),
  outputTokens: integer("output_tokens").notNull().default(0),
  totalCost: numeric("total_cost", { precision: 12, scale: 6 }).default("0"),
  avgLatencyMs: numeric("avg_latency_ms", { precision: 10, scale: 2 }).default("0"),
  successRate: numeric("success_rate", { precision: 5, scale: 4 }).default("1"),
  period: text("period").notNull().default("day"),
  recordedAt: timestamp("recorded_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type AnalyticsEventRecord = typeof analyticsEventsTable.$inferSelect;
export type AnalyticsMetricRecord = typeof analyticsMetricsTable.$inferSelect;
export type WorkflowAnalyticsRecord = typeof workflowAnalyticsTable.$inferSelect;
export type AiAnalyticsRecord = typeof aiAnalyticsTable.$inferSelect;
