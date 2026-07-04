import { pgTable, text, integer, real, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const marketplaceListingsTable = pgTable("marketplace_listings", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  listingType: text("listing_type").notNull(),
  category: text("category").notNull().default("general"),
  tags: text("tags").array().notNull().default([]),
  author: text("author").notNull().default("LongoX"),
  authorId: text("author_id"),
  tenantId: text("tenant_id"),
  version: text("version").notNull().default("1.0.0"),
  status: text("status").notNull().default("draft"),
  visibility: text("visibility").notNull().default("private"),
  installCount: integer("install_count").notNull().default(0),
  rating: real("rating").notNull().default(0),
  reviewCount: integer("review_count").notNull().default(0),
  featured: boolean("featured").notNull().default(false),
  verified: boolean("verified").notNull().default(false),
  pricing: jsonb("pricing")
    .$type<{ free: boolean; price?: number; currency?: string; subscription?: boolean }>()
    .notNull()
    .default({ free: true }),
  resourceId: text("resource_id"),
  nodes: jsonb("nodes").notNull().default([]),
  metadata: jsonb("metadata").notNull().default({}),
  platformSharePercent: integer("platform_share_percent").notNull().default(20),
  sellerPayoutAccount: text("seller_payout_account"),
  totalRevenue: real("total_revenue").notNull().default(0),
  isPublic: boolean("is_public").notNull().default(false),
  communityTemplate: boolean("community_template").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const marketplaceInstallsTable = pgTable("marketplace_installs", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  listingId: text("listing_id")
    .notNull()
    .references(() => marketplaceListingsTable.id, { onDelete: "cascade" }),
  tenantId: text("tenant_id").notNull(),
  installedBy: text("installed_by"),
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
