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

let seeded = false;

async function ensureUsageEvents(): Promise<void> {
  if (seeded) return;
  seeded = true;

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(usageEventsTable);
  if (count > 0) return;

  const executions = await db
    .select({
      id: executionsTable.id,
      workflowId: executionsTable.workflowId,
      workflowName: executionsTable.workflowName,
      startedAt: executionsTable.startedAt,
      status: executionsTable.status,
    })
    .from(executionsTable)
    .limit(200);

  if (executions.length === 0) return;

  const events = executions.map((e) => ({
    workflowId: e.workflowId,
    workflowName: e.workflowName,
    eventType: "workflow.run",
    quantity: 1,
    metadata: { executionId: e.id, status: e.status } as Record<
      string,
      unknown
    >,
    createdAt: e.startedAt,
  }));

  const connectorEvents = executions
    .slice(0, Math.floor(executions.length * 0.7))
    .map((e) => ({
      workflowId: e.workflowId,
      workflowName: e.workflowName,
      eventType: "connector.call",
      quantity: Math.floor(Math.random() * 5) + 1,
      metadata: { executionId: e.id } as Record<string, unknown>,
      createdAt: e.startedAt,
    }));

  await db.insert(usageEventsTable).values([...events, ...connectorEvents]);
}

export class PostgresUsageRepository implements UsageRepository {
  async listEvents(filter: ListUsageEventsFilter): Promise<UsageEvent[]> {
    await ensureUsageEvents();
    const limit = Math.min(filter.limit ?? 50, 200);

    const conditions = [];
    if (filter.workflowId)
      conditions.push(eq(usageEventsTable.workflowId, filter.workflowId));
    if (filter.eventType)
      conditions.push(eq(usageEventsTable.eventType, filter.eventType));

    const rows = await db
      .select()
      .from(usageEventsTable)
      .where(conditions.length ? and(...conditions) : undefined)
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

  async getMetrics(monthStart: Date): Promise<UsageMetrics> {
    await ensureUsageEvents();

    const [allExecs] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(executionsTable);
    const [monthExecs] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(executionsTable)
      .where(gte(executionsTable.startedAt, monthStart));
    const [allWorkflows] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(workflowsTable);
    const [activeWorkflows] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(workflowsTable)
      .where(eq(workflowsTable.status, "active"));
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
    periodStart: Date,
    periodEnd?: Date,
  ): Promise<UsageEventQuantity[]> {
    await ensureUsageEvents();

    const conditions = [gte(usageEventsTable.createdAt, periodStart)];
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
