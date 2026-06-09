import { pgTable, text, serial, integer, numeric, timestamp } from "drizzle-orm/pg-core";

export const tokenUsageTable = pgTable("token_usage", {
  id: serial("id").primaryKey(),
  modelId: integer("model_id"),
  modelName: text("model_name"),
  provider: text("provider"),
  promptId: integer("prompt_id"),
  workflowId: integer("workflow_id"),
  inputTokens: integer("input_tokens").notNull().default(0),
  outputTokens: integer("output_tokens").notNull().default(0),
  cost: numeric("cost", { precision: 12, scale: 6 }).notNull().default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type TokenUsageRecord = typeof tokenUsageTable.$inferSelect;
