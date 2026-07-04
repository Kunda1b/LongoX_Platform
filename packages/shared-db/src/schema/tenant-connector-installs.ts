import { jsonb, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

export const tenantConnectorInstallsTable = pgTable(
  "tenant_connector_installs",
  {
    id: text("id").primaryKey().$defaultFn(() => createId()),
    tenantId: text("tenant_id").notNull(),
    connectorId: text("connector_id").notNull(),
    connectorVersionId: text("connector_version_id"),
    status: varchar("status", { length: 20 }).notNull().default("installing"),
    config: jsonb("config").default({}),
    installedBy: text("installed_by"),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
);
