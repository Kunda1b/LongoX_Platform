import {
  pgTable,
  text,
  serial,
  timestamp,
  integer,
  bigint,
  date,
} from "drizzle-orm/pg-core";

export const archiveExportsTable = pgTable("archive_exports", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  tableName: text("table_name").notNull(),
  partitionName: text("partition_name").notNull(),
  exportFormat: text("export_format").notNull().default("parquet"),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  rowCount: integer("row_count"),
  fileSizeBytes: bigint("file_size_bytes", { mode: "number" }),
  filePath: text("file_path").notNull(),
  storageUrl: text("storage_url"),
  status: text("status").notNull().default("pending"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export type ArchiveExportRecord = typeof archiveExportsTable.$inferSelect;
