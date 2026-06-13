import {
  pgTable,
  text,
  serial,
  timestamp,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";

export const tenantsTable = pgTable("tenants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  plan: text("plan").notNull().default("free"),
  isActive: boolean("is_active").notNull().default(true),
  primaryRegion: text("primary_region"),
  allowedRegions: text("allowed_regions").array().notNull().default([]),
  dataResidencyRequired: boolean("data_residency_required").notNull().default(false),
  settings: jsonb("settings").default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type TenantRecord = typeof tenantsTable.$inferSelect;
