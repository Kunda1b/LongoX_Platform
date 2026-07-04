import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { tenantsTable } from "./tenants";
import { usersTable } from "./users";

export const securityIncidentsTable = pgTable("security_incidents", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  tenantId: text("tenant_id")
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  incidentType: text("incident_type").notNull(),
  severity: text("severity").notNull().default("medium"),
  status: text("status").notNull().default("open"),
  title: text("title").notNull(),
  description: text("description"),
  detectedBy: text("detected_by").notNull().default("system"),
  resolvedBy: text("resolved_by").references(() => usersTable.id, {
    onDelete: "set null",
  }),
  resolution: text("resolution"),
  affectedResources: jsonb("affected_resources").default([]),
  metadata: jsonb("metadata").default({}),
  detectedAt: timestamp("detected_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const securityIncidentEvidenceTable = pgTable("security_incident_evidence", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  incidentId: text("incident_id")
    .notNull()
    .references(() => securityIncidentsTable.id, { onDelete: "cascade" }),
  evidenceType: text("evidence_type").notNull(),
  data: jsonb("data").default({}),
  hash: text("hash").notNull(),
  capturedAt: timestamp("captured_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type SecurityIncidentRecord = typeof securityIncidentsTable.$inferSelect;
export type SecurityIncidentEvidenceRecord = typeof securityIncidentEvidenceTable.$inferSelect;
