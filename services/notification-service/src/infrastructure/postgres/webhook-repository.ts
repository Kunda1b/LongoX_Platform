import { eq, and, desc, sql } from "drizzle-orm";
import { db, webhookEndpointsTable, webhookDeliveriesTable } from "@longox/db";
import type {
  WebhookEndpointRepository,
  WebhookDeliveryRepository,
} from "../../domain/webhook/webhook-repository";
import type {
  WebhookEndpoint,
  CreateWebhookEndpointInput,
  WebhookDelivery,
  ListWebhookDeliveriesFilter,
} from "../../domain/webhook/webhook.entity";

function endpointToDomain(
  row: typeof webhookEndpointsTable.$inferSelect,
): WebhookEndpoint {
  const r = row as any;
  return {
    id: row.id,
    tenantId: r.tenantId ?? null,
    url: r.url ?? "",
    secret: row.secret ?? null,
    events: (r.events ?? []) as string[],
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function deliveryToDomain(
  row: typeof webhookDeliveriesTable.$inferSelect,
): WebhookDelivery {
  const r = row as any;
  return {
    id: row.id,
    endpointId: row.endpointId,
    eventType: r.eventType ?? "",
    payload: (r.payload ?? {}) as Record<string, unknown>,
    status: row.status as "pending" | "failed" | "delivered",
    statusCode: r.statusCode ?? null,
    response: r.response ?? null,
    errorMessage: r.errorMessage ?? null,
    retryCount: row.retryCount,
    createdAt: row.createdAt.toISOString(),
    deliveredAt: row.deliveredAt?.toISOString() ?? null,
  };
}

export class PostgresWebhookEndpointRepository implements WebhookEndpointRepository {
  async list(tenantId: string): Promise<WebhookEndpoint[]> {
    const rows = await db
      .select()
      .from(webhookEndpointsTable)
      .where(eq((webhookEndpointsTable as any).tenantId, tenantId))
      .orderBy(webhookEndpointsTable.id);
    return rows.map(endpointToDomain);
  }

  async create(input: CreateWebhookEndpointInput): Promise<WebhookEndpoint> {
    const [row] = await db
      .insert(webhookEndpointsTable)
      .values({
        tenantId: input.tenantId,
        url: input.url,
        secret: input.secret,
        events: input.events,
        isActive: true,
      } as any)
      .returning();
    return endpointToDomain(row);
  }

  async delete(id: number): Promise<boolean> {
    const result = await db
      .delete(webhookEndpointsTable)
      .where(eq(webhookEndpointsTable.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async findByEvent(tenantId: string, eventType: string): Promise<WebhookEndpoint[]> {
    const rows = await db
      .select()
      .from(webhookEndpointsTable)
      .where(
        and(
          eq((webhookEndpointsTable as any).tenantId, tenantId),
          eq(webhookEndpointsTable.isActive, true)
        )
      );
    return rows
      .map(endpointToDomain)
      .filter((ep) => ep.events.includes(eventType) || ep.events.includes("*"));
  }
}

export class PostgresWebhookDeliveryRepository implements WebhookDeliveryRepository {
  async list(filter: ListWebhookDeliveriesFilter): Promise<WebhookDelivery[]> {
    const limit = Math.min(filter.limit ?? 50, 200);
    const conditions = [];
    if (filter.endpointId)
      conditions.push(eq(webhookDeliveriesTable.endpointId, filter.endpointId));
    if (filter.status)
      conditions.push(eq(webhookDeliveriesTable.status, filter.status));

    const rows = await db
      .select()
      .from(webhookDeliveriesTable)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(webhookDeliveriesTable.id))
      .limit(limit);
    return rows.map(deliveryToDomain);
  }

  async create(
    endpointId: number,
    eventType: string,
    payload: Record<string, unknown>,
  ): Promise<WebhookDelivery> {
    const [row] = await db
      .insert(webhookDeliveriesTable)
      .values({
        endpointId,
        eventType,
        payload,
        status: "pending",
        retryCount: 0,
      } as any)
      .returning();
    return deliveryToDomain(row);
  }

  async markDelivered(
    id: number,
    statusCode: number,
    response: string,
  ): Promise<WebhookDelivery | null> {
    const [row] = await db
      .update(webhookDeliveriesTable)
      .set({ status: "delivered", statusCode, response, deliveredAt: new Date() } as any)
      .where(eq(webhookDeliveriesTable.id, id))
      .returning();
    return row ? deliveryToDomain(row) : null;
  }

  async markFailed(
    id: number,
    statusCode: number | null,
    errorMessage: string,
  ): Promise<WebhookDelivery | null> {
    const [row] = await db
      .update(webhookDeliveriesTable)
      .set({ status: "failed", statusCode, errorMessage } as any)
      .where(eq(webhookDeliveriesTable.id, id))
      .returning();
    return row ? deliveryToDomain(row) : null;
  }

  async incrementRetryCount(id: number): Promise<void> {
    await db
      .update(webhookDeliveriesTable)
      .set({ retryCount: sql`${webhookDeliveriesTable.retryCount} + 1` })
      .where(eq(webhookDeliveriesTable.id, id));
  }
}
