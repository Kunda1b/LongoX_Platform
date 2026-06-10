import {
  pgTable,
  text,
  serial,
  timestamp,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";
import { tenantsTable } from "./tenants";
export const dataSourcesTable = pgTable("data_sources", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id")
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  kind: text("kind").notNull(),
  config: jsonb("config").notNull().default({}),
  status: text("status").notNull().default("active"),
  lastTestedAt: timestamp("last_tested_at", { withTimezone: true }),
  lastTestError: text("last_test_error"),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
