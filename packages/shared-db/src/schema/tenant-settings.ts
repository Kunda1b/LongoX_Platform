import {
  pgTable,
  text,
  serial,
  timestamp,
  integer,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";
import { tenantsTable } from "./tenants";

export const tenantSettingsTable = pgTable("tenant_settings", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id")
    .notNull()
    .unique()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  retentionHotDays: integer("retention_hot_days").notNull().default(395),
  retentionColdDays: integer("retention_cold_days").notNull().default(2555),
  maxWorkflowCount: integer("max_workflow_count"),
  maxExecutionConcurrency: integer("max_execution_concurrency"),
  maxConnectorInstalls: integer("max_connector_installs"),
  maxAiRequestsPerDay: integer("max_ai_requests_per_day"),
  allowedRegions: text("allowed_regions").array().notNull().default([]),
  allowedAuthProviders: text("allowed_auth_providers").array(),
  ipAllowlist: text("ip_allowlist").array(),
  webhookRequireSignature: boolean("webhook_require_signature").notNull().default(true),
  auditRetentionDays: integer("audit_retention_days").notNull().default(365),
  sessionTimeoutMinutes: integer("session_timeout_minutes").notNull().default(480),
  mfaRequired: boolean("mfa_required").notNull().default(false),
  ssoRequired: boolean("sso_required").notNull().default(false),
  features: jsonb("features").default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type TenantSettingRecord = typeof tenantSettingsTable.$inferSelect;
