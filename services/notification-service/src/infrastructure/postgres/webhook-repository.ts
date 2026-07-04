/**
 * Prisma-based webhook endpoint/delivery repositories.
 *
 * Migrated from Drizzle to Prisma per ADR-013 Phase 3.
 * Uses `prisma.webhookEndpoint` and `prisma.webhookDelivery` delegates.
 *
 * NOTE: The underlying `webhook_endpoints`/`webhook_deliveries` tables carry
 * legacy columns (`tenantId`, `url`, `events`, `eventType`, `payload`,
 * `statusCode`, `response`, `errorMessage`) that are not yet reflected on
 * the Prisma models. We use `as any` casts to preserve them.
 */

import { prisma } from "@longox/db/prisma";
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

function endpointToDomain(row: any): WebhookEndpoint {
  return {
    id: row.id,
    tenantId: row.tenantId ?? null,
    url: row.url ?? "",
    secret: row.secret ?? null,
    events: (row.events ?? []) as string[],
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function deliveryToDomain(row: any): WebhookDelivery {
  return {
    id: row.id,
    endpointId: row.endpointId,
    eventType: row.eventType ?? "",
    payload: (row.payload ?? {}) as Record<string, unknown>,
    status: row.status as "pending" | "failed" | "delivered",
    statusCode: row.statusCode ?? null,
    response: row.response ?? null,
    errorMessage: row.errorMessage ?? null,
    retryCount: row.retryCount,
    createdAt: row.createdAt.toISOString(),
    deliveredAt: row.deliveredAt?.toISOString() ?? null,
  };
}

export class PostgresWebhookEndpointRepository implements WebhookEndpointRepository {
  async list(tenantId: string): Promise<WebhookEndpoint[]> {
    const rows = await prisma.webhookEndpoint.findMany({
      where: { tenantId } as any,
      orderBy: { id: "asc" },
    });
    return rows.map(endpointToDomain);
  }

  async create(input: CreateWebhookEndpointInput): Promise<WebhookEndpoint> {
    const row = await prisma.webhookEndpoint.create({
      data: {
        tenantId: input.tenantId,
        url: input.url,
        secret: input.secret,
        events: input.events,
        isActive: true,
      } as any,
    });
    return endpointToDomain(row);
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.webhookEndpoint.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  async findByEvent(tenantId: string, eventType: string): Promise<WebhookEndpoint[]> {
    const rows = await prisma.webhookEndpoint.findMany({
      where: {
        tenantId,
        isActive: true,
      } as any,
    });
    return rows
      .map(endpointToDomain)
      .filter((ep) => ep.events.includes(eventType) || ep.events.includes("*"));
  }
}

export class PostgresWebhookDeliveryRepository implements WebhookDeliveryRepository {
  async list(filter: ListWebhookDeliveriesFilter): Promise<WebhookDelivery[]> {
    const limit = Math.min(filter.limit ?? 50, 200);
    const where: Record<string, unknown> = {};
    if (filter.endpointId) where.endpointId = filter.endpointId;
    if (filter.status) where.status = filter.status;

    const rows = await prisma.webhookDelivery.findMany({
      where: where as any,
      orderBy: { id: "desc" },
      take: limit,
    });
    return rows.map(deliveryToDomain);
  }

  async create(
    endpointId: string,
    eventType: string,
    payload: Record<string, unknown>,
  ): Promise<WebhookDelivery> {
    const row = await prisma.webhookDelivery.create({
      data: {
        endpointId,
        eventType,
        payload,
        status: "pending",
        retryCount: 0,
      } as any,
    });
    return deliveryToDomain(row);
  }

  async markDelivered(
    id: string,
    statusCode: number,
    response: string,
  ): Promise<WebhookDelivery | null> {
    try {
      const row = await prisma.webhookDelivery.update({
        where: { id },
        data: {
          status: "delivered",
          statusCode,
          response,
          deliveredAt: new Date(),
        } as any,
      });
      return deliveryToDomain(row);
    } catch {
      return null;
    }
  }

  async markFailed(
    id: string,
    statusCode: number | null,
    errorMessage: string,
  ): Promise<WebhookDelivery | null> {
    try {
      const row = await prisma.webhookDelivery.update({
        where: { id },
        data: { status: "failed", statusCode, errorMessage } as any,
      });
      return deliveryToDomain(row);
    } catch {
      return null;
    }
  }

  async incrementRetryCount(id: string): Promise<void> {
    // Atomic increment of retry_count via raw SQL.
    await prisma.$executeRawUnsafe(
      `UPDATE webhook_deliveries SET retry_count = retry_count + 1 WHERE id = $1`,
      id,
    );
  }
}
