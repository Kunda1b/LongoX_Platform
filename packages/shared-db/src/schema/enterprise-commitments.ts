import {
  pgTable,
  text,
  serial,
  timestamp,
  integer,
  numeric,
  jsonb,
  boolean,
} from "drizzle-orm/pg-core";
import { tenantsTable } from "./tenants";

export const enterpriseCommitmentsTable = pgTable("enterprise_commitments", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id")
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  commitmentType: text("commitment_type").notNull(),
  annualAmount: numeric("annual_amount", { precision: 12, scale: 6 }).notNull().default("0"),
  currency: text("currency").notNull().default("usd"),
  includedExecutions: integer("included_executions").notNull().default(0),
  includedAiTokens: integer("included_ai_tokens").notNull().default(0),
  includedRagQueries: integer("included_rag_queries").notNull().default(0),
  includedStorageGb: integer("included_storage_gb").notNull().default(0),
  maxWorkflows: integer("max_workflows"),
  maxMembers: integer("max_members"),
  maxConnectors: integer("max_connectors"),
  maxDashboards: integer("max_dashboards"),
  startDate: timestamp("start_date", { withTimezone: true }).notNull(),
  endDate: timestamp("end_date", { withTimezone: true }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type EnterpriseCommitmentRecord = typeof enterpriseCommitmentsTable.$inferSelect;
export type InsertEnterpriseCommitment = typeof enterpriseCommitmentsTable.$inferInsert;
