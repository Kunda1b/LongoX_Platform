import { pgTable, text, serial, integer, real, boolean, timestamp } from "drizzle-orm/pg-core";
import { marketplaceListingsTable } from "./marketplace-listings";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const marketplaceReviewsTable = pgTable("marketplace_reviews", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id")
    .notNull()
    .references(() => marketplaceListingsTable.id, { onDelete: "cascade" }),
  tenantId: integer("tenant_id").notNull(),
  userId: integer("user_id").notNull(),
  rating: real("rating").notNull(),
  title: text("title"),
  body: text("body"),
  verified: boolean("verified").notNull().default(false),
  status: text("status").notNull().default("approved"),
  rejectionReason: text("rejection_reason"),
  moderatedBy: integer("moderated_by"),
  moderatedAt: timestamp("moderated_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertMarketplaceReviewSchema = createInsertSchema(
  marketplaceReviewsTable,
).omit({ id: true, createdAt: true, updatedAt: true, verified: true, status: true, rejectionReason: true, moderatedBy: true, moderatedAt: true });

export type MarketplaceReview = typeof marketplaceReviewsTable.$inferSelect;
export type InsertMarketplaceReview = z.infer<typeof insertMarketplaceReviewSchema>;
