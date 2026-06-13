import {
  pgTable,
  text,
  serial,
  integer,
  real,
  boolean,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const marketplaceListingsTable = pgTable("marketplace_listings", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  listingType: text("listing_type").notNull(),
  category: text("category").notNull().default("general"),
  tags: text("tags").array().notNull().default([]),
  author: text("author").notNull().default("LongoX"),
  authorId: integer("author_id").notNull().default(0),
  tenantId: integer("tenant_id"),
  version: text("version").notNull().default("1.0.0"),
  status: text("status").notNull().default("draft"),
  visibility: text("visibility").notNull().default("private"),
  installCount: integer("install_count").notNull().default(0),
  rating: real("rating").notNull().default(0),
  reviewCount: integer("review_count").notNull().default(0),
  featured: boolean("featured").notNull().default(false),
  verified: boolean("verified").notNull().default(false),
  pricing: jsonb("pricing")
    .$type<{ free: boolean; price?: number; currency?: string }>()
    .notNull()
    .default({ free: true }),
  resourceId: integer("resource_id"),
  nodes: jsonb("nodes").notNull().default([]),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const marketplaceInstallsTable = pgTable("marketplace_installs", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id")
    .notNull()
    .references(() => marketplaceListingsTable.id, { onDelete: "cascade" }),
  tenantId: integer("tenant_id").notNull(),
  installedBy: integer("installed_by").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertMarketplaceListingSchema = createInsertSchema(
  marketplaceListingsTable,
).omit({ id: true, createdAt: true, updatedAt: true });

export type MarketplaceListing = typeof marketplaceListingsTable.$inferSelect;
export type InsertMarketplaceListing = z.infer<
  typeof insertMarketplaceListingSchema
>;
