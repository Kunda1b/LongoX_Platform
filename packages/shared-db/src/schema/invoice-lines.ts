import {
  pgTable,
  text,
  serial,
  timestamp,
  integer,
  numeric,
  uuid,
} from "drizzle-orm/pg-core";
import { tenantsTable } from "./tenants";

export const invoiceLinesTable = pgTable("invoice_lines", {
  id: serial("id").primaryKey(),
  invoiceId: text("invoice_id").notNull(),
  tenantId: integer("tenant_id")
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  lineType: text("line_type").notNull(),
  description: text("description"),
  quantity: numeric("quantity", { precision: 20, scale: 4 }).notNull().default("0"),
  unitPrice: numeric("unit_price", { precision: 12, scale: 6 }).notNull().default("0"),
  amount: numeric("amount", { precision: 12, scale: 6 }).notNull().default("0"),
  currency: text("currency").notNull().default("usd"),
  periodStart: timestamp("period_start", { withTimezone: true }),
  periodEnd: timestamp("period_end", { withTimezone: true }),
  sourceEventIds: uuid("source_event_ids").array().notNull().default([]),
  stripeLineItemId: text("stripe_line_item_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type InvoiceLineRecord = typeof invoiceLinesTable.$inferSelect;
export type InsertInvoiceLine = typeof invoiceLinesTable.$inferInsert;
