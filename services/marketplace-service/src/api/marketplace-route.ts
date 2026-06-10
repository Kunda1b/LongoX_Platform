import { Router, type IRouter } from "express";
import "@longox/shared-auth";
import { PostgresListingRepository } from "../infrastructure";
import {
  SearchListingsQuery,
  InstallListingCommand,
} from "../application/search-listings.query";
import type { Request } from "express";

const router: IRouter = Router();
const repository = new PostgresListingRepository();
const searchQuery = new SearchListingsQuery(repository);
const installCommand = new InstallListingCommand(repository);

router.get("/marketplace/listings", async (req, res): Promise<void> => {
  const {
    type,
    category,
    search,
    featured,
    limit: limitStr,
    offset: offsetStr,
  } = req.query as Record<string, string | undefined>;

  const result = await searchQuery.execute({
    type: type as any,
    category,
    search,
    featured: featured === "true",
    limit: limitStr ? parseInt(limitStr) : 50,
    offset: offsetStr ? parseInt(offsetStr) : 0,
  });

  res.json(result);
});

router.get("/marketplace/listings/:id", async (req, res): Promise<void> => {
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
});

router.post("/marketplace/listings", async (req, res): Promise<void> => {
  const { title, description, listingType, category, tags, version, metadata } =
    req.body as Record<string, unknown>;
  if (!title || !listingType) {
    res.status(400).json({ error: "title and listingType are required" });
    return;
  }

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
    pricing: { free: true },
    metadata: (metadata ?? {}) as Record<string, unknown>,
  });

  res.status(201).json(listing.toJSON());
});

router.post(
  "/marketplace/listings/:id/install",
  async (req, res): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    try {
      await installCommand.execute({
        listingId: id,
        tenantId: req.user?.tenantId ?? 0,
        installedBy: req.user?.id ?? 0,
      });
      res.json({ success: true });
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  },
);

router.post(
  "/marketplace/listings/:id/publish",
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

export default router;
