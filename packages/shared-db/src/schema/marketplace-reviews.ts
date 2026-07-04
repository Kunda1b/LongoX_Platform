import { pgTable, text, real, boolean, timestamp } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { marketplaceListingsTable } from "./marketplace-listings";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const marketplaceReviewsTable = pgTable("marketplace_reviews", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  listingId: text("listing_id")
    .notNull()
    .references(() => marketplaceListingsTable.id, { onDelete: "cascade" }),
  tenantId: text("tenant_id").notNull(),
  userId: text("user_id").notNull(),
  rating: real("rating").notNull(),
  title: text("title"),
  body: text("body"),
  verified: boolean("verified").notNull().default(false),
  status: text("status").notNull().default("approved"),
  rejectionReason: text("rejection_reason"),
  moderatedBy: text("moderated_by"),
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
