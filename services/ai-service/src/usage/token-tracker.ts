import { db, tokenUsageTable, usageEventsTable } from "@longox/db";
import { eq, sql, and, gte } from "drizzle-orm";

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
      await db.insert(tokenUsageTable).values({
        modelName: record.modelName,
        provider: record.provider,
        workflowId: record.workflowId,
        inputTokens: record.inputTokens,
        outputTokens: record.outputTokens,
        cost: String(record.cost),
      } as any);

      await db.insert(usageEventsTable).values({
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
    const conditions = [];
    if (workflowId) conditions.push(eq(tokenUsageTable.workflowId, workflowId));
    if (startDate) conditions.push(gte(tokenUsageTable.createdAt, startDate));

    const rows = await db
      .select()
      .from(tokenUsageTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const byModel: Record<
      string,
      { inputTokens: number; outputTokens: number; cost: number }
    > = {};
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

    return { totalInputTokens, totalOutputTokens, totalCost, byModel };
  }
}

export const tokenTracker = new TokenTracker();
