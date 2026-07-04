import { pgTable, text, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { tenantsTable } from "./tenants";

export const tenantMigrationsTable = pgTable("tenant_migrations", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  tenantId: text("tenant_id")
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  fromTierId: text("from_tier_id").notNull(),
  toTierId: text("to_tier_id").notNull(),
  fromPlacement: text("from_placement").notNull(),
  toPlacement: text("to_placement").notNull(),
  fromCluster: text("from_cluster").notNull(),
  toCluster: text("to_cluster").notNull(),
  status: text("status").notNull().default("planned"),
  steps: jsonb("steps").default([]),
  dataVerified: boolean("data_verified").notNull().default(false),
  trafficSwitched: boolean("traffic_switched").notNull().default(false),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  errorMessage: text("error_message"),
  rolledBackAt: timestamp("rolled_back_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type TenantMigrationRecord = typeof tenantMigrationsTable.$inferSelect;
