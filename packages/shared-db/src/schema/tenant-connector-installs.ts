import { pgTable, serial, integer, varchar, timestamp, jsonb } from "drizzle-orm/pg-core";

export const tenantConnectorInstallsTable = pgTable("tenant_connector_installs", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  connectorId: integer("connector_id").notNull(),
  connectorVersionId: integer("connector_version_id"),
  status: varchar("status", { length: 20 }).notNull().default("installing"),
  config: jsonb("config").default({}),
  installedBy: integer("installed_by"),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
