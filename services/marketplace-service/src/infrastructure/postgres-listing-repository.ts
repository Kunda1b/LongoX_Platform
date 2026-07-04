import { eq, like, and as andOp, or, desc, sql } from "drizzle-orm";
import { db, marketplaceListingsTable, marketplaceInstallsTable } from "@longox/db";
import { Listing } from "../domain/listing.entity";
import type { ListingRepository } from "../domain/listing-repository";
import type {
  ListingProps,
  ListingType,
  ListingStatus,
} from "../domain/listing.entity";

export class PostgresListingRepository implements ListingRepository {
  private toDomain(row: typeof marketplaceListingsTable.$inferSelect): Listing {
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
    const [row] = await db
      .select()
      .from(marketplaceListingsTable)
      .where(eq(marketplaceListingsTable.id, id))
      .limit(1);
    return row ? this.toDomain(row) : null;
  }

  async findAll(filters?: {
    type?: ListingType;
    category?: string;
    search?: string;
    status?: ListingStatus;
    featured?: boolean;
  }): Promise<Listing[]> {
    const conditions = [];
    if (filters?.type)
      conditions.push(eq(marketplaceListingsTable.listingType, filters.type));
    if (filters?.category)
      conditions.push(eq(marketplaceListingsTable.category, filters.category));
    if (filters?.search)
      conditions.push(
        or(
          like(marketplaceListingsTable.title, `%${filters.search}%`),
          like(marketplaceListingsTable.description, `%${filters.search}%`),
        ),
      );
    if (filters?.status)
      conditions.push(eq(marketplaceListingsTable.status, filters.status));
    if (filters?.featured !== undefined)
      conditions.push(eq(marketplaceListingsTable.featured, filters.featured));

    const rows = await db
      .select()
      .from(marketplaceListingsTable)
      .where(conditions.length ? andOp(...conditions) : undefined)
      .orderBy(desc(marketplaceListingsTable.installCount));
    return rows.map(this.toDomain);
  }

  async findFeatured(): Promise<Listing[]> {
    const rows = await db
      .select()
      .from(marketplaceListingsTable)
      .where(
        andOp(
          eq(marketplaceListingsTable.featured, true),
          eq(marketplaceListingsTable.status, "published"),
        ),
      )
      .orderBy(desc(marketplaceListingsTable.installCount))
      .limit(20);
    return rows.map(this.toDomain);
  }

  async findByAuthor(authorId: string): Promise<Listing[]> {
    const rows = await db
      .select()
      .from(marketplaceListingsTable)
      .where(eq(marketplaceListingsTable.authorId, authorId))
      .orderBy(desc(marketplaceListingsTable.createdAt));
    return rows.map(this.toDomain);
  }

  async create(
    props: Omit<ListingProps, "id" | "createdAt" | "updatedAt">,
  ): Promise<Listing> {
    const [row] = await db
      .insert(marketplaceListingsTable)
      .values({
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
      } as any)
      .returning();
    return this.toDomain(row);
  }

  async update(id: string, data: Partial<ListingProps>): Promise<Listing> {
    const [row] = await db
      .update(marketplaceListingsTable)
      .set({
        title: data.title,
        description: data.description,
        category: data.category,
        tags: data.tags,
        status: data.status,
        pricing: data.pricing,
        metadata: data.metadata,
      })
      .where(eq(marketplaceListingsTable.id, id))
      .returning();
    return this.toDomain(row);
  }

  async delete(id: string): Promise<void> {
    await db.delete(marketplaceListingsTable).where(eq(marketplaceListingsTable.id, id));
  }
}
