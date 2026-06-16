import { eq, sql, gte, and } from "drizzle-orm";
import {
  db,
  usageEventsTable,
  executionsTable,
  workflowsTable,
  connectorsTable,
} from "@longox/db";
import type { UsageRepository } from "../../domain/usage/usage-repository";
import type {
  UsageEvent,
  ListUsageEventsFilter,
  UsageEventQuantity,
  UsageMetrics,
} from "../../domain/usage/usage-event.entity";

export class PostgresUsageRepository implements UsageRepository {
  async listEvents(
    tenantId: number,
    filter: ListUsageEventsFilter,
  ): Promise<UsageEvent[]> {
    const limit = Math.min(filter.limit ?? 50, 200);

    const conditions = [eq(usageEventsTable.tenantId, tenantId)];
    if (filter.workflowId)
      conditions.push(eq(usageEventsTable.workflowId, filter.workflowId));
    if (filter.eventType)
      conditions.push(eq(usageEventsTable.eventType, filter.eventType));

    const rows = await db
      .select()
      .from(usageEventsTable)
      .where(and(...conditions))
      .orderBy(sql`${usageEventsTable.createdAt} desc`)
      .limit(limit);

    return rows.map((e) => ({
      id: e.id,
      workflowId: e.workflowId ?? null,
      workflowName: e.workflowName ?? null,
      eventType: e.eventType,
      quantity: e.quantity,
      metadata: (e.metadata ?? {}) as Record<string, unknown>,
      createdAt: e.createdAt.toISOString(),
    }));
  }

  async getMetrics(tenantId: number, monthStart: Date): Promise<UsageMetrics> {
    const [allExecs] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(executionsTable)
      .where(eq(executionsTable.tenantId, tenantId));
    const [monthExecs] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(executionsTable)
      .where(
        and(
          eq(executionsTable.tenantId, tenantId),
          gte(executionsTable.startedAt, monthStart),
        ),
      );
    const [allWorkflows] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(workflowsTable)
      .where(eq(workflowsTable.tenantId, tenantId));
    const [activeWorkflows] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(workflowsTable)
      .where(
        and(
          eq(workflowsTable.tenantId, tenantId),
          eq(workflowsTable.status, "active"),
        ),
      );
    const [allConnectors] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(connectorsTable);
    const [installedConnectors] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(connectorsTable)
      .where(eq(connectorsTable.isInstalled, true));

    return {
      totalExecutions: allExecs.count,
      executionsThisMonth: monthExecs.count,
      totalWorkflows: allWorkflows.count,
      activeWorkflows: activeWorkflows.count,
      totalConnectors: allConnectors.count,
      usedConnectors: installedConnectors.count,
    };
  }

  async getEventQuantities(
    tenantId: number,
    periodStart: Date,
    periodEnd?: Date,
  ): Promise<UsageEventQuantity[]> {
    const conditions = [
      eq(usageEventsTable.tenantId, tenantId),
      gte(usageEventsTable.createdAt, periodStart),
    ];
    if (periodEnd)
      conditions.push(sql`${usageEventsTable.createdAt} <= ${periodEnd}`);

    return db
      .select({
        eventType: usageEventsTable.eventType,
        quantity: usageEventsTable.quantity,
      })
      .from(usageEventsTable)
      .where(and(...conditions));
  }
}
