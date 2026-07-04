import { pgTable, text, timestamp, integer, bigint, jsonb } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { tenantsTable } from "./tenants";

export const backupRecordsTable = pgTable("backup_records", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  tenantId: text("tenant_id")
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  backupType: text("backup_type").notNull().default("manual"),
  scope: text("scope").notNull().default("full"),
  status: text("status").notNull().default("pending"),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  storagePath: text("storage_path"),
  fileSizeBytes: bigint("file_size_bytes", { mode: "number" }),
  checksum: text("checksum"),
  rowCounts: jsonb("row_counts").default({}),
  metadata: jsonb("metadata").default({}),
  errorMessage: text("error_message"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const restoreRecordsTable = pgTable("restore_records", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  backupId: text("backup_id")
    .notNull()
    .references(() => backupRecordsTable.id, { onDelete: "cascade" }),
  tenantId: text("tenant_id")
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  restoreType: text("restore_type").notNull().default("full"),
  status: text("status").notNull().default("pending"),
  targetEnvironment: text("target_environment"),
  tablesRestored: text("tables_restored").array(),
  rowCountRestored: integer("row_count_restored"),
  integrityChecked: integer("integrity_checked").notNull().default(0),
  integrityPassed: integer("integrity_passed").notNull().default(0),
  warnings: jsonb("warnings").default([]),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  restoredBy: text("restored_by"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type BackupRecord = typeof backupRecordsTable.$inferSelect;
export type RestoreRecord = typeof restoreRecordsTable.$inferSelect;
