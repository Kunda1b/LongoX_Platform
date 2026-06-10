import {
  pgTable,
  text,
  serial,
  timestamp,
  integer,
  real,
  jsonb,
} from "drizzle-orm/pg-core";
import { tenantsTable } from "./tenants";
export const billingAccountsTable = pgTable("billing_accounts", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id")
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  providerRef: text("provider_ref"),
  status: text("status").notNull().default("active"),
  currency: text("currency").notNull().default("USD"),
  paymentMethod: jsonb("payment_method").default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
export const invoicesTable = pgTable("invoices", {
  id: serial("id").primaryKey(),
  billingAccountId: integer("billing_account_id")
    .notNull()
    .references(() => billingAccountsTable.id, { onDelete: "cascade" }),
  invoiceNumber: text("invoice_number").notNull().unique(),
  periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
  periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
  status: text("status").notNull().default("draft"),
  totalAmount: real("total_amount").notNull().default(0),
  currency: text("currency").notNull().default("USD"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
export const invoiceLinesTable = pgTable("invoice_lines", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id")
    .notNull()
    .references(() => invoicesTable.id, { onDelete: "cascade" }),
  metricCode: text("metric_code").notNull(),
  description: text("description"),
  quantity: real("quantity").notNull().default(0),
  unitPrice: real("unit_price").notNull().default(0),
  totalPrice: real("total_price").notNull().default(0),
});
