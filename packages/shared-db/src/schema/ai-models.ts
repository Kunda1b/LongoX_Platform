import { pgTable, text, serial, integer, boolean, numeric, jsonb, timestamp } from "drizzle-orm/pg-core";

export const aiModelsTable = pgTable("ai_models", {
  id: serial("id").primaryKey(),
  provider: text("provider").notNull(),
  name: text("name").notNull(),
  modelId: text("model_id").notNull(),
  contextWindow: integer("context_window").notNull().default(4096),
  inputCostPerToken: numeric("input_cost_per_token", { precision: 12, scale: 8 }).notNull().default("0"),
  outputCostPerToken: numeric("output_cost_per_token", { precision: 12, scale: 8 }).notNull().default("0"),
  isEnabled: boolean("is_enabled").notNull().default(true),
  config: jsonb("config").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type AiModelRecord = typeof aiModelsTable.$inferSelect;
