import { Router, type IRouter } from "express";
import { authorize, requireTenantContext } from "@longox/shared-rbac";
import { PostgresListingRepository } from "../infrastructure";
import {
  SearchListingsQuery,
  InstallListingCommand,
} from "../application/search-listings.query";
import { prisma } from "@longox/db/prisma";

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

    let listings = Array.isArray(result)
      ? result
      : ((result as any).listings ?? result);

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
    const id = String(req.params.id);
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

    const pricing = req.body.pricing as
      | { free: boolean; price?: number; subscription?: boolean }
      | undefined;

    const listing = await repository.create({
      title: String(title),
      description: String(description ?? ""),
      listingType: String(listingType) as any,
      category: String(category ?? "general"),
      tags: (tags ?? []) as string[],
      author: req.user?.name ?? "Anonymous",
      authorId: req.user?.id ?? "",
      version: String(version ?? "1.0.0"),
      status: "draft",
      installCount: 0,
      rating: 0,
      reviewCount: 0,
      featured: false,
      verified: false,
      pricing: pricing
        ? { free: pricing.free, price: pricing.price, tier: undefined }
        : { free: true },
      metadata: (metadata ?? {}) as Record<string, unknown>,
      isPublic: Boolean(isPublic ?? false),
      communityTemplate: Boolean(communityTemplate ?? false),
      platformSharePercent: Number(platformSharePercent ?? 20),
      totalRevenue: 0,
    } as any);

    const listingData = listing.toJSON();

    if (
      listingData.pricing &&
      !listingData.pricing.free &&
      listingData.authorId
    ) {
      await prisma.revenueShare.create({
        data: {
          listingId: listingData.id,
          sellerTenantId: listingData.authorId,
          platformPercentage: Number(platformSharePercent ?? 20),
          sellerPercentage: 100 - Number(platformSharePercent ?? 20),
          totalEarned: 0,
          platformRevenue: 0,
          sellerPayout: 0,
          payoutStatus: "pending",
        } as any,
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
    const id = String(req.params.id);
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
    const id = String(req.params.id);
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
    const id = String(req.params.id);
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
    const id = String(req.params.id);
    if (!id) {
      res.status(400).json({ error: "id is required" });
      return;
    }

    const {
      title,
      description,
      category,
      tags,
      pricing,
      metadata,
      isPublic,
      communityTemplate,
    } = req.body as Record<string, unknown>;

    const listing = await repository.update(id, {
      title: title ? String(title) : undefined,
      description: description ? String(description) : undefined,
      category: category ? String(category) : undefined,
      tags: tags ? (tags as string[]) : undefined,
      pricing: pricing as any,
      metadata: metadata as any,
      isPublic: isPublic !== undefined ? Boolean(isPublic) : undefined,
      communityTemplate:
        communityTemplate !== undefined
          ? Boolean(communityTemplate)
          : undefined,
    } as any);
    res.json(listing.toJSON());
  },
);

router.delete(
  "/marketplace/listings/:id",
  authorize({ resource: "templates", action: "write" }),
  requireTenantContext,
  async (req, res): Promise<void> => {
    const id = String(req.params.id);
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
    const id = String(req.params.id);
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

    const deployment = await prisma.agentDeployment.create({
      data: {
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
      } as any,
    });

    res.status(201).json({
      success: true,
      listingId: id,
      deploymentId: deployment.id,
      targetEnvironment: (deployment as any).targetEnvironment,
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
    const id = String(req.params.id);
    if (!id) {
      res.status(400).json({ error: "id is required" });
      return;
    }

    const shares = await prisma.revenueShare.findMany({
      where: { listingId: id } as any,
    });

    const installs = await prisma.marketplaceInstall.findMany({
      where: { listingId: id } as any,
    });

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
    const id = String(req.params.id);
    if (!id) {
      res.status(400).json({ error: "id is required" });
      return;
    }

    let updated: any = null;
    try {
      updated = await prisma.revenueShare.update({
        where: { id },
        data: {
          payoutStatus: "completed",
          lastPayoutAt: new Date(),
        } as any,
      });
    } catch {
      updated = null;
    }

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

    const shares = await prisma.revenueShare.findMany({
      where: { sellerTenantId: tenantId } as any,
    });

    const totalEarned = shares.reduce(
      (sum, s: any) => sum + Number(s.totalEarned ?? 0),
      0,
    );
    const totalPayout = shares.reduce(
      (sum, s: any) => sum + Number(s.sellerPayout ?? 0),
      0,
    );
    const pendingPayouts = shares.filter(
      (s: any) => s.payoutStatus === "pending",
    );

    res.json({
      totalListings: shares.length,
      totalEarned,
      totalPayout,
      pendingPayouts: pendingPayouts.length,
      pendingAmount: pendingPayouts.reduce(
        (sum, s: any) => sum + Number(s.sellerPayout ?? 0),
        0,
      ),
      shares,
    });
  },
);

// ─── Reviews ─────────────────────────────────────────────────────────────────

router.get(
  "/marketplace/listings/:id/reviews",
  authorize({ resource: "templates", action: "read" }),
  async (req, res): Promise<void> => {
    const listingId = String(req.params.id);
    if (!listingId) {
      res.status(400).json({ error: "id is required" });
      return;
    }

    const rows = await prisma.marketplaceReview.findMany({
      where: {
        listingId,
        status: "approved",
      } as any,
      orderBy: { createdAt: "desc" },
    });

    res.json(rows);
  },
);

router.post(
  "/marketplace/listings/:id/reviews",
  authorize({ resource: "templates", action: "write" }),
  requireTenantContext,
  async (req, res): Promise<void> => {
    const listingId = String(req.params.id);
    if (!listingId) {
      res.status(400).json({ error: "id is required" });
      return;
    }

    const { rating, title, body } = req.body as Record<string, unknown>;
    if (
      !rating ||
      typeof Number(rating) !== "number" ||
      Number(rating) < 0.5 ||
      Number(rating) > 5
    ) {
      res
        .status(400)
        .json({ error: "rating is required and must be between 0.5 and 5" });
      return;
    }

    const row = await prisma.marketplaceReview.create({
      data: {
        listingId,
        tenantId: req.user!.tenantId!,
        userId: req.user!.id,
        rating: Number(rating),
        title: title ? String(title) : null,
        body: body ? String(body) : null,
      } as any,
    });

    const agg = await prisma.marketplaceReview.aggregate({
      where: { listingId, status: "approved" } as any,
      _avg: { rating: true },
    });
    const reviewCount = await prisma.marketplaceReview.count({
      where: { listingId } as any,
    });

    const avgRating = (agg._avg.rating ?? Number(rating)) as number;

    await prisma.marketplaceListing.update({
      where: { id: listingId },
      data: { rating: avgRating, reviewCount } as any,
    });

    res.status(201).json(row);
  },
);

router.put(
  "/marketplace/reviews/:id",
  authorize({ resource: "templates", action: "write" }),
  requireTenantContext,
  async (req, res): Promise<void> => {
    const reviewId = String(req.params.id);
    if (!reviewId) {
      res.status(400).json({ error: "id is required" });
      return;
    }

    const review = await prisma.marketplaceReview.findFirst({
      where: {
        id: reviewId,
        userId: req.user!.id,
      } as any,
    });

    if (!review) {
      res.status(404).json({ error: "Review not found or not owned by you" });
      return;
    }

    const { rating, title, body } = req.body as Record<string, unknown>;
    const updated = await prisma.marketplaceReview.update({
      where: { id: reviewId },
      data: {
        rating: rating ? Number(rating) : (review as any).rating,
        title: title !== undefined ? String(title) : (review as any).title,
        body: body !== undefined ? String(body) : (review as any).body,
        updatedAt: new Date(),
      } as any,
    });

    if (rating) {
      const agg = await prisma.marketplaceReview.aggregate({
        where: { listingId: review.listingId } as any,
        _avg: { rating: true },
      });
      const avg = (agg._avg.rating ?? 0) as number;
      await prisma.marketplaceListing.update({
        where: { id: review.listingId },
        data: { rating: avg } as any,
      });
    }

    res.json(updated);
  },
);

router.delete(
  "/marketplace/reviews/:id",
  authorize({ resource: "templates", action: "write" }),
  requireTenantContext,
  async (req, res): Promise<void> => {
    const reviewId = String(req.params.id);
    if (!reviewId) {
      res.status(400).json({ error: "id is required" });
      return;
    }

    const review = await prisma.marketplaceReview.findFirst({
      where: {
        id: reviewId,
        userId: req.user!.id,
      } as any,
    });

    if (!review) {
      res.status(404).json({ error: "Review not found or not owned by you" });
      return;
    }

    await prisma.marketplaceReview.delete({ where: { id: reviewId } });

    const agg = await prisma.marketplaceReview.aggregate({
      where: { listingId: review.listingId } as any,
      _avg: { rating: true },
    });
    const avg = (agg._avg.rating ?? 0) as number;
    const count = await prisma.marketplaceReview.count({
      where: { listingId: review.listingId } as any,
    });

    await prisma.marketplaceListing.update({
      where: { id: review.listingId },
      data: { rating: avg, reviewCount: count } as any,
    });

    res.status(204).end();
  },
);

// ─── Approval Flow ───────────────────────────────────────────────────────────

router.post(
  "/marketplace/listings/:id/submit-for-review",
  authorize({ resource: "templates", action: "write" }),
  requireTenantContext,
  async (req, res): Promise<void> => {
    const id = String(req.params.id);
    if (!id) {
      res.status(400).json({ error: "id is required" });
      return;
    }

    const listing = await prisma.marketplaceListing.findUnique({
      where: { id },
    });

    if (!listing) {
      res.status(404).json({ error: "Listing not found" });
      return;
    }

    if (listing.status !== "draft") {
      res.status(400).json({
        error: `Cannot submit listing with status "${listing.status}" for review; must be "draft"`,
      });
      return;
    }

    await prisma.marketplaceListing.update({
      where: { id },
      data: { status: "pending_review", updatedAt: new Date() } as any,
    });

    res.json({
      id,
      status: "pending_review",
      message: "Listing submitted for review",
    });
  },
);

router.post(
  "/marketplace/listings/:id/approve",
  authorize({ resource: "templates", action: "write" }),
  async (req, res): Promise<void> => {
    const id = String(req.params.id);
    if (!id) {
      res.status(400).json({ error: "id is required" });
      return;
    }

    const listing = await prisma.marketplaceListing.findUnique({
      where: { id },
    });

    if (!listing) {
      res.status(404).json({ error: "Listing not found" });
      return;
    }

    if (listing.status !== "pending_review") {
      res.status(400).json({
        error: `Cannot approve listing with status "${listing.status}"; must be "pending_review"`,
      });
      return;
    }

    await prisma.marketplaceListing.update({
      where: { id },
      data: { status: "published", updatedAt: new Date() } as any,
    });

    res.json({
      id,
      status: "published",
      message: "Listing approved and published",
    });
  },
);

router.post(
  "/marketplace/listings/:id/reject",
  authorize({ resource: "templates", action: "write" }),
  async (req, res): Promise<void> => {
    const id = String(req.params.id);
    if (!id) {
      res.status(400).json({ error: "id is required" });
      return;
    }

    const listing = await prisma.marketplaceListing.findUnique({
      where: { id },
    });

    if (!listing) {
      res.status(404).json({ error: "Listing not found" });
      return;
    }

    if (listing.status !== "pending_review") {
      res.status(400).json({
        error: `Cannot reject listing with status "${listing.status}"; must be "pending_review"`,
      });
      return;
    }

    const reason = String(
      req.body.reason ?? "Listing did not meet marketplace guidelines",
    );

    await prisma.marketplaceListing.update({
      where: { id },
      data: { status: "draft", updatedAt: new Date() } as any,
    });

    res.json({
      id,
      status: "draft",
      reason,
      message: "Listing rejected and returned to draft",
    });
  },
);

router.get(
  "/marketplace/reviews/pending",
  authorize({ resource: "templates", action: "read" }),
  async (req, res): Promise<void> => {
    const rows = await prisma.marketplaceReview.findMany({
      where: { status: "pending" } as any,
      orderBy: { createdAt: "asc" } as any,
    });

    res.json(rows);
  },
);

router.post(
  "/marketplace/reviews/:id/moderate",
  authorize({ resource: "templates", action: "write" }),
  async (req, res): Promise<void> => {
    const reviewId = String(req.params.id);
    if (!reviewId) {
      res.status(400).json({ error: "id is required" });
      return;
    }

    const { action, reason } = req.body as { action?: string; reason?: string };

    if (!action || !["approve", "reject"].includes(action)) {
      res.status(400).json({ error: "action must be 'approve' or 'reject'" });
      return;
    }

    let updated: any = null;
    try {
      updated = await prisma.marketplaceReview.update({
        where: { id: reviewId },
        data: {
          status: action === "approve" ? "approved" : "rejected",
          moderationReason:
            action === "reject"
              ? (reason ?? "Review did not meet guidelines")
              : null,
          rejectionReason:
            action === "reject"
              ? (reason ?? "Review did not meet guidelines")
              : null,
          moderatedBy: req.user!.id,
          moderatedAt: new Date(),
          updatedAt: new Date(),
        } as any,
      });
    } catch {
      updated = null;
    }

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
    const rows = await prisma.marketplaceListing.findMany({
      where: { status: "pending_review" } as any,
      orderBy: { createdAt: "asc" } as any,
    });

    res.json(rows);
  },
);

export default router;
