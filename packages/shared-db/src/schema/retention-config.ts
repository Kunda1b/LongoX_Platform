import {
  pgTable,
  text,
  serial,
  timestamp,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { tenantsTable } from "./tenants";

export const retentionConfigTable = pgTable("retention_config", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id")
    .notNull()
    .unique()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  hotRetentionDays: integer("hot_retention_days").notNull().default(395),
  coldRetentionDays: integer("cold_retention_days").notNull().default(2555),
  archiveEnabled: boolean("archive_enabled").notNull().default(false),
  archiveBucket: text("archive_bucket"),
  coldQueryEnabled: boolean("cold_query_enabled").notNull().default(false),
  partitionInterval: text("partition_interval").notNull().default("month"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type RetentionConfigRecord = typeof retentionConfigTable.$inferSelect;
