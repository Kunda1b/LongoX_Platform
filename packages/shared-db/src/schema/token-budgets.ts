import {
  pgTable,
  text,
  serial,
  timestamp,
  integer,
  numeric,
  boolean,
} from "drizzle-orm/pg-core";
import { tenantsTable } from "./tenants";

export const tokenBudgetsTable = pgTable("token_budgets", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id")
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  scope: text("scope").notNull().default("global"),
  scopeId: integer("scope_id"),
  provider: text("provider"),
  model: text("model"),
  maxInputTokens: integer("max_input_tokens"),
  maxOutputTokens: integer("max_output_tokens"),
  maxTotalTokens: integer("max_total_tokens"),
  maxCost: numeric("max_cost", { precision: 12, scale: 6 }),
  period: text("period").notNull().default("monthly"),
  isActive: boolean("is_active").notNull().default(true),
  notifyAtPercent: integer("notify_at_percent").notNull().default(80),
  notifyChannel: text("notify_channel").default("email"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type TokenBudgetRecord = typeof tokenBudgetsTable.$inferSelect;
