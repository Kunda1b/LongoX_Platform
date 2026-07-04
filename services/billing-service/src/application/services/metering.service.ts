/**
 * Metering service.
 *
 * Migrated from Drizzle to Prisma per ADR-013 Phase 3.
 * Uses `prisma.meteringEvent` delegate with `as any` casts for legacy
 * columns (`eventId`, `unit`, `quantity` as numeric string, `workflowId`,
 * `executionId`, `connectorId`, `dashboardId`, `timestamp`, `ingestedAt`).
 *
 * Aggregation queries use `prisma.$queryRawUnsafe()` because the underlying
 * `metering_events.quantity` column is `numeric(20,4)` and Prisma's groupBy
 * cannot natively express `sum()::text` for arbitrary-precision math.
 */

import { prisma } from "@longox/db/prisma";

export interface MeteringEventInput {
  eventId: string;
  eventType: string;
  tenantId: string;
  workflowId?: string | null;
  executionId?: string | null;
  connectorId?: string | null;
  dashboardId?: string | null;
  quantity: string | number;
  unit: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

export interface UsageAggregation {
  eventType: string;
  unit: string;
  totalQuantity: string;
  count: number;
}

export interface DailyUsage {
  date: string;
  eventType: string;
  unit: string;
  totalQuantity: string;
}

export interface MonthlyUsage {
  month: string;
  eventType: string;
  unit: string;
  totalQuantity: string;
}

export class MeteringService {
  async record(input: MeteringEventInput): Promise<void> {
    // `event_id` has a unique index — emulates Drizzle's `.onConflictDoNothing({ target: eventId })`.
    try {
      await prisma.meteringEvent.create({
        data: {
          eventId: input.eventId,
          eventType: input.eventType,
          tenantId: input.tenantId,
          workflowId: input.workflowId ?? null,
          executionId: input.executionId ?? null,
          connectorId: input.connectorId ?? null,
          dashboardId: input.dashboardId ?? null,
          quantity: Number(input.quantity),
          unit: input.unit,
          metadata: (input.metadata ?? {}) as Record<string, unknown>,
          timestamp: input.timestamp,
        } as any,
      });
    } catch (err: any) {
      // P2002 = unique constraint violation → swallow to mirror onConflictDoNothing.
      if (err?.code !== "P2002") throw err;
    }
  }

  async getUsage(
    tenantId: string,
    from: Date,
    to: Date,
    eventType?: string,
  ): Promise<UsageAggregation[]> {
    const params: any[] = [tenantId, from, to];
    let typeClause = "";
    if (eventType) {
      typeClause = ` AND event_type = $4`;
      params.push(eventType);
    }
    const rows: any[] = await prisma.$queryRawUnsafe(
      `SELECT event_type AS "eventType", unit, sum(quantity)::text AS "totalQuantity", count(*)::int AS count
       FROM metering_events
       WHERE tenant_id = $1 AND timestamp >= $2 AND timestamp <= $3${typeClause}
       GROUP BY event_type, unit
       ORDER BY event_type`,
      ...params,
    );
    return rows as UsageAggregation[];
  }

  async getDailyUsage(
    tenantId: string,
    date: Date,
  ): Promise<DailyUsage[]> {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const rows: any[] = await prisma.$queryRawUnsafe(
      `SELECT (timestamp::date)::text AS date,
              event_type AS "eventType",
              unit,
              sum(quantity)::text AS "totalQuantity"
       FROM metering_events
       WHERE tenant_id = $1 AND timestamp >= $2 AND timestamp <= $3
       GROUP BY (timestamp::date), event_type, unit`,
      tenantId,
      dayStart,
      dayEnd,
    );
    return rows as DailyUsage[];
  }

  async getMonthlyUsage(
    tenantId: string,
    year: number,
    month: number,
  ): Promise<MonthlyUsage[]> {
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

    const rows: any[] = await prisma.$queryRawUnsafe(
      `SELECT to_char(timestamp, 'YYYY-MM') AS month,
              event_type AS "eventType",
              unit,
              sum(quantity)::text AS "totalQuantity"
       FROM metering_events
       WHERE tenant_id = $1 AND timestamp >= $2 AND timestamp <= $3
       GROUP BY to_char(timestamp, 'YYYY-MM'), event_type, unit`,
      tenantId,
      monthStart,
      monthEnd,
    );
    return rows as MonthlyUsage[];
  }
}
