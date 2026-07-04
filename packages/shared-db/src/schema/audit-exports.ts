import { pgTable, text, integer, timestamp, jsonb, date, bigint } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { tenantsTable } from "./tenants";

export const auditExportsTable = pgTable("audit_exports", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  tenantId: text("tenant_id")
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  format: text("format").notNull(),
  status: text("status").notNull().default("pending"),
  dateFrom: date("date_from").notNull(),
  dateTo: date("date_to").notNull(),
  filterCriteria: jsonb("filter_criteria").default({}),
  rowCount: integer("row_count"),
  fileSizeBytes: bigint("file_size_bytes", { mode: "number" }),
  storagePath: text("storage_path"),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
});

export type AuditExportRecord = typeof auditExportsTable.$inferSelect;
