import { pgTable, text, serial, timestamp, jsonb, integer } from "drizzle-orm/pg-core";
import { tenantsTable } from "./tenants";

export const auditLogTable = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id")
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  actorType: text("actor_type").notNull().default("system"),
  actorId: text("actor_id"),
  action: text("action").notNull(),
  resourceType: text("resource_type").notNull(),
  resourceId: text("resource_id").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type AuditLogEntry = typeof auditLogTable.$inferSelect;
