import { pgTable, text, timestamp, boolean, integer, jsonb } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

export const tenantsTable = pgTable("tenants", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  plan: text("plan").notNull().default("free"),
  tier: integer("tier").notNull().default(1),
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
