import { pgTable, text, serial, integer, boolean, real, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const connectorsTable = pgTable("connectors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  displayName: text("display_name"),
  version: text("version").notNull().default("1.0.0"),
  sdkVersion: text("sdk_version").notNull().default("1.0"),
  category: text("category").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  color: text("color"),
  author: text("author"),
  permissions: jsonb("permissions").$type<string[]>().default([]),
  capabilities: jsonb("capabilities").$type<{
    actions: boolean; pollingTriggers: boolean; webhookTriggers: boolean;
    oauth2: boolean; apiKey: boolean; batching: boolean; pagination: boolean; fileUpload: boolean;
  }>().default({ actions: true, pollingTriggers: false, webhookTriggers: false, oauth2: false, apiKey: true, batching: false, pagination: false, fileUpload: false }),
  authType: text("auth_type").notNull().default("apikey"),
  authConfig: jsonb("auth_config").$type<{
    authorizationUrl?: string; tokenUrl?: string; scopes?: string[];
    refreshStrategy?: string; keyHeader?: string; keyPrefix?: string;
  }>().default({}),
  certificationLevel: text("certification_level").notNull().default("community"),
  rateLimit: jsonb("rate_limit").$type<{ requestsPerMinute: number; burst: number }>().default({ requestsPerMinute: 60, burst: 10 }),
  isInstalled: boolean("is_installed").notNull().default(false),
  isFeatured: boolean("is_featured").notNull().default(false),
  actionCount: integer("action_count").notNull().default(0),
  triggerCount: integer("trigger_count").notNull().default(0),
  installCount: integer("install_count").notNull().default(0),
  rating: real("rating"),
  healthStatus: jsonb("health_status").$type<{
    oauthFailureRate?: number; apiErrorRate?: number; avgLatencyMs?: number;
    availability?: number; lastChecked?: string;
  }>().default({}),
});

export const connectorActionsTable = pgTable("connector_actions", {
  id: serial("id").primaryKey(),
  connectorId: integer("connector_id").notNull().references(() => connectorsTable.id, { onDelete: "cascade" }),
  actionId: text("action_id").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  inputSchema: jsonb("input_schema").$type<Record<string, unknown>>().notNull().default({}),
  outputSchema: jsonb("output_schema").$type<Record<string, unknown>>().notNull().default({}),
});

export const connectorTriggersTable = pgTable("connector_triggers", {
  id: serial("id").primaryKey(),
  connectorId: integer("connector_id").notNull().references(() => connectorsTable.id, { onDelete: "cascade" }),
  triggerId: text("trigger_id").notNull(),
  triggerType: text("trigger_type").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  config: jsonb("config").$type<Record<string, unknown>>().default({}),
  pollingInterval: integer("polling_interval"),
});

export const connectorExecutionsTable = pgTable("connector_executions", {
  id: serial("id").primaryKey(),
  connectorId: integer("connector_id").notNull(),
  connectorVersion: text("connector_version").notNull(),
  executionId: text("execution_id").notNull(),
  actionId: text("action_id"),
  triggerId: text("trigger_id"),
  tenantId: text("tenant_id").notNull().default("default"),
  status: text("status").notNull(),
  durationMs: integer("duration_ms"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const connectorPollingStatesTable = pgTable("connector_polling_states", {
  id: serial("id").primaryKey(),
  connectorId: integer("connector_id").notNull(),
  triggerId: text("trigger_id").notNull(),
  tenantId: text("tenant_id").notNull().default("default"),
  lastCursor: text("last_cursor"),
  lastRunAt: timestamp("last_run_at", { withTimezone: true }),
});

export const insertConnectorSchema = createInsertSchema(connectorsTable).omit({ id: true });
export type InsertConnector = z.infer<typeof insertConnectorSchema>;
export type Connector = typeof connectorsTable.$inferSelect;
