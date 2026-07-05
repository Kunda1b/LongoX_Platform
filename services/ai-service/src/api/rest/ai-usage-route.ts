/**
 * AI usage REST routes.
 *
 * Migrated from Drizzle to Prisma per ADR-013 Phase 3.
 * Uses `prisma.tokenUsage` delegate with `as any` casts for legacy columns,
 * and `prisma.$queryRaw` for aggregate rollups.
 */

import { Router, type IRouter } from "express";
import { prisma } from "@longox/db/prisma";
import { authorize } from "@longox/shared-rbac";

const router: IRouter = Router();

router.get(
  "/ai/usage",
  authorize("ai:read"),
  async (req, res): Promise<void> => {
    const limit = Math.min(Number(req.query.limit ?? 50), 200);
    const rows = await prisma.tokenUsage.findMany({
      orderBy: { createdAt: "asc" } as any,
      take: limit,
    });
    res.json(
      rows.map((r: any) => ({
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
  },
);

router.get(
  "/ai/usage/summary",
  authorize("ai:read"),
  async (_req, res): Promise<void> => {
    const totals = (await prisma.$queryRawUnsafe(
      `SELECT
       coalesce(sum(input_tokens), 0)::int AS "totalInputTokens",
       coalesce(sum(output_tokens), 0)::int AS "totalOutputTokens",
       coalesce(sum(cost), 0)::float AS "totalCost",
       count(*)::int AS "totalRequests"
     FROM token_usage`,
    )) as any[];

    const byProviderRaw = (await prisma.$queryRawUnsafe(
      `SELECT
       provider,
       sum(input_tokens)::int AS "inputTokens",
       sum(output_tokens)::int AS "outputTokens",
       sum(cost)::float AS cost,
       count(*)::int AS requests
     FROM token_usage
     GROUP BY provider`,
    )) as any[];

    const byModelRaw = (await prisma.$queryRawUnsafe(
      `SELECT
       model_name AS "modelName",
       provider,
       sum(input_tokens)::int AS "inputTokens",
       sum(output_tokens)::int AS "outputTokens",
       sum(cost)::float AS cost,
       count(*)::int AS requests
     FROM token_usage
     GROUP BY model_name, provider`,
    )) as any[];

    const t = totals[0];
    res.json({
      totalInputTokens: t?.totalInputTokens ?? 0,
      totalOutputTokens: t?.totalOutputTokens ?? 0,
      totalCost: t?.totalCost ?? 0,
      totalRequests: t?.totalRequests ?? 0,
      byProvider: byProviderRaw,
      byModel: byModelRaw,
    });
  },
);

export default router;
