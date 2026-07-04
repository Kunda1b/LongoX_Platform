import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

export const regionPoliciesTable = pgTable("region_policies", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  name: text("name").notNull(),
  region: text("region").notNull(),
  tier: text("tier").notNull().default("standard"),
  replicationFactor: integer("replication_factor").notNull().default(1),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type RegionPolicyRecord = typeof regionPoliciesTable.$inferSelect;
