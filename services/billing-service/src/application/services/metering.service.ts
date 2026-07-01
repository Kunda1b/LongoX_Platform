import { db, meteringEventsTable } from "@longox/db";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import type { InsertMeteringEvent } from "@longox/db";

export interface MeteringEventInput {
  eventId: string;
  eventType: string;
  tenantId: number;
  workflowId?: number | null;
  executionId?: number | null;
  connectorId?: number | null;
  dashboardId?: number | null;
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
    const value: InsertMeteringEvent = {
      eventId: input.eventId,
      eventType: input.eventType,
      tenantId: input.tenantId,
      workflowId: input.workflowId ?? null,
      executionId: input.executionId ?? null,
      connectorId: input.connectorId ?? null,
      dashboardId: input.dashboardId ?? null,
      quantity: String(input.quantity),
      unit: input.unit,
      metadata: (input.metadata ?? {}) as Record<string, unknown>,
      timestamp: input.timestamp,
    };
    await db
      .insert(meteringEventsTable)
      .values(value)
      .onConflictDoNothing({ target: meteringEventsTable.eventId });
  }

  async getUsage(
    tenantId: number,
    from: Date,
    to: Date,
    eventType?: string,
  ): Promise<UsageAggregation[]> {
    const conditions = [
      eq(meteringEventsTable.tenantId, tenantId),
      gte(meteringEventsTable.timestamp, from),
      lte(meteringEventsTable.timestamp, to),
    ];
    if (eventType) {
      conditions.push(eq(meteringEventsTable.eventType, eventType));
    }

    const rows = await db
      .select({
        eventType: meteringEventsTable.eventType,
        unit: meteringEventsTable.unit,
        totalQuantity: sql<string>`sum(${meteringEventsTable.quantity})`,
        count: sql<number>`count(*)::int`,
      })
      .from(meteringEventsTable)
      .where(and(...conditions))
      .groupBy(meteringEventsTable.eventType, meteringEventsTable.unit)
      .orderBy(meteringEventsTable.eventType);

    return rows;
  }

  async getDailyUsage(
    tenantId: number,
    date: Date,
  ): Promise<DailyUsage[]> {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const rows = await db
      .select({
        date: sql<string>`${meteringEventsTable.timestamp}::date::text`,
        eventType: meteringEventsTable.eventType,
        unit: meteringEventsTable.unit,
        totalQuantity: sql<string>`sum(${meteringEventsTable.quantity})`,
      })
      .from(meteringEventsTable)
      .where(
        and(
          eq(meteringEventsTable.tenantId, tenantId),
          gte(meteringEventsTable.timestamp, dayStart),
          lte(meteringEventsTable.timestamp, dayEnd),
        ),
      )
      .groupBy(
        sql`${meteringEventsTable.timestamp}::date`,
        meteringEventsTable.eventType,
        meteringEventsTable.unit,
      );

    return rows;
  }

  async getMonthlyUsage(
    tenantId: number,
    year: number,
    month: number,
  ): Promise<MonthlyUsage[]> {
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

    const rows = await db
      .select({
        month: sql<string>`to_char(${meteringEventsTable.timestamp}, 'YYYY-MM')`,
        eventType: meteringEventsTable.eventType,
        unit: meteringEventsTable.unit,
        totalQuantity: sql<string>`sum(${meteringEventsTable.quantity})`,
      })
      .from(meteringEventsTable)
      .where(
        and(
          eq(meteringEventsTable.tenantId, tenantId),
          gte(meteringEventsTable.timestamp, monthStart),
          lte(meteringEventsTable.timestamp, monthEnd),
        ),
      )
      .groupBy(
        sql`to_char(${meteringEventsTable.timestamp}, 'YYYY-MM')`,
        meteringEventsTable.eventType,
        meteringEventsTable.unit,
      );

    return rows;
  }
}
