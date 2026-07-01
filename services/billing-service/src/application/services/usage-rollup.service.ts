import { db, usageRollupsTable, meteringEventsTable, billingPlansTable, billingAccountsTable } from "@longox/db";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import type { InsertUsageRollup } from "@longox/db";

export class UsageRollupService {
  async rollupDaily(tenantId: number, date: Date): Promise<void> {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const rows = await db
      .select({
        eventType: meteringEventsTable.eventType,
        unit: meteringEventsTable.unit,
        totalQuantity: sql<string>`sum(${meteringEventsTable.quantity})`,
        count: sql<number>`count(*)::int`,
      })
      .from(meteringEventsTable)
      .where(
        and(
          eq(meteringEventsTable.tenantId, tenantId),
          gte(meteringEventsTable.timestamp, dayStart),
          lte(meteringEventsTable.timestamp, dayEnd),
        ),
      )
      .groupBy(meteringEventsTable.eventType, meteringEventsTable.unit);

    const breakdown: Record<string, { total: string; unit: string; count: number }> = {};
    let meteredTotal = 0;
    let billableTotal = 0;

    for (const row of rows) {
      breakdown[row.eventType] = {
        total: row.totalQuantity,
        unit: row.unit,
        count: row.count,
      };
      meteredTotal += Number(row.totalQuantity);
    }

    const [account] = await db
      .select()
      .from(billingAccountsTable)
      .where(eq(billingAccountsTable.tenantId, tenantId))
      .limit(1);

    let plan = null;
    if (account?.planId) {
      const [planRecord] = await db
        .select()
        .from(billingPlansTable)
        .where(eq(billingPlansTable.id, account.planId))
        .limit(1);
      plan = planRecord;
    }

    for (const [eventType, data] of Object.entries(breakdown)) {
      const value: InsertUsageRollup = {
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

      const existingRollupType = "daily";
      const existingPeriodStart = dayStart;
      const existingMetricName = eventType;

      const [existing] = await db
        .select()
        .from(usageRollupsTable)
        .where(
          and(
            eq(usageRollupsTable.tenantId, tenantId),
            eq(usageRollupsTable.rollupType, existingRollupType),
            eq(usageRollupsTable.period, "daily"),
            eq(usageRollupsTable.periodStart, existingPeriodStart),
            eq(usageRollupsTable.metricName, existingMetricName),
          ),
        )
        .limit(1);

      if (existing) {
        await db
          .update(usageRollupsTable)
          .set(value)
          .where(eq(usageRollupsTable.id, existing.id));
      } else {
        await db.insert(usageRollupsTable).values(value);
      }
    }
  }

  async rollupMonthly(tenantId: number, year: number, month: number): Promise<void> {
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

    const dailyRollups = await db
      .select({
        metricName: usageRollupsTable.metricName,
        metricUnit: usageRollupsTable.metricUnit,
        totalQuantity: sql<string>`sum(${usageRollupsTable.totalQuantity}::numeric)`,
        billableQuantity: sql<string>`sum(${usageRollupsTable.billableQuantity}::numeric)`,
        meteredTotal: sql<string>`sum(${usageRollupsTable.meteredTotal}::numeric)`,
        billableTotal: sql<string>`sum(${usageRollupsTable.billableTotal}::numeric)`,
        sourceCount: sql<number>`sum(${usageRollupsTable.sourceCount})::int`,
      })
      .from(usageRollupsTable)
      .where(
        and(
          eq(usageRollupsTable.tenantId, tenantId),
          eq(usageRollupsTable.period, "daily"),
          gte(usageRollupsTable.periodStart, monthStart),
          lte(usageRollupsTable.periodStart, monthEnd),
        ),
      )
      .groupBy(usageRollupsTable.metricName, usageRollupsTable.metricUnit);

    const [account] = await db
      .select()
      .from(billingAccountsTable)
      .where(eq(billingAccountsTable.tenantId, tenantId))
      .limit(1);

    let plan = null;
    if (account?.planId) {
      const [planRecord] = await db
        .select()
        .from(billingPlansTable)
        .where(eq(billingPlansTable.id, account.planId))
        .limit(1);
      plan = planRecord;
    }

    for (const row of dailyRollups) {
      const breakdown: Record<string, unknown> = {};
      const value: InsertUsageRollup = {
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

      const [existing] = await db
        .select()
        .from(usageRollupsTable)
        .where(
          and(
            eq(usageRollupsTable.tenantId, tenantId),
            eq(usageRollupsTable.rollupType, "monthly"),
            eq(usageRollupsTable.period, "monthly"),
            eq(usageRollupsTable.periodStart, monthStart),
            eq(usageRollupsTable.metricName, row.metricName),
          ),
        )
        .limit(1);

      if (existing) {
        await db
          .update(usageRollupsTable)
          .set(value)
          .where(eq(usageRollupsTable.id, existing.id));
      } else {
        await db.insert(usageRollupsTable).values(value);
      }
    }
  }

  async rollupAll(tenantId: number): Promise<void> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    await this.rollupDaily(tenantId, yesterday);

    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const year = lastMonth.getFullYear();
    const month = lastMonth.getMonth() + 1;
    await this.rollupMonthly(tenantId, year, month);
  }

  private getOverageRate(plan: { overageExecutionsPrice?: number | null; overageAiTokensPrice?: number | null }, eventType: string): string | null {
    if (eventType === "workflow.execution" || eventType === "execution") {
      return plan.overageExecutionsPrice != null ? String(plan.overageExecutionsPrice) : null;
    }
    if (eventType === "ai.token" || eventType === "token") {
      return plan.overageAiTokensPrice != null ? String(plan.overageAiTokensPrice) : null;
    }
    return null;
  }
}
