import {
  pgTable,
  text,
  serial,
  timestamp,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";

export const usageEventsTable = pgTable("usage_events", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().default(0),
  workflowId: integer("workflow_id"),
  workflowName: text("workflow_name"),
  eventType: text("event_type").notNull(),
  quantity: integer("quantity").notNull().default(1),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type UsageEventRecord = typeof usageEventsTable.$inferSelect;
