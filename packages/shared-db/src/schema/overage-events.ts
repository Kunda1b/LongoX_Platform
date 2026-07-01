import {
  pgTable,
  text,
  serial,
  timestamp,
  integer,
  numeric,
  jsonb,
} from "drizzle-orm/pg-core";
import { tenantsTable } from "./tenants";

export const overageEventsTable = pgTable("overage_events", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id")
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  resource: text("resource").notNull(),
  overageQuantity: numeric("overage_quantity", { precision: 20, scale: 4 }).notNull().default("0"),
  rate: numeric("rate", { precision: 12, scale: 6 }).notNull().default("0"),
  amount: numeric("amount", { precision: 12, scale: 6 }).notNull().default("0"),
  periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
  periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type OverageEventRecord = typeof overageEventsTable.$inferSelect;
export type InsertOverageEvent = typeof overageEventsTable.$inferInsert;
