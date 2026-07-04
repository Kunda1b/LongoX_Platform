import { Router, type IRouter } from "express";
import { authorize, requireTenantContext } from "@longox/shared-rbac";
import { PostgresListingRepository } from "../infrastructure";
import {
  SearchListingsQuery,
  InstallListingCommand,
} from "../application/search-listings.query";
import type { Request } from "express";
import { db, revenueSharesTable, marketplaceInstallsTable, agentDeploymentsTable, marketplaceListingsTable, marketplaceReviewsTable } from "@longox/db";
import { and, desc, eq, sql } from "drizzle-orm";

const router: IRouter = Router();
const repository = new PostgresListingRepository();
const searchQuery = new SearchListingsQuery(repository);
const installCommand = new InstallListingCommand(repository);

router.get(
  "/marketplace/listings",
  authorize({ resource: "templates", action: "read" }),
  async (req, res): Promise<void> => {
    const {
      type,
      category,
      search,
      featured,
      limit: limitStr,
      offset: offsetStr,
      isPublic,
      communityTemplate,
    } = req.query as Record<string, string | undefined>;

    const result = await searchQuery.execute({
      type: type as any,
      category,
      search,
      featured: featured === "true",
      limit: limitStr ? parseInt(limitStr) : 50,
      offset: offsetStr ? parseInt(offsetStr) : 0,
    });

    let listings = Array.isArray(result) ? result : (result as any).listings ?? result;

    if (isPublic === "true") {
      listings = listings.filter((l: any) => l.isPublic === true);
    }
    if (communityTemplate === "true") {
      listings = listings.filter((l: any) => l.communityTemplate === true);
    }

    res.json(listings);
  },
);

router.get(
  "/marketplace/listings/:id",
  authorize({ resource: "templates", action: "read" }),
  async (req, res): Promise<void> => {
    const id = req.params.id;
    if (!id) {
      res.status(400).json({ error: "id is required" });
      return;
    }

    const listing = await repository.findById(id);
    if (!listing) {
      res.status(404).json({ error: "Listing not found" });
      return;
    }

    res.json(listing.toJSON());
  },
);

router.post(
  "/marketplace/listings",
  authorize({ resource: "templates", action: "write" }),
  requireTenantContext,
  async (req, res): Promise<void> => {
    const {
      title,
      description,
      listingType,
      category,
      tags,
      version,
      metadata,
      isPublic,
      communityTemplate,
      platformSharePercent,
    } = req.body as Record<string, unknown>;
    if (!title || !listingType) {
      res.status(400).json({ error: "title and listingType are required" });
      return;
    }

    const pricing = req.body.pricing as { free: boolean; price?: number; subscription?: boolean } | undefined;

    const listing = await repository.create({
      title: String(title),
      description: String(description ?? ""),
      listingType: String(listingType) as any,
      category: String(category ?? "general"),
      tags: (tags ?? []) as string[],
      author: req.user?.name ?? "Anonymous",
      authorId: req.user?.id ?? 0,
      version: String(version ?? "1.0.0"),
      status: "draft",
      installCount: 0,
      rating: 0,
      reviewCount: 0,
      featured: false,
      verified: false,
      pricing: pricing ? { free: pricing.free, price: pricing.price, tier: undefined } : { free: true },
      metadata: (metadata ?? {}) as Record<string, unknown>,
      isPublic: Boolean(isPublic ?? false),
      communityTemplate: Boolean(communityTemplate ?? false),
      platformSharePercent: Number(platformSharePercent ?? 20),
      totalRevenue: 0,
    } as any);

    const listingData = listing.toJSON();

    if (listingData.pricing && !listingData.pricing.free && listingData.authorId) {
      await db.insert(revenueSharesTable).values({
        listingId: listingData.id,
        sellerTenantId: listingData.authorId,
        platformPercentage: Number(platformSharePercent ?? 20),
        sellerPercentage: 100 - Number(platformSharePercent ?? 20),
        totalEarned: 0,
        platformRevenue: 0,
        sellerPayout: 0,
        payoutStatus: "pending",
      });
    }

    res.status(201).json(listingData);
  },
);

router.post(
  "/marketplace/listings/:id/install",
  authorize({ resource: "templates", action: "write" }),
  requireTenantContext,
  async (req, res): Promise<void> => {
    const id = req.params.id;
    if (!id) {
      res.status(400).json({ error: "id is required" });
      return;
    }

    try {
      await installCommand.execute({
        listingId: id,
        tenantId: req.user!.tenantId!,
        installedBy: req.user!.id,
      });
      res.json({ success: true });
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  },
);

router.post(
  "/marketplace/listings/:id/publish",
  authorize({ resource: "templates", action: "write" }),
  requireTenantContext,
  async (req, res): Promise<void> => {
    const id = req.params.id;
    if (!id) {
      res.status(400).json({ error: "id is required" });
      return;
    }

    const listing = await repository.findById(id);
    if (!listing) {
      res.status(404).json({ error: "Listing not found" });
      return;
    }

    listing.publish();
    await repository.update(id, { status: "published" } as any);
    res.json(listing.toJSON());
  },
);

router.post(
  "/marketplace/listings/:id/unpublish",
  authorize({ resource: "templates", action: "write" }),
  requireTenantContext,
  async (req, res): Promise<void> => {
    const id = req.params.id;
    if (!id) {
      res.status(400).json({ error: "id is required" });
      return;
    }

    const listing = await repository.findById(id);
    if (!listing) {
      res.status(404).json({ error: "Listing not found" });
      return;
    }

    listing.archive();
    await repository.update(id, { status: "archived" } as any);
    res.json(listing.toJSON());
  },
);

router.put(
  "/marketplace/listings/:id",
  authorize({ resource: "templates", action: "write" }),
  requireTenantContext,
  async (req, res): Promise<void> => {
    const id = req.params.id;
    if (!id) {
      res.status(400).json({ error: "id is required" });
      return;
    }

    const { title, description, category, tags, pricing, metadata, isPublic, communityTemplate } =
      req.body as Record<string, unknown>;

    const listing = await repository.update(id, {
      title: title ? String(title) : undefined,
      description: description ? String(description) : undefined,
      category: category ? String(category) : undefined,
      tags: tags ? (tags as string[]) : undefined,
      pricing: pricing as any,
      metadata: metadata as any,
      isPublic: isPublic !== undefined ? Boolean(isPublic) : undefined,
      communityTemplate: communityTemplate !== undefined ? Boolean(communityTemplate) : undefined,
    } as any);
    res.json(listing.toJSON());
  },
);

router.delete(
  "/marketplace/listings/:id",
  authorize({ resource: "templates", action: "write" }),
  requireTenantContext,
  async (req, res): Promise<void> => {
    const id = req.params.id;
    if (!id) {
      res.status(400).json({ error: "id is required" });
      return;
    }

    await repository.delete(id);
    res.status(204).end();
  },
);

router.post(
  "/marketplace/listings/:id/deploy",
  authorize({ resource: "templates", action: "write" }),
  requireTenantContext,
  async (req, res): Promise<void> => {
    const id = req.params.id;
    if (!id) {
      res.status(400).json({ error: "id is required" });
      return;
    }

    const listing = await repository.findById(id);
    if (!listing) {
      res.status(404).json({ error: "Listing not found" });
      return;
    }

    const listingData = listing.toJSON();
    if ((listingData.listingType as string) !== "agent") {
      res.status(400).json({ error: "Only agent listings can be deployed" });
      return;
    }

    const { targetEnvironment, config } = req.body as {
      targetEnvironment?: string;
      config?: Record<string, unknown>;
    };

    const [deployment] = await db
      .insert(agentDeploymentsTable)
      .values({
        listingId: id,
        tenantId: req.user!.tenantId!,
        deployedBy: req.user!.id,
        targetEnvironment: targetEnvironment ?? "sandbox",
        status: "deploying",
        config: config ?? {},
        deploymentMetadata: {
          listingTitle: listingData.title,
          listingVersion: listingData.version,
          region: process.env["REGION_ID"] ?? "local",
        },
      })
      .returning();

    res.status(201).json({
      success: true,
      listingId: id,
      deploymentId: deployment.id,
      targetEnvironment: deployment.targetEnvironment,
      status: deployment.status,
      config: deployment.config,
    });
  },
);

router.get(
  "/marketplace/listings/:id/revenue",
  authorize({ resource: "templates", action: "read" }),
  requireTenantContext,
  async (req, res): Promise<void> => {
    const id = req.params.id;
    if (!id) {
      res.status(400).json({ error: "id is required" });
      return;
    }

    const shares = await db
      .select()
      .from(revenueSharesTable)
      .where(eq(revenueSharesTable.listingId, id));

    const installs = await db
      .select()
      .from(marketplaceInstallsTable)
      .where(eq(marketplaceInstallsTable.listingId, id));

    res.json({
      revenue: shares[0] ?? null,
      totalInstalls: installs.length,
      installs,
    });
  },
);

router.put(
  "/marketplace/revenue/:id/payout",
  authorize({ resource: "templates", action: "write" }),
  async (req, res): Promise<void> => {
    const id = req.params.id;
    if (!id) {
      res.status(400).json({ error: "id is required" });
      return;
    }

    const [updated] = await db
      .update(revenueSharesTable)
      .set({
        payoutStatus: "completed",
        lastPayoutAt: new Date(),
      })
      .where(eq(revenueSharesTable.id, id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Revenue share not found" });
      return;
    }

    res.json(updated);
  },
);

router.get(
  "/marketplace/revenue/summary",
  authorize({ resource: "templates", action: "read" }),
  requireTenantContext,
  async (req, res): Promise<void> => {
    const tenantId = req.user!.tenantId!;

    const shares = await db
      .select()
      .from(revenueSharesTable)
      .where(eq(revenueSharesTable.sellerTenantId, tenantId));

    const totalEarned = shares.reduce((sum, s) => sum + Number(s.totalEarned ?? 0), 0);
    const totalPayout = shares.reduce((sum, s) => sum + Number(s.sellerPayout ?? 0), 0);
    const pendingPayouts = shares.filter((s) => s.payoutStatus === "pending");

    res.json({
      totalListings: shares.length,
      totalEarned,
      totalPayout,
      pendingPayouts: pendingPayouts.length,
      pendingAmount: pendingPayouts.reduce((sum, s) => sum + Number(s.sellerPayout ?? 0), 0),
      shares,
    });
  },
);

// ─── Reviews ─────────────────────────────────────────────────────────────────

router.get(
  "/marketplace/listings/:id/reviews",
  authorize({ resource: "templates", action: "read" }),
  async (req, res): Promise<void> => {
    const listingId = req.params.id;
    if (isNaN(listingId)) {
      res.status(400).json({ error: "id is required" });
      return;
    }

    const rows = await db
      .select()
      .from(marketplaceReviewsTable)
      .where(
        and(
          eq(marketplaceReviewsTable.listingId, listingId),
          eq(marketplaceReviewsTable.status, "approved"),
        ),
      )
      .orderBy(desc(marketplaceReviewsTable.createdAt));

    res.json(rows);
  },
);

router.post(
  "/marketplace/listings/:id/reviews",
  authorize({ resource: "templates", action: "write" }),
  requireTenantContext,
  async (req, res): Promise<void> => {
    const listingId = req.params.id;
    if (isNaN(listingId)) {
      res.status(400).json({ error: "id is required" });
      return;
    }

    const { rating, title, body } = req.body as Record<string, unknown>;
    if (!rating || typeof Number(rating) !== "number" || Number(rating) < 0.5 || Number(rating) > 5) {
      res.status(400).json({ error: "rating is required and must be between 0.5 and 5" });
      return;
    }

    const [row] = await db
      .insert(marketplaceReviewsTable)
      .values({
        listingId,
        tenantId: req.user!.tenantId!,
        userId: req.user!.id,
        rating: Number(rating),
        title: title ? String(title) : null,
        body: body ? String(body) : null,
      })
      .returning();

    const reviews = await db
      .select({ avg: sql<number>`avg(${marketplaceReviewsTable.rating})` })
      .from(marketplaceReviewsTable)
      .where(
        and(
          eq(marketplaceReviewsTable.listingId, listingId),
          eq(marketplaceReviewsTable.status, "approved"),
        ),
      );

    const avgRating = reviews[0]?.avg ?? Number(rating);
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(marketplaceReviewsTable)
      .where(eq(marketplaceReviewsTable.listingId, listingId));

    await db
      .update(marketplaceListingsTable)
      .set({ rating: avgRating, reviewCount: count })
      .where(eq(marketplaceListingsTable.id, listingId));

    res.status(201).json(row);
  },
);

router.put(
  "/marketplace/reviews/:id",
  authorize({ resource: "templates", action: "write" }),
  requireTenantContext,
  async (req, res): Promise<void> => {
    const reviewId = req.params.id;
    if (isNaN(reviewId)) {
      res.status(400).json({ error: "id is required" });
      return;
    }

    const [review] = await db
      .select()
      .from(marketplaceReviewsTable)
      .where(
        and(
          eq(marketplaceReviewsTable.id, reviewId),
          eq(marketplaceReviewsTable.userId, req.user!.id),
        ),
      )
      .limit(1);

    if (!review) {
      res.status(404).json({ error: "Review not found or not owned by you" });
      return;
    }

    const { rating, title, body } = req.body as Record<string, unknown>;
    const [updated] = await db
      .update(marketplaceReviewsTable)
      .set({
        rating: rating ? Number(rating) : review.rating,
        title: title !== undefined ? String(title) : review.title,
        body: body !== undefined ? String(body) : review.body,
        updatedAt: new Date(),
      })
      .where(eq(marketplaceReviewsTable.id, reviewId))
      .returning();

    if (rating) {
      const [{ avg }] = await db
        .select({ avg: sql<number>`avg(${marketplaceReviewsTable.rating})` })
        .from(marketplaceReviewsTable)
        .where(eq(marketplaceReviewsTable.listingId, review.listingId));
      await db
        .update(marketplaceListingsTable)
        .set({ rating: avg })
        .where(eq(marketplaceListingsTable.id, review.listingId));
    }

    res.json(updated);
  },
);

router.delete(
  "/marketplace/reviews/:id",
  authorize({ resource: "templates", action: "write" }),
  requireTenantContext,
  async (req, res): Promise<void> => {
    const reviewId = req.params.id;
    if (isNaN(reviewId)) {
      res.status(400).json({ error: "id is required" });
      return;
    }

    const [review] = await db
      .select()
      .from(marketplaceReviewsTable)
      .where(
        and(
          eq(marketplaceReviewsTable.id, reviewId),
          eq(marketplaceReviewsTable.userId, req.user!.id),
        ),
      )
      .limit(1);

    if (!review) {
      res.status(404).json({ error: "Review not found or not owned by you" });
      return;
    }

    await db
      .delete(marketplaceReviewsTable)
      .where(eq(marketplaceReviewsTable.id, reviewId));

    const [{ avg }] = await db
      .select({ avg: sql<number>`coalesce(avg(${marketplaceReviewsTable.rating}), 0)` })
      .from(marketplaceReviewsTable)
      .where(eq(marketplaceReviewsTable.listingId, review.listingId));
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(marketplaceReviewsTable)
      .where(eq(marketplaceReviewsTable.listingId, review.listingId));

    await db
      .update(marketplaceListingsTable)
      .set({ rating: avg, reviewCount: count })
      .where(eq(marketplaceListingsTable.id, review.listingId));

    res.status(204).end();
  },
);

// ─── Approval Flow ───────────────────────────────────────────────────────────

router.post(
  "/marketplace/listings/:id/submit-for-review",
  authorize({ resource: "templates", action: "write" }),
  requireTenantContext,
  async (req, res): Promise<void> => {
    const id = req.params.id;
    if (!id) {
      res.status(400).json({ error: "id is required" });
      return;
    }

    const [listing] = await db
      .select()
      .from(marketplaceListingsTable)
      .where(eq(marketplaceListingsTable.id, id))
      .limit(1);

    if (!listing) {
      res.status(404).json({ error: "Listing not found" });
      return;
    }

    if (listing.status !== "draft") {
      res.status(400).json({ error: `Cannot submit listing with status "${listing.status}" for review; must be "draft"` });
      return;
    }

    await db
      .update(marketplaceListingsTable)
      .set({ status: "pending_review", updatedAt: new Date() })
      .where(eq(marketplaceListingsTable.id, id));

    res.json({ id, status: "pending_review", message: "Listing submitted for review" });
  },
);

router.post(
  "/marketplace/listings/:id/approve",
  authorize({ resource: "templates", action: "write" }),
  async (req, res): Promise<void> => {
    const id = req.params.id;
    if (!id) {
      res.status(400).json({ error: "id is required" });
      return;
    }

    const [listing] = await db
      .select()
      .from(marketplaceListingsTable)
      .where(eq(marketplaceListingsTable.id, id))
      .limit(1);

    if (!listing) {
      res.status(404).json({ error: "Listing not found" });
      return;
    }

    if (listing.status !== "pending_review") {
      res.status(400).json({ error: `Cannot approve listing with status "${listing.status}"; must be "pending_review"` });
      return;
    }

    await db
      .update(marketplaceListingsTable)
      .set({ status: "published", updatedAt: new Date() })
      .where(eq(marketplaceListingsTable.id, id));

    res.json({ id, status: "published", message: "Listing approved and published" });
  },
);

router.post(
  "/marketplace/listings/:id/reject",
  authorize({ resource: "templates", action: "write" }),
  async (req, res): Promise<void> => {
    const id = req.params.id;
    if (!id) {
      res.status(400).json({ error: "id is required" });
      return;
    }

    const [listing] = await db
      .select()
      .from(marketplaceListingsTable)
      .where(eq(marketplaceListingsTable.id, id))
      .limit(1);

    if (!listing) {
      res.status(404).json({ error: "Listing not found" });
      return;
    }

    if (listing.status !== "pending_review") {
      res.status(400).json({ error: `Cannot reject listing with status "${listing.status}"; must be "pending_review"` });
      return;
    }

    const reason = String(req.body.reason ?? "Listing did not meet marketplace guidelines");

    await db
      .update(marketplaceListingsTable)
      .set({ status: "draft", updatedAt: new Date() })
      .where(eq(marketplaceListingsTable.id, id));

    res.json({ id, status: "draft", reason, message: "Listing rejected and returned to draft" });
  },
);

router.get(
  "/marketplace/reviews/pending",
  authorize({ resource: "templates", action: "read" }),
  async (req, res): Promise<void> => {
    const rows = await db
      .select()
      .from(marketplaceReviewsTable)
      .where(eq(marketplaceReviewsTable.status, "pending"))
      .orderBy(marketplaceReviewsTable.createdAt);

    res.json(rows);
  },
);

router.post(
  "/marketplace/reviews/:id/moderate",
  authorize({ resource: "templates", action: "write" }),
  async (req, res): Promise<void> => {
    const reviewId = req.params.id;
    if (isNaN(reviewId)) {
      res.status(400).json({ error: "id is required" });
      return;
    }

    const { action, reason } = req.body as { action?: string; reason?: string };

    if (!action || !["approve", "reject"].includes(action)) {
      res.status(400).json({ error: "action must be 'approve' or 'reject'" });
      return;
    }

    const [updated] = await db
      .update(marketplaceReviewsTable)
      .set({
        status: action === "approve" ? "approved" : "rejected",
        rejectionReason: action === "reject" ? (reason ?? "Review did not meet guidelines") : null,
        moderatedBy: req.user!.id,
        moderatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(marketplaceReviewsTable.id, reviewId))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Review not found" });
      return;
    }

    res.json(updated);
  },
);

// ─── Pending Listings (for moderation) ───────────────────────────────────────

router.get(
  "/marketplace/listings/pending",
  authorize({ resource: "templates", action: "read" }),
  async (req, res): Promise<void> => {
    const rows = await db
      .select()
      .from(marketplaceListingsTable)
      .where(eq(marketplaceListingsTable.status, "pending_review"))
      .orderBy(marketplaceListingsTable.createdAt);

    res.json(rows);
  },
);

export default router;
