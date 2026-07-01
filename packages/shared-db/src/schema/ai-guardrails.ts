import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";
import { tenantsTable } from "./tenants";

export const aiGuardrailsTable = pgTable("ai_guardrails", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull().default("content_filter"),
  config: jsonb("config").notNull().default({}),
  enabled: boolean("enabled").notNull().default(true),
  severity: text("severity").notNull().default("block"),
  tenantId: integer("tenant_id")
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
  id: serial("id").primaryKey(),
  guardrailId: integer("guardrail_id")
    .notNull()
    .references(() => aiGuardrailsTable.id, { onDelete: "cascade" }),
  runId: integer("run_id"),
  promptId: integer("prompt_id"),
  violationType: text("violation_type").notNull(),
  violationDetail: text("violation_detail"),
  blocked: boolean("blocked").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type AiGuardrailRecord = typeof aiGuardrailsTable.$inferSelect;
export type AiGuardrailHitRecord = typeof aiGuardrailHitsTable.$inferSelect;
