import {
  pgTable,
  text,
  serial,
  timestamp,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";
export const platformEventsTable = pgTable("platform_events", {
  id: serial("id").primaryKey(),
  eventType: text("event_type").notNull(),
  aggregateId: text("aggregate_id").notNull(),
  aggregateType: text("aggregate_type").notNull(),
  payloadJson: jsonb("payload_json").notNull().default({}),
  actorId: text("actor_id"),
  correlationId: text("correlation_id"),
  occurredAt: timestamp("occurred_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
export const webhookDeliveriesTable = pgTable("webhook_deliveries", {
  id: serial("id").primaryKey(),
  endpointId: integer("endpoint_id").notNull(),
  status: text("status").notNull().default("pending"),
  requestHeaders: jsonb("request_headers").default({}),
  requestBody: text("request_body"),
  responseStatus: integer("response_status"),
  responseBody: text("response_body"),
  retryCount: integer("retry_count").notNull().default(0),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  nextRetryAt: timestamp("next_retry_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
