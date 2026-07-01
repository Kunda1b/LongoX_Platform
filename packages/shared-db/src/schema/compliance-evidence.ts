import { pgTable, text, serial, integer, timestamp, jsonb, date } from "drizzle-orm/pg-core";
import { tenantsTable } from "./tenants";

export const complianceEvidenceTable = pgTable("compliance_evidence", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id")
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  evidenceType: text("evidence_type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  payload: jsonb("payload").default({}),
  hash: text("hash").notNull(),
  source: text("source").notNull(),
  severity: text("severity").notNull().default("info"),
  retentionUntil: date("retention_until"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type ComplianceEvidenceRecord = typeof complianceEvidenceTable.$inferSelect;
