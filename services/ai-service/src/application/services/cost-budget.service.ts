import { db, tokenBudgetsTable, tokenUsageTable } from "@longox/db";
import { eq, and, sql, gte, lte } from "drizzle-orm";

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
    const budgets = await db
      .select()
      .from(tokenBudgetsTable)
      .where(
        and(
          eq(tokenBudgetsTable.tenantId, tenantId),
          eq(tokenBudgetsTable.isActive, true),
        ),
      );

    for (const budget of budgets) {
      if (!budget.maxCost) continue;

      const now = new Date();
      let periodStart: Date;
      let periodEnd: Date;

      if (budget.period === "monthly") {
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      } else if (budget.period === "daily") {
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      } else {
        periodStart = new Date(0);
        periodEnd = new Date(8640000000000000);
      }

      const currentTotal = await this.getCurrentPeriodCost(tenantId, periodStart, periodEnd);
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
    const result = await db
      .select({
        totalCost: sql<number>`coalesce(sum(cost), 0)::float`,
      })
      .from(tokenUsageTable)
      .where(
        and(
          eq(tokenUsageTable.tenantId, tenantId),
          gte(tokenUsageTable.createdAt, periodStart),
          lte(tokenUsageTable.createdAt, periodEnd),
        ),
      );

    return result[0]?.totalCost ?? 0;
  }

  async getBudgetUsage(tenantId: string): Promise<BudgetUsage[]> {
    const budgets = await db
      .select()
      .from(tokenBudgetsTable)
      .where(eq(tokenBudgetsTable.tenantId, tenantId));

    const now = new Date();
    const results: BudgetUsage[] = [];

    for (const budget of budgets) {
      if (!budget.maxCost) continue;

      let periodStart: Date;
      if (budget.period === "monthly") {
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      } else if (budget.period === "daily") {
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else {
        periodStart = new Date(0);
      }

      const currentCost = await this.getCurrentPeriodCost(tenantId, periodStart, now);
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
    await db
      .update(tokenBudgetsTable)
      .set({ notifyAtPercent: threshold })
      .where(eq(tokenBudgetsTable.tenantId, tenantId));
  }
}

export const costBudgetService = new CostBudgetService();
