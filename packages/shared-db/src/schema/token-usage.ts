import { pgTable, text, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { tenantsTable } from "./tenants";

export const tokenUsageTable = pgTable("token_usage", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  tenantId: text("tenant_id")
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  modelId: text("model_id"),
  modelName: text("model_name"),
  provider: text("provider"),
  promptId: text("prompt_id"),
  workflowId: text("workflow_id"),
  inputTokens: integer("input_tokens").notNull().default(0),
  outputTokens: integer("output_tokens").notNull().default(0),
  cost: numeric("cost", { precision: 12, scale: 6 }).notNull().default("0"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type TokenUsageRecord = typeof tokenUsageTable.$inferSelect;
