import { pgTable, serial, text, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const userMfaTable = pgTable("user_mfa", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  method: text("method").notNull().default("totp"),
  secret: text("secret").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const ssoConnectionsTable = pgTable("sso_connections", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id"),
  provider: text("provider").notNull(),
  providerClientId: text("provider_client_id").notNull(),
  providerClientSecret: text("provider_client_secret").notNull(),
  providerIssuerUrl: text("provider_issuer_url"),
  enabled: boolean("enabled").notNull().default(true),
  domain: text("domain"),
  metadata: text("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const userSsoIdentitiesTable = pgTable("user_sso_identities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(),
  providerUserId: text("provider_user_id").notNull(),
  providerEmail: text("provider_email"),
  rawAttributes: text("raw_attributes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
