import { eq, like, and as andOp, or, desc, sql } from "drizzle-orm";
import { db, templatesTable } from "@longox/db";
import { Listing } from "../domain/listing.entity";
import type { ListingRepository } from "../domain/listing-repository";
import type {
  ListingProps,
  ListingType,
  ListingStatus,
} from "../domain/listing.entity";

export class PostgresListingRepository implements ListingRepository {
  private toDomain(row: typeof templatesTable.$inferSelect): Listing {
    return new Listing({
      id: row.id,
      title: row.name,
      description: row.description ?? "",
      listingType: (row.templateType as ListingType) ?? "template",
      category: row.category,
      tags: (row.tags ?? []) as string[],
      author: "FlowBuilder",
      authorId: 0,
      version: "1.0.0",
      status: (row.isCustom ? "draft" : "published") as ListingStatus,
      installCount: row.uses,
      rating: 4.5,
      reviewCount: 0,
      featured: false,
      verified: !row.isCustom,
      pricing: { free: true },
      metadata: (row.metadata ?? {}) as Record<string, unknown>,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async findById(id: number): Promise<Listing | null> {
    const [row] = await db
      .select()
      .from(templatesTable)
      .where(eq(templatesTable.id, id))
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
      conditions.push(eq(templatesTable.templateType, filters.type));
    if (filters?.category)
      conditions.push(eq(templatesTable.category, filters.category));
    if (filters?.search)
      conditions.push(
        or(
          like(templatesTable.name, `%${filters.search}%`),
          like(templatesTable.description, `%${filters.search}%`),
        ),
      );
    if (filters?.status === "published")
      conditions.push(eq(templatesTable.isCustom, false));
    if (filters?.status === "draft")
      conditions.push(eq(templatesTable.isCustom, true));

    const rows = await db
      .select()
      .from(templatesTable)
      .where(conditions.length ? andOp(...conditions) : undefined)
      .orderBy(desc(templatesTable.uses));
    return rows.map(this.toDomain);
  }

  async findFeatured(): Promise<Listing[]> {
    const rows = await db
      .select()
      .from(templatesTable)
      .where(
        andOp(
          eq(templatesTable.isCustom, false),
          sql`${templatesTable.uses} > 5000`,
        ),
      )
      .orderBy(desc(templatesTable.uses))
      .limit(20);
    return rows.map(this.toDomain);
  }

  async findByAuthor(authorId: number): Promise<Listing[]> {
    const rows = await db
      .select()
      .from(templatesTable)
      .where(
        andOp(
          eq(templatesTable.isCustom, true),
          eq(templatesTable.id, authorId),
        ),
      )
      .orderBy(desc(templatesTable.createdAt));
    return rows.map(this.toDomain);
  }

  async create(
    props: Omit<ListingProps, "id" | "createdAt" | "updatedAt">,
  ): Promise<Listing> {
    const [row] = await db
      .insert(templatesTable)
      .values({
        name: props.title,
        description: props.description,
        category: props.category,
        tags: props.tags,
        templateType:
          props.listingType === "connector" ? "developer" : props.listingType,
        isCustom: true,
        uses: 0,
        metadata: props.metadata,
        nodes: [],
        nodeCount: 0,
        triggerType: "manual",
        complexity: "beginner",
      })
      .returning();
    return this.toDomain(row);
  }

  async update(id: number, data: Partial<ListingProps>): Promise<Listing> {
    const [row] = await db
      .update(templatesTable)
      .set({
        name: data.title,
        description: data.description,
        category: data.category,
        tags: data.tags,
        metadata: data.metadata,
      })
      .where(eq(templatesTable.id, id))
      .returning();
    return this.toDomain(row);
  }

  async delete(id: number): Promise<void> {
    await db.delete(templatesTable).where(eq(templatesTable.id, id));
  }
}
