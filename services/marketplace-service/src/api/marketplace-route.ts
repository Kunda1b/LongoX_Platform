import { Router, type IRouter } from "express";
import { authorize, requireTenantContext } from "@longox/shared-rbac";
import { PostgresListingRepository } from "../infrastructure";
import {
  SearchListingsQuery,
  InstallListingCommand,
} from "../application/search-listings.query";
import type { Request } from "express";
import { drizzle } from "drizzle-orm/node-postgres";
import { db as dbPool } from "@longox/db";
import { revenueSharesTable, marketplaceInstallsTable, agentDeploymentsTable } from "@longox/db";

const router: IRouter = Router();
const repository = new PostgresListingRepository();
const searchQuery = new SearchListingsQuery(repository);
const installCommand = new InstallListingCommand(repository);
const db = drizzle({ client: dbPool });

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

    let listings = Array.isArray(result) ? result : result.listings ?? result.data ?? result;

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
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid id" });
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
      pricing: pricing ? { free: pricing.free, price: pricing.price, subscription: pricing.subscription } : { free: true },
      metadata: (metadata ?? {}) as Record<string, unknown>,
      isPublic: Boolean(isPublic ?? false),
      communityTemplate: Boolean(communityTemplate ?? false),
      platformSharePercent: Number(platformSharePercent ?? 20),
      totalRevenue: 0,
    });

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
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid id" });
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
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid id" });
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
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid id" });
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
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid id" });
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
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid id" });
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
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    const listing = await repository.findById(id);
    if (!listing) {
      res.status(404).json({ error: "Listing not found" });
      return;
    }

    const listingData = listing.toJSON();
    if (listingData.listingType !== "agent") {
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
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    const shares = await db
      .select()
      .from(revenueSharesTable)
      .where(
        (() => {
          const { eq } = require("drizzle-orm");
          return eq(revenueSharesTable.listingId, id);
        })(),
      );

    const installs = await db
      .select()
      .from(marketplaceInstallsTable)
      .where(
        (() => {
          const { eq } = require("drizzle-orm");
          return eq(marketplaceInstallsTable.listingId, id);
        })(),
      );

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
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    const [updated] = await db
      .update(revenueSharesTable)
      .set({
        payoutStatus: "completed",
        lastPayoutAt: new Date().toISOString(),
      })
      .where(
        (() => {
          const { eq } = require("drizzle-orm");
          return eq(revenueSharesTable.id, id);
        })(),
      )
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
      .where(
        (() => {
          const { eq } = require("drizzle-orm");
          return eq(revenueSharesTable.sellerTenantId, tenantId);
        })(),
      );

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

export default router;
