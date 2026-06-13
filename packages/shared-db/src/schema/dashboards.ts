import { pgTable, text, serial, timestamp, jsonb, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { tenantsTable } from "./tenants";

export const dashboardsTable = pgTable("dashboards", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id")
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull().default("draft"),
  widgets: jsonb("widgets").notNull().default([]),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertDashboardSchema = createInsertSchema(dashboardsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertDashboard = z.infer<typeof insertDashboardSchema>;
export type DashboardRecord = typeof dashboardsTable.$inferSelect;
