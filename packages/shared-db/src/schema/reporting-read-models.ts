import { pgTable, text, integer, numeric, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

export const reportingSnapshotsTable = pgTable("reporting_snapshots", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  reportType: text("report_type").notNull(),
  tenantId: text("tenant_id"),
  period: text("period").notNull(),
  periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
  periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
  data: jsonb("data").notNull().default({}),
  summary: jsonb("summary").default({}),
  generatedAt: timestamp("generated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const reportingExportsTable = pgTable("reporting_exports", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  reportType: text("report_type").notNull(),
  tenantId: text("tenant_id"),
  format: text("format").notNull().default("json"),
  fileUrl: text("file_url"),
  status: text("status").notNull().default("pending"),
  requestedBy: integer("requested_by"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const reportingKPIsTable = pgTable("reporting_kpis", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  kpiName: text("kpi_name").notNull(),
  kpiValue: numeric("kpi_value", { precision: 16, scale: 6 }).notNull(),
  targetValue: numeric("target_value", { precision: 16, scale: 6 }),
  unit: text("unit").default("count"),
  tenantId: text("tenant_id"),
  period: text("period").notNull().default("day"),
  recordedAt: timestamp("recorded_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type ReportingSnapshotRecord = typeof reportingSnapshotsTable.$inferSelect;
export type ReportingExportRecord = typeof reportingExportsTable.$inferSelect;
export type ReportingKPIRecord = typeof reportingKPIsTable.$inferSelect;
