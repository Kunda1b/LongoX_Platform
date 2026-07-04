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
  /**
   * P1-22: prompt-cache hit tokens (e.g. Anthropic cache_read_input_tokens
   * / OpenAI cached_tokens). These are tokens the provider served from
   * cache — they're typically billed at ~10% of the normal input rate.
   * Stored on `token_usage.cached_tokens` (added by migration 008; the
   * Prisma schema is backfilled lazily so we use `as any`).
   */
  cachedTokens?: number;
  /**
   * P1-22: tokens consumed by model-emitted tool calls (the hidden
   * tool-decision tokens the provider bills but doesn't surface in the
   * standard completion count). Stored on `token_usage.tool_call_tokens`.
   */
  toolCallTokens?: number;
}

export interface UsageSummary {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalCost: number;
  /**
   * P1-22: aggregate cached-token total across all models in the window.
   * Used by the billing rollup to discount cached input tokens.
   */
  totalCachedTokens: number;
  /**
   * P1-22: aggregate tool-call-token total across all models in the window.
   */
  totalToolCallTokens: number;
  byModel: Record<
    string,
    {
      inputTokens: number;
      outputTokens: number;
      cost: number;
      cachedTokens: number;
      toolCallTokens: number;
    }
  >;
}

export class TokenAccountingService {
  async recordUsage(record: UsageRecord): Promise<void> {
    // P1-22: persist `cached_tokens` and `tool_call_tokens` alongside the
    // standard input/output token counts. The underlying `token_usage`
    // table gets these columns via migration 008; the Prisma schema is
    // backfilled lazily, so we cast to `any` to set them. When the
    // columns don't exist yet (pre-migration), Postgres will reject the
    // insert — operators must run the migration before deploying this
    // code. Defaults to 0 so callers that don't supply the new fields
    // keep working unchanged.
    const cachedTokens = Math.max(0, Math.floor(record.cachedTokens ?? 0));
    const toolCallTokens = Math.max(0, Math.floor(record.toolCallTokens ?? 0));
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
        cachedTokens,
        toolCallTokens,
      } as any,
    });
  }

  async getUsageSummary(runId: string): Promise<UsageSummary> {
    const rows = await prisma.tokenUsage.findMany({
      where: { id: Number(runId) } as any,
    });

    const byModel: Record<string, { inputTokens: number; outputTokens: number; cost: number; cachedTokens: number; toolCallTokens: number }> = {};
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalCost = 0;
    let totalCachedTokens = 0;
    let totalToolCallTokens = 0;

    for (const row of rows as any[]) {
      totalInputTokens += row.inputTokens;
      totalOutputTokens += row.outputTokens;
      totalCost += Number(row.cost ?? 0);
      // P1-22: cached + tool-call tokens — default to 0 for rows
      // persisted before the migration added these columns.
      const cached = Number((row as any).cachedTokens ?? 0);
      const toolCall = Number((row as any).toolCallTokens ?? 0);
      totalCachedTokens += cached;
      totalToolCallTokens += toolCall;

      const model = row.modelName ?? "unknown";
      if (!byModel[model]) {
        byModel[model] = { inputTokens: 0, outputTokens: 0, cost: 0, cachedTokens: 0, toolCallTokens: 0 };
      }
      byModel[model].inputTokens += row.inputTokens;
      byModel[model].outputTokens += row.outputTokens;
      byModel[model].cost += Number(row.cost ?? 0);
      byModel[model].cachedTokens += cached;
      byModel[model].toolCallTokens += toolCall;
    }

    return {
      totalInputTokens,
      totalOutputTokens,
      totalTokens: totalInputTokens + totalOutputTokens,
      totalCost,
      totalCachedTokens,
      totalToolCallTokens,
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

    const byModel: Record<string, { inputTokens: number; outputTokens: number; cost: number; cachedTokens: number; toolCallTokens: number }> = {};
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalCost = 0;
    let totalCachedTokens = 0;
    let totalToolCallTokens = 0;

    for (const row of rows as any[]) {
      totalInputTokens += row.inputTokens;
      totalOutputTokens += row.outputTokens;
      totalCost += Number(row.cost ?? 0);
      // P1-22: cached + tool-call tokens (default 0 for pre-migration rows).
      const cached = Number((row as any).cachedTokens ?? 0);
      const toolCall = Number((row as any).toolCallTokens ?? 0);
      totalCachedTokens += cached;
      totalToolCallTokens += toolCall;

      const model = row.modelName ?? "unknown";
      if (!byModel[model]) {
        byModel[model] = { inputTokens: 0, outputTokens: 0, cost: 0, cachedTokens: 0, toolCallTokens: 0 };
      }
      byModel[model].inputTokens += row.inputTokens;
      byModel[model].outputTokens += row.outputTokens;
      byModel[model].cost += Number(row.cost ?? 0);
      byModel[model].cachedTokens += cached;
      byModel[model].toolCallTokens += toolCall;
    }

    return {
      totalInputTokens,
      totalOutputTokens,
      totalTokens: totalInputTokens + totalOutputTokens,
      totalCost,
      totalCachedTokens,
      totalToolCallTokens,
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
