import {
  pgTable,
  text,
  serial,
  timestamp,
  integer,
  boolean,
  bigint,
} from "drizzle-orm/pg-core";

export const tenantTiersTable = pgTable("tenant_tiers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  infrastructureLevel: text("infrastructure_level").notNull(),
  maxWorkflows: integer("max_workflows").notNull(),
  maxConnectors: integer("max_connectors").notNull(),
  maxEnvironments: integer("max_environments").notNull(),
  maxMembers: integer("max_members").notNull(),
  maxStorageGb: integer("max_storage_gb").notNull(),
  maxAiTokensMonthly: bigint("max_ai_tokens_monthly", { mode: "number" }).notNull(),
  maxRagQueriesMonthly: bigint("max_rag_queries_monthly", { mode: "number" }).notNull(),
  includeAuditLogging: boolean("include_audit_logging").notNull().default(false),
  includeSso: boolean("include_sso").notNull().default(false),
  includeSla: text("include_sla").notNull().default("none"),
  hotRetentionDays: integer("hot_retention_days").notNull(),
  coldRetentionDays: integer("cold_retention_days").notNull(),
  regionsAllowed: text("regions_allowed").array().notNull().default([]),
  supportLevel: text("support_level").notNull().default("community"),
  monthlyPriceCents: integer("monthly_price_cents").notNull().default(0),
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

export const tenantTierAssignmentsTable = pgTable("tenant_tier_assignments", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id")
    .notNull()
    .unique(),
  tierId: integer("tier_id")
    .notNull(),
  assignedAt: timestamp("assigned_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  assignedBy: text("assigned_by").notNull(),
  changeReason: text("change_reason"),
  infrastructureLevel: text("infrastructure_level").notNull(),
  dedicatedNamespace: text("dedicated_namespace"),
  dedicatedClusterId: text("dedicated_cluster_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type TenantTierRecord = typeof tenantTiersTable.$inferSelect;
export type TenantTierAssignmentRecord = typeof tenantTierAssignmentsTable.$inferSelect;
