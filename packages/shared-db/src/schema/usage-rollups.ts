import { pgTable, text, timestamp, integer, numeric, jsonb } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { tenantsTable } from "./tenants";

export const usageRollupsTable = pgTable("usage_rollups", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  tenantId: text("tenant_id")
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  rollupType: text("rollup_type").notNull(),
  period: text("period").notNull(),
  periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
  periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
  metricName: text("metric_name").notNull(),
  metricUnit: text("metric_unit").notNull(),
  totalQuantity: numeric("total_quantity", { precision: 20, scale: 4 }).notNull().default("0"),
  billableQuantity: numeric("billable_quantity", { precision: 20, scale: 4 }).notNull().default("0"),
  meteredTotal: numeric("metered_total", { precision: 20, scale: 4 }).notNull().default("0"),
  billableTotal: numeric("billable_total", { precision: 12, scale: 6 }).notNull().default("0"),
  breakdown: jsonb("breakdown").default({}),
  tier: text("tier"),
  rate: numeric("rate", { precision: 12, scale: 6 }),
  cost: numeric("cost", { precision: 12, scale: 6 }).notNull().default("0"),
  sourceCount: integer("source_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type UsageRollupRecord = typeof usageRollupsTable.$inferSelect;
export type InsertUsageRollup = typeof usageRollupsTable.$inferInsert;
