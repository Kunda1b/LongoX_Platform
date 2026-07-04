/**
 * Prisma-based marketplace listing repository.
 *
 * Migrated from Drizzle to Prisma per ADR-013 Phase 3.
 * Uses `prisma.marketplaceListing` delegate with `as any` casts for legacy columns.
 */

import { prisma } from "@longox/db/prisma";
import { Listing } from "../domain/listing.entity";
import type { ListingRepository } from "../domain/listing-repository";
import type {
  ListingProps,
  ListingType,
  ListingStatus,
} from "../domain/listing.entity";

export class PostgresListingRepository implements ListingRepository {
  private toDomain(row: any): Listing {
    return new Listing({
      id: row.id,
      title: row.title,
      description: row.description ?? "",
      listingType: row.listingType as ListingType,
      category: row.category,
      tags: row.tags as string[],
      author: row.author ?? "LongoX",
      authorId: row.authorId ?? "",
      version: row.version ?? "1.0.0",
      status: row.status as ListingStatus,
      installCount: row.installCount ?? 0,
      rating: row.rating ?? 0,
      reviewCount: row.reviewCount ?? 0,
      featured: row.featured ?? false,
      verified: row.verified ?? false,
      pricing: row.pricing ?? { free: true },
      metadata: (row.metadata ?? {}) as Record<string, unknown>,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async findById(id: string): Promise<Listing | null> {
    const row = await prisma.marketplaceListing.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findAll(filters?: {
    type?: ListingType;
    category?: string;
    search?: string;
    status?: ListingStatus;
    featured?: boolean;
  }): Promise<Listing[]> {
    const where: Record<string, unknown> = {};
    if (filters?.type) where.listingType = filters.type;
    if (filters?.category) where.category = filters.category;
    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
      ];
    }
    if (filters?.status) where.status = filters.status;
    if (filters?.featured !== undefined) where.featured = filters.featured;

    const rows = await prisma.marketplaceListing.findMany({
      where: where as any,
      orderBy: { installCount: "desc" },
    });
    return rows.map((r: any) => this.toDomain(r));
  }

  async findFeatured(): Promise<Listing[]> {
    const rows = await prisma.marketplaceListing.findMany({
      where: { featured: true, status: "published" } as any,
      orderBy: { installCount: "desc" },
      take: 20,
    });
    return rows.map((r: any) => this.toDomain(r));
  }

  async findByAuthor(authorId: string): Promise<Listing[]> {
    const rows = await prisma.marketplaceListing.findMany({
      where: { authorId } as any,
      orderBy: { createdAt: "desc" },
    });
    return rows.map((r: any) => this.toDomain(r));
  }

  async create(
    props: Omit<ListingProps, "id" | "createdAt" | "updatedAt">,
  ): Promise<Listing> {
    const row = await prisma.marketplaceListing.create({
      data: {
        title: props.title,
        description: props.description,
        listingType: props.listingType,
        category: props.category,
        tags: props.tags,
        author: props.author,
        authorId: props.authorId,
        version: props.version,
        status: props.status,
        installCount: 0,
        rating: 0,
        reviewCount: 0,
        featured: props.featured ?? false,
        verified: props.verified ?? false,
        pricing: props.pricing ?? { free: true },
        metadata: props.metadata,
        nodes: [],
      } as any,
    });
    return this.toDomain(row);
  }

  async update(id: string, data: Partial<ListingProps>): Promise<Listing> {
    const row = await prisma.marketplaceListing.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        tags: data.tags,
        status: data.status,
        pricing: data.pricing,
        metadata: data.metadata,
        installCount: data.installCount,
      } as any,
    });
    return this.toDomain(row);
  }

  async delete(id: string): Promise<void> {
    await prisma.marketplaceListing.delete({ where: { id } });
  }
}
