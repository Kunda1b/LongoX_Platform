import {
  pgTable,
  text,
  serial,
  integer,
  jsonb,
  numeric,
  timestamp,
} from "drizzle-orm/pg-core";
import { tenantsTable } from "./tenants";

export const aiPlaygroundSessionsTable = pgTable("ai_playground_sessions", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id")
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  userId: integer("user_id"),
  prompt: text("prompt").notNull(),
  systemPrompt: text("system_prompt"),
  modelId: text("model_id").notNull(),
  provider: text("provider").notNull(),
  response: text("response"),
  inputTokens: integer("input_tokens").notNull().default(0),
  outputTokens: integer("output_tokens").notNull().default(0),
  cost: numeric("cost", { precision: 12, scale: 8 }).notNull().default("0"),
  latencyMs: integer("latency_ms").notNull().default(0),
  temperature: numeric("temperature", { precision: 3, scale: 2 }).default("0.7"),
  maxTokens: integer("max_tokens").default(1024),
  status: text("status").notNull().default("completed"),
  errorMessage: text("error_message"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type AiPlaygroundSessionRecord =
  typeof aiPlaygroundSessionsTable.$inferSelect;
