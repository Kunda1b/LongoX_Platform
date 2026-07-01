import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { db, tokenUsageTable, aiModelsTable } from "@longox/db";
import { authorize } from "@longox/shared-rbac";

const router: IRouter = Router();

router.get("/ai/usage", authorize("ai:read"), async (req, res): Promise<void> => {
  const limit = Math.min(Number(req.query.limit ?? 50), 200);
  const rows = await db
    .select()
    .from(tokenUsageTable)
    .orderBy(tokenUsageTable.createdAt)
    .limit(limit);
  res.json(
    rows.map((r) => ({
      id: r.id,
      modelId: r.modelId ?? null,
      modelName: r.modelName ?? null,
      provider: r.provider ?? null,
      promptId: r.promptId ?? null,
      workflowId: r.workflowId ?? null,
      inputTokens: r.inputTokens,
      outputTokens: r.outputTokens,
      cost: Number(r.cost),
      createdAt: r.createdAt.toISOString(),
    })),
  );
});

router.get("/ai/usage/summary", authorize("ai:read"), async (_req, res): Promise<void> => {
  const totals = await db
    .select({
      totalInputTokens: sql<number>`coalesce(sum(input_tokens), 0)::int`,
      totalOutputTokens: sql<number>`coalesce(sum(output_tokens), 0)::int`,
      totalCost: sql<number>`coalesce(sum(cost), 0)::float`,
      totalRequests: sql<number>`count(*)::int`,
    })
    .from(tokenUsageTable);

  const byProviderRaw = await db
    .select({
      provider: tokenUsageTable.provider,
      inputTokens: sql<number>`sum(input_tokens)::int`,
      outputTokens: sql<number>`sum(output_tokens)::int`,
      cost: sql<number>`sum(cost)::float`,
      requests: sql<number>`count(*)::int`,
    })
    .from(tokenUsageTable)
    .groupBy(tokenUsageTable.provider);

  const byModelRaw = await db
    .select({
      modelName: tokenUsageTable.modelName,
      provider: tokenUsageTable.provider,
      inputTokens: sql<number>`sum(input_tokens)::int`,
      outputTokens: sql<number>`sum(output_tokens)::int`,
      cost: sql<number>`sum(cost)::float`,
      requests: sql<number>`count(*)::int`,
    })
    .from(tokenUsageTable)
    .groupBy(tokenUsageTable.modelName, tokenUsageTable.provider);

  const t = totals[0];
  res.json({
    totalInputTokens: t?.totalInputTokens ?? 0,
    totalOutputTokens: t?.totalOutputTokens ?? 0,
    totalCost: t?.totalCost ?? 0,
    totalRequests: t?.totalRequests ?? 0,
    byProvider: byProviderRaw,
    byModel: byModelRaw,
  });
});

export default router;
