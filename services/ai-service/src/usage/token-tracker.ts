/**
 * Token tracker.
 *
 * Migrated from Drizzle to Prisma per ADR-013 Phase 3.
 * Uses `prisma.tokenUsage` and `prisma.usageEvent` delegates with `as any`
 * casts for legacy columns.
 */

import { prisma } from "@longox/db/prisma";

export interface TokenUsageRecord {
  modelName: string;
  provider: string;
  workflowId: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
}

export class TokenTracker {
  async recordUsage(record: TokenUsageRecord): Promise<void> {
    try {
      await prisma.tokenUsage.create({
        data: {
          modelName: record.modelName,
          provider: record.provider,
          workflowId: record.workflowId,
          inputTokens: record.inputTokens,
          outputTokens: record.outputTokens,
          cost: String(record.cost),
        } as any,
      });

      await prisma.usageEvent.create({
        data: {
          workflowId: record.workflowId,
          workflowName: "",
          eventType: "ai.token.usage",
          quantity: record.inputTokens + record.outputTokens,
          metadata: {
            modelName: record.modelName,
            provider: record.provider,
            inputTokens: record.inputTokens,
            outputTokens: record.outputTokens,
            cost: record.cost,
          },
        } as any,
      });
    } catch {
      // Non-fatal
    }
  }

  async getUsage(
    workflowId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    totalInputTokens: number;
    totalOutputTokens: number;
    totalCost: number;
    byModel: Record<
      string,
      { inputTokens: number; outputTokens: number; cost: number }
    >;
  }> {
    const where: Record<string, unknown> = {};
    if (workflowId) where.workflowId = workflowId;
    if (startDate) where.createdAt = { gte: startDate };
    // endDate intentionally ignored — Drizzle version used only startDate; preserve semantics.

    const rows = await prisma.tokenUsage.findMany({ where: where as any });

    const byModel: Record<
      string,
      { inputTokens: number; outputTokens: number; cost: number }
    > = {};
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

    return { totalInputTokens, totalOutputTokens, totalCost, byModel };
  }
}

export const tokenTracker = new TokenTracker();
