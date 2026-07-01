import {
  pgTable,
  text,
  serial,
  timestamp,
  integer,
  numeric,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { tenantsTable } from "./tenants";

export const meteringEventsTable = pgTable(
  "metering_events",
  {
    id: serial("id").primaryKey(),
    eventId: text("event_id").notNull(),
    eventType: text("event_type").notNull(),
    tenantId: integer("tenant_id")
      .notNull()
      .references(() => tenantsTable.id, { onDelete: "cascade" }),
    workflowId: integer("workflow_id"),
    executionId: integer("execution_id"),
    connectorId: integer("connector_id"),
    dashboardId: integer("dashboard_id"),
    quantity: numeric("quantity", { precision: 20, scale: 4 }).notNull().default("0"),
    unit: text("unit").notNull(),
    metadata: jsonb("metadata").default({}),
    timestamp: timestamp("timestamp", { withTimezone: true }).notNull(),
    ingestedAt: timestamp("ingested_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    eventIdUnique: uniqueIndex("uq_metering_events_event_id").on(table.eventId),
    tenantTimestampIdx: index("idx_metering_events_tenant_ts").on(table.tenantId, table.timestamp),
    eventTypeTimestampIdx: index("idx_metering_events_type_ts").on(table.eventType, table.timestamp),
  }),
);

export type MeteringEventRecord = typeof meteringEventsTable.$inferSelect;
export type InsertMeteringEvent = typeof meteringEventsTable.$inferInsert;
