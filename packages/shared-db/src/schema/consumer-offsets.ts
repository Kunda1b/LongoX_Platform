import { pgTable, text, timestamp, primaryKey } from "drizzle-orm/pg-core";

export const consumerOffsetsTable = pgTable("consumer_offsets", {
  consumerName: text("consumer_name").notNull(),
  eventId: text("event_id").notNull(),
  aggregateId: text("aggregate_id").notNull(),
  processedAt: timestamp("processed_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  status: text("status").notNull().default("processing"),
  error: text("error"),
}, (table) => [
  primaryKey({ columns: [table.consumerName, table.eventId] }),
]);
