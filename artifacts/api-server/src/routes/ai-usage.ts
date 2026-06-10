import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { db, tokenUsageTable, aiModelsTable } from "@autoflow/db";

const router: IRouter = Router();

let seeded = false;
async function ensureUsage() {
  if (seeded) return;
  seeded = true;
  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(tokenUsageTable);
  if (count > 0) return;

  const models = await db.select().from(aiModelsTable).limit(6);
  if (models.length === 0) return;

  const now = Date.now();
  const records = [];
  for (let i = 0; i < 40; i++) {
    const model = models[i % models.length];
    const inputTokens = Math.floor(Math.random() * 2000) + 100;
    const outputTokens = Math.floor(Math.random() * 800) + 50;
    const cost = ((inputTokens * Number(model.inputCostPerToken)) + (outputTokens * Number(model.outputCostPerToken)));
    records.push({
      modelId: model.id, modelName: model.name, provider: model.provider,
      inputTokens, outputTokens, cost: String(cost.toFixed(6)),
      createdAt: new Date(now - (i * 3600000)),
    });
  }
  await db.insert(tokenUsageTable).values(records);
}

router.get("/ai/usage", async (req, res): Promise<void> => {
  await ensureUsage();
  const limit = Math.min(Number(req.query.limit ?? 50), 200);
  const rows = await db.select().from(tokenUsageTable).orderBy(tokenUsageTable.createdAt).limit(limit);
  res.json(rows.map((r) => ({
    id: r.id, modelId: r.modelId ?? null, modelName: r.modelName ?? null,
    provider: r.provider ?? null, promptId: r.promptId ?? null, workflowId: r.workflowId ?? null,
    inputTokens: r.inputTokens, outputTokens: r.outputTokens, cost: Number(r.cost),
    createdAt: r.createdAt.toISOString(),
  })));
});

router.get("/ai/usage/summary", async (_req, res): Promise<void> => {
  await ensureUsage();

  const totals = await db.select({
    totalInputTokens: sql<number>`sum(input_tokens)::int`,
    totalOutputTokens: sql<number>`sum(output_tokens)::int`,
    totalCost: sql<number>`sum(cost)::float`,
    totalRequests: sql<number>`count(*)::int`,
  }).from(tokenUsageTable);

  const byProviderRaw = await db.select({
    provider: tokenUsageTable.provider,
    inputTokens: sql<number>`sum(input_tokens)::int`,
    outputTokens: sql<number>`sum(output_tokens)::int`,
    cost: sql<number>`sum(cost)::float`,
    requests: sql<number>`count(*)::int`,
  }).from(tokenUsageTable).groupBy(tokenUsageTable.provider);

  const byModelRaw = await db.select({
    modelName: tokenUsageTable.modelName,
    provider: tokenUsageTable.provider,
    inputTokens: sql<number>`sum(input_tokens)::int`,
    outputTokens: sql<number>`sum(output_tokens)::int`,
    cost: sql<number>`sum(cost)::float`,
    requests: sql<number>`count(*)::int`,
  }).from(tokenUsageTable).groupBy(tokenUsageTable.modelName, tokenUsageTable.provider);

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
