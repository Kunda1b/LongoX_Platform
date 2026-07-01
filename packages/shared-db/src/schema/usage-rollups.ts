import {
  pgTable,
  text,
  serial,
  timestamp,
  integer,
  numeric,
} from "drizzle-orm/pg-core";
import { tenantsTable } from "./tenants";

export const usageRollupsTable = pgTable("usage_rollups", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id")
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
  tier: text("tier"),
  rate: numeric("rate", { precision: 12, scale: 6 }),
  cost: numeric("cost", { precision: 12, scale: 6 }).notNull().default("0"),
  sourceCount: integer("source_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type UsageRollupRecord = typeof usageRollupsTable.$inferSelect;
