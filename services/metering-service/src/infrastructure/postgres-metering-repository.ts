/**
 * Prisma-based metering repository.
 *
 * Migrated from Drizzle to Prisma per ADR-013 Phase 3.
 * Uses `prisma.usageEvent` delegate.
 */

import { prisma } from "@longox/db/prisma";
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

type UsageEventRow = {
  id: string;
  tenantId: string | null;
  workflowId: string | null;
  workflowName: string | null;
  eventType: string;
  quantity: number;
  metadata: unknown;
  createdAt: Date;
};

export class PostgresMeteringRepository implements MeteringRepository {
  private eventToDomain(row: UsageEventRow): MeteringEvent {
    return new MeteringEvent({
      id: row.id,
      tenantId: (row.tenantId as string) ?? ("" as unknown as string),
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
    const row = await prisma.usageEvent.create({
      data: {
        tenantId: props.tenantId,
        eventType: props.eventType,
        quantity: props.quantity,
        workflowId: props.workflowId,
        metadata: props.metadata as any,
        createdAt: props.timestamp,
      } as any,
    });
    return this.eventToDomain(row as unknown as UsageEventRow);
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
    const where: Record<string, unknown> = { tenantId };
    if (filters?.eventType) where.eventType = filters.eventType;
    if (filters?.from || filters?.to) {
      where.createdAt = {
        ...(filters?.from ? { gte: filters.from } : {}),
        ...(filters?.to ? { lte: filters.to } : {}),
      };
    }
    if (filters?.workflowId) where.workflowId = filters.workflowId;

    const rows = await prisma.usageEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: filters?.limit ?? 100,
    });

    return rows.map((r) =>
      this.eventToDomain(r as unknown as UsageEventRow),
    );
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
    const rows = await prisma.usageEvent.groupBy({
      by: ["eventType"],
      where: {
        tenantId,
        createdAt: { gte: from, lte: to },
      },
      _sum: { quantity: true },
      _count: { _all: true },
    });

    return rows.map((r) => ({
      eventType: r.eventType,
      totalQuantity: (r._sum.quantity ?? 0) as number,
      totalCount: r._count._all,
    }));
  }
}
