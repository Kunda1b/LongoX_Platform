import { pgTable, text, integer, real, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

export const billingPlansTable = pgTable("billing_plans", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  name: text("name").notNull().unique(),
  displayName: text("display_name").notNull(),
  description: text("description"),
  tier: text("tier").notNull().default("free"),
  monthlyPrice: real("monthly_price").notNull().default(0),
  annualPrice: real("annual_price"),
  currency: text("currency").notNull().default("USD"),
  stripePriceIdMonthly: text("stripe_price_id_monthly"),
  stripePriceIdAnnual: text("stripe_price_id_annual"),
  stripeProductId: text("stripe_product_id"),
  includedExecutions: integer("included_executions").notNull().default(100),
  includedWorkflows: integer("included_workflows").notNull().default(5),
  includedConnectors: integer("included_connectors").notNull().default(3),
  includedAiTokens: integer("included_ai_tokens").notNull().default(10000),
  includedStorageMb: integer("included_storage_mb").notNull().default(500),
  maxUsers: integer("max_users").notNull().default(1),
  maxEnvironments: integer("max_environments").notNull().default(1),
  overageExecutionsPrice: real("overage_executions_price").notNull().default(0.01),
  overageAiTokensPrice: real("overage_ai_tokens_price").notNull().default(0.002),
  features: jsonb("features").default([]),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type BillingPlanRecord = typeof billingPlansTable.$inferSelect;
export type InsertBillingPlan = typeof billingPlansTable.$inferInsert;
