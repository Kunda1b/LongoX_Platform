/**
 * Cost budget service.
 *
 * Migrated from Drizzle to Prisma per ADR-013 Phase 3.
 * Uses `prisma.tokenBudget` and `prisma.tokenUsage` delegates with `as any`
 * casts for legacy columns. Raw sum on `token_usage.cost` uses
 * `prisma.$queryRawUnsafe()` because of the `sum(decimal)::float` cast.
 */

import { prisma } from "@longox/db/prisma";

export class BudgetExceededError extends Error {
  constructor(
    public budgetId: string,
    public budgetName: string,
    public currentCost: number,
    public maxCost: number,
  ) {
    super(`Cost budget "${budgetName}" exceeded: ${currentCost} >= ${maxCost}`);
    this.name = "BudgetExceededError";
  }
}

export interface BudgetUsage {
  budgetId: string;
  budgetName: string;
  maxCost: number;
  currentCost: number;
  usagePercent: number;
  remaining: number;
  period: string;
}

export class CostBudgetService {
  async checkBudget(tenantId: string, estimatedCost: number): Promise<void> {
    const budgets = await prisma.tokenBudget.findMany({
      where: {
        tenantId,
        isActive: true,
      } as any,
    });

    for (const budget of budgets as any[]) {
      if (!budget.maxCost) continue;

      const now = new Date();
      let periodStart: Date;
      let periodEnd: Date;

      if (budget.period === "monthly") {
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        periodEnd = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
          23,
          59,
          59,
        );
      } else if (budget.period === "daily") {
        periodStart = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
        );
        periodEnd = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          23,
          59,
          59,
        );
      } else {
        periodStart = new Date(0);
        periodEnd = new Date(8640000000000000);
      }

      const currentTotal = await this.getCurrentPeriodCost(
        tenantId,
        periodStart,
        periodEnd,
      );
      const projectedCost = currentTotal + estimatedCost;
      const maxCost = Number(budget.maxCost);

      if (projectedCost >= maxCost) {
        throw new BudgetExceededError(
          budget.id,
          budget.name,
          projectedCost,
          maxCost,
        );
      }
    }
  }

  private async getCurrentPeriodCost(
    tenantId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<number> {
    const rows: any[] = await prisma.$queryRawUnsafe(
      `SELECT coalesce(sum(cost), 0)::float AS "totalCost"
       FROM token_usage
       WHERE tenant_id = $1 AND created_at >= $2 AND created_at <= $3`,
      tenantId,
      periodStart,
      periodEnd,
    );
    return rows?.[0]?.totalCost ?? 0;
  }

  async getBudgetUsage(tenantId: string): Promise<BudgetUsage[]> {
    const budgets = await prisma.tokenBudget.findMany({
      where: { tenantId } as any,
    });

    const now = new Date();
    const results: BudgetUsage[] = [];

    for (const budget of budgets as any[]) {
      if (!budget.maxCost) continue;

      let periodStart: Date;
      if (budget.period === "monthly") {
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      } else if (budget.period === "daily") {
        periodStart = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
        );
      } else {
        periodStart = new Date(0);
      }

      const currentCost = await this.getCurrentPeriodCost(
        tenantId,
        periodStart,
        now,
      );
      const maxCost = Number(budget.maxCost);

      results.push({
        budgetId: budget.id,
        budgetName: budget.name,
        maxCost,
        currentCost,
        usagePercent: maxCost > 0 ? (currentCost / maxCost) * 100 : 0,
        remaining: maxCost - currentCost,
        period: budget.period,
      });
    }

    return results;
  }

  async setAlertThreshold(tenantId: string, threshold: number): Promise<void> {
    await prisma.tokenBudget.updateMany({
      where: { tenantId } as any,
      data: { notifyAtPercent: threshold } as any,
    });
  }
}

export const costBudgetService = new CostBudgetService();
