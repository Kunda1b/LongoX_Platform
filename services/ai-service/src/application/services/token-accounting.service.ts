/**
 * Token accounting service.
 *
 * Migrated from Drizzle to Prisma per ADR-013 Phase 3.
 * Uses `prisma.tokenUsage` and `prisma.usageRollup` delegates with `as any`
 * casts for legacy columns.
 */

import { prisma } from "@longox/db/prisma";

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
    await prisma.tokenUsage.create({
      data: {
        tenantId: record.tenantId ?? null,
        modelId: record.modelId ?? null,
        modelName: record.modelName,
        provider: record.provider,
        promptId: record.promptId ?? null,
        workflowId: record.workflowId ?? null,
        inputTokens: record.inputTokens,
        outputTokens: record.outputTokens,
        cost: record.cost,
      } as any,
    });
  }

  async getUsageSummary(runId: string): Promise<UsageSummary> {
    const rows = await prisma.tokenUsage.findMany({
      where: { id: Number(runId) } as any,
    });

    const byModel: Record<string, { inputTokens: number; outputTokens: number; cost: number }> = {};
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalCost = 0;

    for (const row of rows as any[]) {
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
    const where: Record<string, unknown> = { tenantId };
    if (period) {
      where.createdAt = { gte: period.start, lte: period.end };
    }

    const rows = await prisma.tokenUsage.findMany({
      where: where as any,
    });

    const byModel: Record<string, { inputTokens: number; outputTokens: number; cost: number }> = {};
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalCost = 0;

    for (const row of rows as any[]) {
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

    const existing = await prisma.usageRollup.findMany({
      where: {
        tenantId,
        rollupType: "ai",
        period,
        metricName,
      } as any,
    });

    if (existing.length > 0) {
      const current = existing[0] as any;
      await prisma.usageRollup.update({
        where: { id: current.id },
        data: {
          totalQuantity: String(Number(current.totalQuantity) + quantity),
          cost: String(Number(current.cost) + cost),
          sourceCount: current.sourceCount + 1,
        } as any,
      });
    } else {
      await prisma.usageRollup.create({
        data: {
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
        } as any,
      });
    }
  }
}

export const tokenAccountingService = new TokenAccountingService();
