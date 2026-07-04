import { pgTable, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { tenantsTable } from "./tenants";
import { usersTable } from "./users";

export const gdprRequestsTable = pgTable("gdpr_requests", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  tenantId: text("tenant_id")
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  requestType: text("request_type").notNull(),
  status: text("status").notNull().default("pending"),
  dataScope: jsonb("data_scope").default({}),
  exportFormat: text("export_format"),
  exportStoragePath: text("export_storage_path"),
  rejectionReason: text("rejection_reason"),
  fulfilledBy: integer("fulfilled_by"),
  requestedAt: timestamp("requested_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export type GdprRequestRecord = typeof gdprRequestsTable.$inferSelect;
