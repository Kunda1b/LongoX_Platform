import { db, tokenUsageTable, usageRollupsTable, tokenBudgetsTable } from "@longox/db";
import { eq, sql, and, gte, lte } from "drizzle-orm";

export class BudgetExceededError extends Error {
  constructor(
    public budgetId: number,
    public budgetName: string,
    public currentCost: number,
    public maxCost: number,
  ) {
    super(`Budget "${budgetName}" exceeded: ${currentCost} >= ${maxCost}`);
    this.name = "BudgetExceededError";
  }
}

export interface UsageRecord {
  runId?: string;
  tenantId?: string;
  modelId?: string;
  modelName: string;
  provider: string;
  promptId?: string;
  workflowId?: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
}

export interface UsageSummary {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalCost: number;
  byModel: Record<string, { inputTokens: number; outputTokens: number; cost: number }>;
}

export class TokenAccountingService {
  async recordUsage(record: UsageRecord): Promise<void> {
    await db.insert(tokenUsageTable).values({
      tenantId: record.tenantId ?? null,
      modelId: record.modelId ?? null,
      modelName: record.modelName,
      provider: record.provider,
      promptId: record.promptId ?? null,
      workflowId: record.workflowId ?? null,
      inputTokens: record.inputTokens,
      outputTokens: record.outputTokens,
      cost: String(record.cost),
    } as any);
  }

  async getUsageSummary(runId: string): Promise<UsageSummary> {
    const rows = await db
      .select()
      .from(tokenUsageTable)
      .where(eq(tokenUsageTable.id, runId));

    const byModel: Record<string, { inputTokens: number; outputTokens: number; cost: number }> = {};
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalCost = 0;

    for (const row of rows) {
      totalInputTokens += row.inputTokens;
      totalOutputTokens += row.outputTokens;
      totalCost += Number(row.cost ?? 0);

      const model = row.modelName ?? "unknown";
      if (!byModel[model]) {
        byModel[model] = { inputTokens: 0, outputTokens: 0, cost: 0 };
      }
      byModel[model].inputTokens += row.inputTokens;
      byModel[model].outputTokens += row.outputTokens;
      byModel[model].cost += Number(row.cost ?? 0);
    }

    return {
      totalInputTokens,
      totalOutputTokens,
      totalTokens: totalInputTokens + totalOutputTokens,
      totalCost,
      byModel,
    };
  }

  async getTenantUsage(
    tenantId: string,
    period?: { start: Date; end: Date },
  ): Promise<UsageSummary> {
    const conditions = [eq(tokenUsageTable.tenantId, tenantId)];
    if (period) {
      conditions.push(gte(tokenUsageTable.createdAt, period.start));
      conditions.push(lte(tokenUsageTable.createdAt, period.end));
    }

    const rows = await db
      .select()
      .from(tokenUsageTable)
      .where(and(...conditions));

    const byModel: Record<string, { inputTokens: number; outputTokens: number; cost: number }> = {};
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalCost = 0;

    for (const row of rows) {
      totalInputTokens += row.inputTokens;
      totalOutputTokens += row.outputTokens;
      totalCost += Number(row.cost ?? 0);

      const model = row.modelName ?? "unknown";
      if (!byModel[model]) {
        byModel[model] = { inputTokens: 0, outputTokens: 0, cost: 0 };
      }
      byModel[model].inputTokens += row.inputTokens;
      byModel[model].outputTokens += row.outputTokens;
      byModel[model].cost += Number(row.cost ?? 0);
    }

    return {
      totalInputTokens,
      totalOutputTokens,
      totalTokens: totalInputTokens + totalOutputTokens,
      totalCost,
      byModel,
    };
  }

  async updateRollups(
    tenantId: string,
    period: string,
    metricName: string,
    quantity: number,
    cost: number,
  ): Promise<void> {
    const now = new Date();
    const periodStart = period === "monthly"
      ? new Date(now.getFullYear(), now.getMonth(), 1)
      : period === "daily"
        ? new Date(now.getFullYear(), now.getMonth(), now.getDate())
        : now;

    const periodEnd = period === "monthly"
      ? new Date(now.getFullYear(), now.getMonth() + 1, 0)
      : period === "daily"
        ? new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
        : now;

    const existing = await db
      .select()
      .from(usageRollupsTable)
      .where(
        and(
          eq(usageRollupsTable.tenantId, tenantId),
          eq(usageRollupsTable.rollupType, "ai"),
          eq(usageRollupsTable.period, period),
          eq(usageRollupsTable.metricName, metricName),
        ),
      );

    if (existing.length > 0) {
      const current = existing[0];
      await db
        .update(usageRollupsTable)
        .set({
          totalQuantity: String(Number(current.totalQuantity) + quantity),
          cost: String(Number(current.cost) + cost),
          sourceCount: current.sourceCount + 1,
        } as any)
        .where(eq(usageRollupsTable.id, current.id));
    } else {
      await db.insert(usageRollupsTable).values({
        tenantId,
        rollupType: "ai",
        period,
        periodStart,
        periodEnd,
        metricName,
        metricUnit: "tokens",
        totalQuantity: String(quantity),
        billableQuantity: String(quantity),
        cost: String(cost),
        sourceCount: 1,
      } as any);
    }
  }
}

export const tokenAccountingService = new TokenAccountingService();
