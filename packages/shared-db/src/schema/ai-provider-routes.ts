import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  numeric,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";
import { tenantsTable } from "./tenants";

export const aiProviderRoutesTable = pgTable("ai_provider_routes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  provider: text("provider").notNull(),
  model: text("model").notNull(),
  priority: integer("priority").notNull().default(0),
  weight: integer("weight").notNull().default(1),
  capabilities: jsonb("capabilities").default({}),
  costPer1kInput: numeric("cost_per_1k_input", {
    precision: 12,
    scale: 8,
  })
    .notNull()
    .default("0"),
  costPer1kOutput: numeric("cost_per_1k_output", {
    precision: 12,
    scale: 8,
  })
    .notNull()
    .default("0"),
  rateLimitRpm: integer("rate_limit_rpm"),
  rateLimitTpm: integer("rate_limit_tpm"),
  tenantId: integer("tenant_id")
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type AiProviderRouteRecord = typeof aiProviderRoutesTable.$inferSelect;
