import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";

export const webhookEndpointsTable = pgTable("webhook_endpoints", {
  id: serial("id").primaryKey(),
  workflowId: integer("workflow_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  secret: text("secret"),
  isActive: boolean("is_active").notNull().default(true),
  lastTriggeredAt: timestamp("last_triggered_at", { withTimezone: true }),
  triggerCount: integer("trigger_count").notNull().default(0),
  allowedIps: jsonb("allowed_ips").default([]),
  headers: jsonb("headers").default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
