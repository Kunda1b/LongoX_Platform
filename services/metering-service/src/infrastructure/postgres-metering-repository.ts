import { eq, and as andOp, gte, lte, sql, desc } from "drizzle-orm";
import { db, usageEventsTable } from "@longox/db";
import { MeteringEvent } from "../domain/metering-event.entity";
import { UsageAggregate } from "../domain/usage-aggregate.entity";
import type { MeteringRepository } from "../domain/metering-repository";
import type {
  MeteringEventProps,
  EventType,
} from "../domain/metering-event.entity";
import type {
  UsageAggregateProps,
  AggregatePeriod,
} from "../domain/usage-aggregate.entity";

export class PostgresMeteringRepository implements MeteringRepository {
  private eventToDomain(
    row: typeof usageEventsTable.$inferSelect,
  ): MeteringEvent {
    return new MeteringEvent({
      id: row.id,
      tenantId: row.tenantId ?? 0,
      eventType: (row.eventType as EventType) ?? "api.call",
      quantity: row.quantity,
      unit: "count",
      metadata: (row.metadata ?? {}) as Record<string, unknown>,
      source: "system",
      sourceId: undefined,
      workflowId: row.workflowId ?? undefined,
      executionId: undefined,
      timestamp: row.createdAt,
      createdAt: row.createdAt,
    });
  }

  async recordEvent(
    props: Omit<MeteringEventProps, "id" | "createdAt">,
  ): Promise<MeteringEvent> {
    const [row] = await db
      .insert(usageEventsTable)
      .values({
        tenantId: props.tenantId,
        eventType: props.eventType,
        quantity: props.quantity,
        workflowId: props.workflowId,
        metadata: props.metadata,
        createdAt: props.timestamp,
      })
      .returning();
    return this.eventToDomain(row);
  }

  async findEvents(
    tenantId: string,
    filters?: {
      eventType?: EventType;
      from?: Date;
      to?: Date;
      workflowId?: string;
      limit?: number;
    },
  ): Promise<MeteringEvent[]> {
    const conditions = [eq(usageEventsTable.tenantId, tenantId)];
    if (filters?.eventType)
      conditions.push(eq(usageEventsTable.eventType, filters.eventType));
    if (filters?.from)
      conditions.push(gte(usageEventsTable.createdAt, filters.from));
    if (filters?.to)
      conditions.push(lte(usageEventsTable.createdAt, filters.to));
    if (filters?.workflowId)
      conditions.push(eq(usageEventsTable.workflowId, filters.workflowId));

    const rows = await db
      .select()
      .from(usageEventsTable)
      .where(andOp(...conditions))
      .orderBy(desc(usageEventsTable.createdAt))
      .limit(filters?.limit ?? 100);

    return rows.map(this.eventToDomain);
  }

  async getAggregate(
    tenantId: string,
    eventType: string,
    _period: AggregatePeriod,
    _periodStart: Date,
  ): Promise<UsageAggregate | null> {
    const events = await this.findEvents(tenantId, {
      eventType: eventType as EventType,
    });
    if (events.length === 0) return null;

    return new UsageAggregate({
      id: "",
      tenantId,
      eventType,
      period: _period,
      periodStart: _periodStart,
      periodEnd: new Date(_periodStart.getTime() + 86400000),
      totalQuantity: events.reduce((s, e) => s + e.quantity, 0),
      totalCount: events.length,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  async upsertAggregate(
    _props: Omit<UsageAggregateProps, "id" | "createdAt" | "updatedAt">,
  ): Promise<UsageAggregate> {
    const existing = await this.getAggregate(
      _props.tenantId,
      _props.eventType,
      _props.period,
      _props.periodStart,
    );
    if (existing) {
      existing.addUsage(_props.totalQuantity);
      return existing;
    }
    return new UsageAggregate({
      ..._props,
      id: "",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  async getUsageSummary(
    tenantId: string,
    from: Date,
    to: Date,
  ): Promise<
    { eventType: string; totalQuantity: number; totalCount: number }[]
  > {
    const rows = await db
      .select({
        eventType: usageEventsTable.eventType,
        totalQuantity: sql<number>`sum(${usageEventsTable.quantity})`,
        totalCount: sql<number>`count(*)::int`,
      })
      .from(usageEventsTable)
      .where(
        andOp(
          eq(usageEventsTable.tenantId, tenantId),
          gte(usageEventsTable.createdAt, from),
          lte(usageEventsTable.createdAt, to),
        ),
      )
      .groupBy(usageEventsTable.eventType);

    return rows as {
      eventType: string;
      totalQuantity: number;
      totalCount: number;
    }[];
  }
}
