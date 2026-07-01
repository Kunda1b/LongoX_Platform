import {
  pgTable,
  text,
  serial,
  timestamp,
  integer,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";
import { tenantsTable } from "./tenants";

export const tenantMigrationsTable = pgTable("tenant_migrations", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id")
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  fromTierId: integer("from_tier_id").notNull(),
  toTierId: integer("to_tier_id").notNull(),
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
