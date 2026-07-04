import { pgTable, text, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
export const platformEventsTable = pgTable("platform_events", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  eventType: text("event_type").notNull(),
  eventVersion: integer("event_version").notNull().default(1),
  aggregateId: text("aggregate_id").notNull(),
  aggregateType: text("aggregate_type").notNull(),
  payloadJson: jsonb("payload_json").notNull().default({}),
  actorId: text("actor_id"),
  correlationId: text("correlation_id"),
  schemaUrl: text("schema_url"),
  occurredAt: timestamp("occurred_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
export const webhookDeliveriesTable = pgTable("webhook_deliveries", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  endpointId: text("endpoint_id").notNull(),
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
