import { eq, like, or, desc, sql } from "drizzle-orm";
import { db, connectorsTable } from "@longox/db";
import { Connector } from "../domain/connector.entity";
import type { ConnectorRepository } from "../domain/connector-repository";
import type {
  ConnectorCategory,
  ConnectorProps,
} from "../domain/connector.entity";

export class PostgresConnectorRepository implements ConnectorRepository {
  private toDomain(row: typeof connectorsTable.$inferSelect): Connector {
    return new Connector({
      id: row.id,
      name: row.name,
      displayName: row.displayName ?? undefined,
      version: row.version,
      sdkVersion: row.sdkVersion,
      category: row.category as ConnectorCategory,
      description: row.description,
      icon: row.icon,
      color: row.color ?? "",
      author: row.author ?? "",
      documentationUrl: row.documentationUrl ?? undefined,
      permissions: (row.permissions ?? []) as string[],
      capabilities: (row.capabilities ?? {}) as ConnectorProps["capabilities"],
      authType: row.authType as ConnectorProps["authType"],
      authConfig: (row.authConfig ?? {}) as ConnectorProps["authConfig"],
      certificationLevel:
        row.certificationLevel as ConnectorProps["certificationLevel"],
      rateLimit: (row.rateLimit ?? {
        requestsPerMinute: 60,
        burst: 10,
      }) as ConnectorProps["rateLimit"],
      isFeatured: row.isFeatured ?? false,
      status: (row.status as ConnectorProps["status"]) ?? "active",
      metadata: (row.metadata ?? {}) as Record<string, unknown>,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async findById(id: string): Promise<Connector | null> {
    const [row] = await db
      .select()
      .from(connectorsTable)
      .where(eq(connectorsTable.id, id))
      .limit(1);
    return row ? this.toDomain(row) : null;
  }

  async findByName(name: string): Promise<Connector | null> {
    const [row] = await db
      .select()
      .from(connectorsTable)
      .where(eq(connectorsTable.name, name))
      .limit(1);
    return row ? this.toDomain(row) : null;
  }

  async findAll(
    category?: ConnectorCategory,
    search?: string,
  ): Promise<Connector[]> {
    const conditions = [];
    if (category) conditions.push(eq(connectorsTable.category, category));
    if (search)
      conditions.push(
        or(
          like(connectorsTable.name, `%${search}%`),
          like(connectorsTable.description, `%${search}%`),
        ),
      );

    const rows = await db
      .select()
      .from(connectorsTable)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(connectorsTable.isFeatured), connectorsTable.name);

    return rows.map(this.toDomain);
  }

  async findFeatured(): Promise<Connector[]> {
    const rows = await db
      .select()
      .from(connectorsTable)
      .where(eq(connectorsTable.isFeatured, true))
      .orderBy(connectorsTable.name);
    return rows.map(this.toDomain);
  }

  async create(
    props: Omit<ConnectorProps, "id" | "createdAt" | "updatedAt">,
  ): Promise<Connector> {
    const [row] = await db
      .insert(connectorsTable)
      .values({
        name: props.name,
        displayName: props.displayName,
        version: props.version,
        sdkVersion: props.sdkVersion,
        category: props.category,
        description: props.description,
        icon: props.icon,
        color: props.color,
        author: props.author,
        documentationUrl: props.documentationUrl,
        permissions: props.permissions,
        capabilities: props.capabilities,
        authType: props.authType,
        authConfig: props.authConfig,
        certificationLevel: props.certificationLevel,
        rateLimit: props.rateLimit,
        isFeatured: props.isFeatured,
        status: props.status,
        metadata: props.metadata,
      })
      .returning();
    return this.toDomain(row);
  }

  async update(id: string, data: Partial<ConnectorProps>): Promise<Connector> {
    const [row] = await db
      .update(connectorsTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(connectorsTable.id, id))
      .returning();
    return this.toDomain(row);
  }

  async delete(id: string): Promise<void> {
    await db.delete(connectorsTable).where(eq(connectorsTable.id, id));
  }
}

function and(...conditions: any[]) {
  return conditions.length > 1
    ? sql`${conditions.reduce((a, b) => sql`${a} AND ${b}`)}`
    : conditions[0];
}
