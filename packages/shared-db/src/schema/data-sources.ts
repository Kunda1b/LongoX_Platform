import { pgTable, text, serial, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { tenantsTable } from "./tenants";
export const dataSourcesTable = pgTable("data_sources", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenantsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  kind: text("kind").notNull(),
  configJson: jsonb("config_json").notNull().default({}),
  isActive: text("is_active").notNull().default("true"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
