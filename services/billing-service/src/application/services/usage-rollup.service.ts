/**
 * Usage rollup service.
 *
 * Migrated from Drizzle to Prisma per ADR-013 Phase 3.
 * Uses `prisma.usageRollup`, `prisma.billingAccount`, `prisma.billingPlan`
 * delegates with `as any` casts for legacy columns.
 *
 * Raw aggregations on `metering_events` and `usage_rollups` use
 * `prisma.$queryRawUnsafe()` because the numeric-to-string casts cannot be
 * expressed via Prisma's groupBy.
 */

import { prisma } from "@longox/db/prisma";

export class UsageRollupService {
  async rollupDaily(tenantId: string, date: Date): Promise<void> {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const rows: any[] = await prisma.$queryRawUnsafe(
      `SELECT event_type AS "eventType",
              unit,
              sum(quantity)::text AS "totalQuantity",
              count(*)::int AS count
       FROM metering_events
       WHERE tenant_id = $1 AND timestamp >= $2 AND timestamp <= $3
       GROUP BY event_type, unit`,
      tenantId,
      dayStart,
      dayEnd,
    );

    const breakdown: Record<
      string,
      { total: string; unit: string; count: number }
    > = {};
    let meteredTotal = 0;
    const billableTotal = 0;

    for (const row of rows) {
      breakdown[row.eventType] = {
        total: row.totalQuantity,
        unit: row.unit,
        count: row.count,
      };
      meteredTotal += Number(row.totalQuantity);
    }

    const account = await prisma.billingAccount.findFirst({
      where: { tenantId } as any,
    });

    let plan: any = null;
    if ((account as any)?.planId) {
      plan = await prisma.billingPlan.findUnique({
        where: { id: (account as any).planId },
      });
    }

    for (const [eventType, data] of Object.entries(breakdown)) {
      const value: any = {
        tenantId,
        rollupType: "daily",
        period: "daily",
        periodStart: dayStart,
        periodEnd: dayEnd,
        metricName: eventType,
        metricUnit: data.unit,
        totalQuantity: data.total,
        billableQuantity: data.total,
        meteredTotal: String(meteredTotal),
        billableTotal: String(billableTotal),
        breakdown,
        tier: plan?.tier ?? null,
        rate: plan ? this.getOverageRate(plan, eventType) : null,
        cost: plan ? String(billableTotal) : "0",
        sourceCount: data.count,
      };

      const existing = await prisma.usageRollup.findFirst({
        where: {
          tenantId,
          rollupType: "daily",
          period: "daily",
          periodStart: dayStart,
          metricName: eventType,
        } as any,
      });

      if (existing) {
        await prisma.usageRollup.update({
          where: { id: existing.id },
          data: value as any,
        });
      } else {
        await prisma.usageRollup.create({ data: value as any });
      }
    }
  }

  async rollupMonthly(
    tenantId: string,
    year: number,
    month: number,
  ): Promise<void> {
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

    const dailyRollups: any[] = await prisma.$queryRawUnsafe(
      `SELECT metric_name AS "metricName",
              metric_unit AS "metricUnit",
              sum(total_quantity::numeric)::text AS "totalQuantity",
              sum(billable_quantity::numeric)::text AS "billableQuantity",
              sum(metered_total::numeric)::text AS "meteredTotal",
              sum(billable_total::numeric)::text AS "billableTotal",
              sum(source_count)::int AS "sourceCount"
       FROM usage_rollups
       WHERE tenant_id = $1 AND period = 'daily'
         AND period_start >= $2 AND period_start <= $3
       GROUP BY metric_name, metric_unit`,
      tenantId,
      monthStart,
      monthEnd,
    );

    const account = await prisma.billingAccount.findFirst({
      where: { tenantId } as any,
    });

    let plan: any = null;
    if ((account as any)?.planId) {
      plan = await prisma.billingPlan.findUnique({
        where: { id: (account as any).planId },
      });
    }

    for (const row of dailyRollups) {
      const breakdown: Record<string, unknown> = {};
      const value: any = {
        tenantId,
        rollupType: "monthly",
        period: "monthly",
        periodStart: monthStart,
        periodEnd: monthEnd,
        metricName: row.metricName,
        metricUnit: row.metricUnit,
        totalQuantity: row.totalQuantity,
        billableQuantity: row.billableQuantity,
        meteredTotal: row.meteredTotal,
        billableTotal: row.billableTotal,
        breakdown,
        tier: plan?.tier ?? null,
        rate: plan ? this.getOverageRate(plan, row.metricName) : null,
        cost: row.billableTotal,
        sourceCount: row.sourceCount,
      };

      const existing = await prisma.usageRollup.findFirst({
        where: {
          tenantId,
          rollupType: "monthly",
          period: "monthly",
          periodStart: monthStart,
          metricName: row.metricName,
        } as any,
      });

      if (existing) {
        await prisma.usageRollup.update({
          where: { id: existing.id },
          data: value as any,
        });
      } else {
        await prisma.usageRollup.create({ data: value as any });
      }
    }
  }

  async rollupAll(tenantId: string): Promise<void> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    await this.rollupDaily(tenantId, yesterday);

    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const year = lastMonth.getFullYear();
    const month = lastMonth.getMonth() + 1;
    await this.rollupMonthly(tenantId, year, month);
  }

  private getOverageRate(
    plan: {
      overageExecutionsPrice?: number | null;
      overageAiTokensPrice?: number | null;
    },
    eventType: string,
  ): string | null {
    if (eventType === "workflow.execution" || eventType === "execution") {
      return plan.overageExecutionsPrice != null
        ? String(plan.overageExecutionsPrice)
        : null;
    }
    if (eventType === "ai.token" || eventType === "token") {
      return plan.overageAiTokensPrice != null
        ? String(plan.overageAiTokensPrice)
        : null;
    }
    return null;
  }
}
