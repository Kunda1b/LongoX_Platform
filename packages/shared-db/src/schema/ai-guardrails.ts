import { pgTable, text, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { tenantsTable } from "./tenants";

export const aiGuardrailsTable = pgTable("ai_guardrails", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  name: text("name").notNull(),
  type: text("type").notNull().default("content_filter"),
  config: jsonb("config").notNull().default({}),
  enabled: boolean("enabled").notNull().default(true),
  severity: text("severity").notNull().default("block"),
  tenantId: text("tenant_id")
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const aiGuardrailHitsTable = pgTable("ai_guardrail_hits", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  guardrailId: text("guardrail_id")
    .notNull()
    .references(() => aiGuardrailsTable.id, { onDelete: "cascade" }),
  runId: text("run_id"),
  promptId: text("prompt_id"),
  violationType: text("violation_type").notNull(),
  violationDetail: text("violation_detail"),
  blocked: boolean("blocked").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type AiGuardrailRecord = typeof aiGuardrailsTable.$inferSelect;
export type AiGuardrailHitRecord = typeof aiGuardrailHitsTable.$inferSelect;
