import { pgTable, text, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

export const usageEventsTable = pgTable("usage_events", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  tenantId: text("tenant_id").notNull(),
  workflowId: text("workflow_id"),
  workflowName: text("workflow_name"),
  eventType: text("event_type").notNull(),
  quantity: integer("quantity").notNull().default(1),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type UsageEventRecord = typeof usageEventsTable.$inferSelect;
