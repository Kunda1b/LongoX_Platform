import {
  pgTable,
  text,
  serial,
  integer,
  real,
  boolean,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";

export const regionsTable = pgTable("regions", {
  id: serial("id").primaryKey(),
  regionId: text("region_id").notNull().unique(),
  name: text("name").notNull(),
  endpoint: text("endpoint").notNull(),
  label: text("label"),
  priority: integer("priority").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  isPrimary: boolean("is_primary").notNull().default(false),
  capabilities: jsonb("capabilities").$type<string[]>().notNull().default([]),
  dataResidencyCompliant: boolean("data_residency_compliant").notNull().default(true),
  failoverPriority: integer("failover_priority"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const replicationConfigsTable = pgTable("replication_configs", {
  id: serial("id").primaryKey(),
  sourceRegionId: text("source_region_id").notNull(),
  targetRegionId: text("target_region_id").notNull(),
  entityType: text("entity_type").notNull(),
  replicationMode: text("replication_mode").notNull().default("async"),
  batchSize: integer("batch_size").notNull().default(100),
  syncIntervalMs: integer("sync_interval_ms").notNull().default(30000),
  conflictResolution: text("conflict_resolution").notNull().default("last-write-wins"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const replicationLogTable = pgTable("replication_log", {
  id: serial("id").primaryKey(),
  configId: integer("config_id").notNull(),
  entityId: text("entity_id").notNull(),
  entityType: text("entity_type").notNull(),
  sourceRegion: text("source_region").notNull(),
  targetRegion: text("target_region").notNull(),
  status: text("status").notNull().default("pending"),
  payload: jsonb("payload").default({}),
  errorMessage: text("error_message"),
  replicatedAt: timestamp("replicated_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const drPoliciesTable = pgTable("dr_policies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  primaryRegionId: text("primary_region_id").notNull(),
  failoverRegionId: text("failover_region_id").notNull(),
  recoveryTier: text("recovery_tier").notNull().default("standard"),
  rpoSeconds: integer("rpo_seconds").notNull().default(300),
  rtoSeconds: integer("rto_seconds").notNull().default(900),
  autoFailover: boolean("auto_failover").notNull().default(false),
  healthThreshold: real("health_threshold").notNull().default(0.3),
  isActive: boolean("is_active").notNull().default(true),
  lastDrillAt: timestamp("last_drill_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const revenueSharesTable = pgTable("revenue_shares", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id").notNull(),
  sellerTenantId: integer("seller_tenant_id").notNull(),
  platformPercentage: real("platform_percentage").notNull().default(20),
  sellerPercentage: real("seller_percentage").notNull().default(80),
  totalEarned: real("total_earned").notNull().default(0),
  platformRevenue: real("platform_revenue").notNull().default(0),
  sellerPayout: real("seller_payout").notNull().default(0),
  payoutStatus: text("payout_status").notNull().default("pending"),
  lastPayoutAt: timestamp("last_payout_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const agentDeploymentsTable = pgTable("agent_deployments", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id").notNull(),
  tenantId: integer("tenant_id").notNull(),
  deployedBy: integer("deployed_by").notNull(),
  targetEnvironment: text("target_environment").notNull().default("sandbox"),
  status: text("status").notNull().default("deploying"),
  config: jsonb("config").default({}),
  deploymentMetadata: jsonb("deployment_metadata").default({}),
  deployedAt: timestamp("deployed_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});
