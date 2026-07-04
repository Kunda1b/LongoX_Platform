import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { tenantsTable } from "./tenants";
import { regionsTable } from "./regions";

export const tenantPlacementTable = pgTable("tenant_placement", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  tenantId: text("tenant_id")
    .notNull()
    .unique()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  placementType: text("placement_type").notNull(),
  regionId: text("region_id")
    .notNull()
    .references(() => regionsTable.id),
  clusterId: text("cluster_id").notNull(),
  namespace: text("namespace"),
  resourcePool: text("resource_pool"),
  isolationGroup: text("isolation_group"),
  networkCidr: text("network_cidr"),
  status: text("status").notNull().default("provisioning"),
  provisionedAt: timestamp("provisioned_at", { withTimezone: true }),
  lastHeartbeat: timestamp("last_heartbeat", { withTimezone: true }),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type TenantPlacementRecord = typeof tenantPlacementTable.$inferSelect;
