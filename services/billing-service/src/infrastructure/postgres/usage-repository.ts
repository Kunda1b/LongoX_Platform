/**
 * Prisma-based usage repository.
 *
 * Migrated from Drizzle to Prisma per ADR-013 Phase 3.
 * Uses `prisma.usageEvent`, `prisma.workflowExecution`, `prisma.workflow`,
 * `prisma.connector` delegates with `as any` casts for legacy columns.
 */

import { prisma } from "@longox/db/prisma";
import type { UsageRepository } from "../../domain/usage/usage-repository";
import type {
  UsageEvent,
  ListUsageEventsFilter,
  UsageEventQuantity,
  UsageMetrics,
} from "../../domain/usage/usage-event.entity";

export class PostgresUsageRepository implements UsageRepository {
  async listEvents(
    tenantId: string,
    filter: ListUsageEventsFilter,
  ): Promise<UsageEvent[]> {
    const limit = Math.min(filter.limit ?? 50, 200);

    const where: Record<string, unknown> = { tenantId };
    if (filter.workflowId) where.workflowId = filter.workflowId;
    if (filter.eventType) where.eventType = filter.eventType;

    const rows = await prisma.usageEvent.findMany({
      where: where as any,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return rows.map((e: any) => ({
      id: e.id,
      workflowId: e.workflowId ?? null,
      workflowName: e.workflowName ?? null,
      eventType: e.eventType,
      quantity: e.quantity,
      metadata: (e.metadata ?? {}) as Record<string, unknown>,
      createdAt: e.createdAt.toISOString(),
    }));
  }

  async getMetrics(tenantId: string, monthStart: Date): Promise<UsageMetrics> {
    const allExecs = await prisma.workflowExecution.count({
      where: { tenantId } as any,
    });
    const monthExecs = await prisma.workflowExecution.count({
      where: {
        tenantId,
        startedAt: { gte: monthStart },
      } as any,
    });
    const allWorkflows = await prisma.workflow.count({
      where: { tenantId } as any,
    });
    const activeWorkflows = await prisma.workflow.count({
      where: { tenantId, status: "active" } as any,
    });
    const allConnectors = await prisma.connector.count();
    const installedConnectors = await prisma.connector.count({
      where: { isInstalled: true } as any,
    });

    return {
      totalExecutions: allExecs,
      executionsThisMonth: monthExecs,
      totalWorkflows: allWorkflows,
      activeWorkflows,
      totalConnectors: allConnectors,
      usedConnectors: installedConnectors,
    };
  }

  async getEventQuantities(
    tenantId: string,
    periodStart: Date,
    periodEnd?: Date,
  ): Promise<UsageEventQuantity[]> {
    const where: Record<string, unknown> = {
      tenantId,
      createdAt: { gte: periodStart },
    };
    if (periodEnd) {
      (where.createdAt as Record<string, unknown>).lte = periodEnd;
    }

    const rows = await prisma.usageEvent.findMany({
      where: where as any,
      select: {
        eventType: true,
        quantity: true,
      } as any,
    });

    return rows as unknown as UsageEventQuantity[];
  }
}
