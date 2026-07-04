/**
 * AI playground routes.
 *
 * Migrated from Drizzle to Prisma per ADR-013 Phase 3.
 * Uses `prisma.aiPlaygroundSession` delegate with `as any` casts for legacy columns.
 */

import { Router, type IRouter } from "express";
import { prisma } from "@longox/db/prisma";
import { aiRouter } from "../routing/ai-router";
import type { ChatMessage } from "../providers";
import { authorize } from "@longox/shared-rbac";

const router: IRouter = Router();

router.post("/ai/playground/run", authorize("ai:run"), async (req, res): Promise<void> => {
  const tenantId = req.tenantId;
  if (!tenantId) {
    res.status(400).json({ error: "Tenant context required" });
    return;
  }

  const {
    prompt,
    systemPrompt = "You are a helpful assistant.",
    modelId,
    provider,
    temperature = 0.7,
    maxTokens = 1024,
  } = req.body as {
    prompt: string;
    systemPrompt?: string;
    modelId?: string;
    provider?: string;
    temperature?: number;
    maxTokens?: number;
  };

  if (!prompt?.trim()) {
    res.status(400).json({ error: "prompt is required" });
    return;
  }

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: prompt },
  ];

  const startedAt = Date.now();

  try {
    const routingResult = await aiRouter.route(
      messages,
      { model: modelId, temperature, maxTokens },
      provider ? { providerPreferences: [provider as any] } : undefined,
    );

    const latencyMs = Date.now() - startedAt;

    const session = await prisma.aiPlaygroundSession.create({
      data: {
        tenantId,
        userId: req.user?.id,
        prompt: prompt.trim(),
        systemPrompt,
        modelId: routingResult.result.model,
        provider: routingResult.provider,
        response: routingResult.result.content,
        inputTokens: routingResult.result.inputTokens,
        outputTokens: routingResult.result.outputTokens,
        cost: String(routingResult.result.cost),
        latencyMs,
        temperature: String(temperature),
        maxTokens,
        status: "completed",
      } as any,
    });

    res.json({
      id: (session as any).id,
      provider: routingResult.provider,
      model: routingResult.result.model,
      response: routingResult.result.content,
      usage: {
        inputTokens: routingResult.result.inputTokens,
        outputTokens: routingResult.result.outputTokens,
        totalTokens:
          routingResult.result.inputTokens + routingResult.result.outputTokens,
      },
      cost: routingResult.result.cost,
      latencyMs,
      createdAt: (session as any).createdAt.toISOString(),
    });
  } catch (err) {
    const latencyMs = Date.now() - startedAt;
    const errorMessage = err instanceof Error ? err.message : String(err);

    await prisma.aiPlaygroundSession.create({
      data: {
        tenantId,
        userId: req.user?.id,
        prompt: prompt.trim(),
        systemPrompt,
        modelId: modelId ?? "unknown",
        provider: provider ?? "unknown",
        latencyMs,
        temperature: String(temperature),
        maxTokens,
        status: "failed",
        errorMessage,
      } as any,
    }).catch(() => {});

    res.status(500).json({ error: `AI run failed: ${errorMessage}` });
  }
});

router.post("/ai/playground/compare", authorize("ai:run"), async (req, res): Promise<void> => {
  const tenantId = req.tenantId;
  if (!tenantId) {
    res.status(400).json({ error: "Tenant context required" });
    return;
  }

  const {
    prompt,
    systemPrompt = "You are a helpful assistant.",
    models,
    temperature = 0.7,
    maxTokens = 1024,
  } = req.body as {
    prompt: string;
    systemPrompt?: string;
    models: Array<{ provider: string; modelId: string }>;
    temperature?: number;
    maxTokens?: number;
  };

  if (!prompt?.trim()) {
    res.status(400).json({ error: "prompt is required" });
    return;
  }

  if (!models || models.length === 0) {
    res.status(400).json({ error: "At least one model required" });
    return;
  }

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: prompt },
  ];

  const results = await Promise.allSettled(
    models.map(async (model) => {
      const startedAt = Date.now();
      try {
        const routingResult = await aiRouter.route(
          messages,
          { model: model.modelId, temperature, maxTokens },
          { providerPreferences: [model.provider as any] },
        );
        const latencyMs = Date.now() - startedAt;
        return {
          provider: routingResult.provider,
          model: routingResult.result.model,
          response: routingResult.result.content,
          inputTokens: routingResult.result.inputTokens,
          outputTokens: routingResult.result.outputTokens,
          cost: routingResult.result.cost,
          latencyMs,
          status: "success" as const,
        };
      } catch (err) {
        return {
          provider: model.provider,
          model: model.modelId,
          response: null,
          inputTokens: 0,
          outputTokens: 0,
          cost: 0,
          latencyMs: Date.now() - startedAt,
          status: "failed" as const,
          error: err instanceof Error ? err.message : String(err),
        };
      }
    }),
  );

  res.json({
    results: results.map((r) =>
      r.status === "fulfilled" ? r.value : { status: "failed", error: r.reason },
    ),
  });
});

router.get("/ai/playground/sessions", authorize("ai:read"), async (req, res): Promise<void> => {
  const tenantId = req.tenantId;
  if (!tenantId) {
    res.status(400).json({ error: "Tenant context required" });
    return;
  }

  const limit = Math.min(Number(req.query.limit ?? 20), 100);
  const rows = await prisma.aiPlaygroundSession.findMany({
    where: { tenantId } as any,
    orderBy: { createdAt: "desc" } as any,
    take: limit,
  });

  res.json(
    rows.map((r: any) => ({
      id: r.id,
      prompt: r.prompt,
      systemPrompt: r.systemPrompt,
      modelId: r.modelId,
      provider: r.provider,
      response: r.response,
      inputTokens: r.inputTokens,
      outputTokens: r.outputTokens,
      cost: Number(r.cost),
      latencyMs: r.latencyMs,
      temperature: Number(r.temperature),
      status: r.status,
      errorMessage: r.errorMessage,
      createdAt: r.createdAt.toISOString(),
    })),
  );
});

router.get("/ai/router/health", authorize("ai:read"), async (_req, res): Promise<void> => {
  res.json(aiRouter.getAllHealth());
});

export default router;
