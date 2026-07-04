import { pgTable, text, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { tenantsTable } from "./tenants";

export const aiRoutingPoliciesTable = pgTable("ai_routing_policies", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  tenantId: text("tenant_id")
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  strategy: text("strategy").notNull().default("cheapest"),
  providerPreferences: jsonb("provider_preferences").default([]),
  modelAllowlist: jsonb("model_allowlist"),
  modelDenylist: jsonb("model_denylist"),
  fallbackEnabled: boolean("fallback_enabled").notNull().default(true),
  maxRetries: integer("max_retries").notNull().default(2),
  config: jsonb("config").default({}),
  isEnabled: boolean("is_enabled").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type AiRoutingPolicyRecord = typeof aiRoutingPoliciesTable.$inferSelect;
