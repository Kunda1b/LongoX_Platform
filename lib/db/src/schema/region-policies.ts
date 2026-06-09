import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";

export const regionPoliciesTable = pgTable("region_policies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  region: text("region").notNull(),
  tier: text("tier").notNull().default("standard"),
  replicationFactor: integer("replication_factor").notNull().default(1),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type RegionPolicyRecord = typeof regionPoliciesTable.$inferSelect;
