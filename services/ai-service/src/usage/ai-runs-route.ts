/**
 * AI runs route (legacy /usage path).
 *
 * Migrated from Drizzle to Prisma per ADR-013 Phase 3.
 * Uses `prisma.tokenUsage` and `prisma.usageEvent` delegates with `as any`
 * casts for legacy columns.
 */

import { Router, type IRouter } from "express";
import OpenAI from "openai";
import { prisma } from "@longox/db/prisma";
import { withSpan, addSpanAttributes } from "@longox/shared-observability";
import { recordAiRequest, recordAiRequestFailed } from "../telemetry/metrics";
import { authorize } from "@longox/shared-rbac";

const router: IRouter = Router();

let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openai)
    _openai = new OpenAI({
      apiKey:
        process.env.AI_INTEGRATIONS_OPENAI_API_KEY ??
        process.env.OPENAI_API_KEY ??
        "",
    });
  return _openai;
}

interface AiRunRequest {
  model?: string;
  systemPrompt?: string;
  userMessage: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: "text" | "json";
  workflowId?: string;
}

router.post(
  "/ai/runs",
  authorize("ai:run"),
  async (req, res): Promise<void> => {
    if (
      !process.env.AI_INTEGRATIONS_OPENAI_API_KEY &&
      !process.env.OPENAI_API_KEY
    ) {
      res.status(503).json({ error: "OpenAI API key not configured" });
      return;
    }

    const {
      model = "gpt-4o-mini",
      systemPrompt = "You are a helpful assistant.",
      userMessage,
      temperature = 0.7,
      maxTokens = 1024,
      responseFormat = "text",
      workflowId,
    } = req.body as AiRunRequest;

    if (!userMessage?.trim()) {
      res.status(400).json({ error: "userMessage is required" });
      return;
    }

    const startedAt = Date.now();

    try {
      const completion = await withSpan("ai.openai.chat", async (span) => {
        span.setAttributes({
          "ai.provider": "openai",
          "ai.model": model,
          "ai.max_tokens": maxTokens,
          "ai.temperature": temperature,
        });

        const messages: OpenAI.ChatCompletionMessageParam[] = [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ];

        const result = await getOpenAI().chat.completions.create({
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
          response_format:
            responseFormat === "json" ? { type: "json_object" } : undefined,
        });

        span.setAttributes({
          "ai.input_tokens": result.usage?.prompt_tokens ?? 0,
          "ai.output_tokens": result.usage?.completion_tokens ?? 0,
          "ai.finish_reason": result.choices[0]?.finish_reason ?? "unknown",
        });

        return result;
      });

      const durationMs = Date.now() - startedAt;
      const inputTokens = completion.usage?.prompt_tokens ?? 0;
      const outputTokens = completion.usage?.completion_tokens ?? 0;
      const content = completion.choices[0]?.message?.content ?? "";
      const finishReason = completion.choices[0]?.finish_reason ?? "stop";

      // Record metrics
      recordAiRequest("openai", model, durationMs, inputTokens, outputTokens);

      // Rough cost estimate (gpt-4o-mini pricing as default)
      const cost = inputTokens * 0.00000015 + outputTokens * 0.0000006;

      // Record token usage (non-fatal)
      try {
        await prisma.tokenUsage.create({
          data: {
            modelName: model,
            provider: "openai",
            workflowId: workflowId ?? null,
            inputTokens,
            outputTokens,
            cost: String(cost.toFixed(8)),
          } as any,
        });
      } catch {
        /* non-fatal */
      }

      // Record usage metering event (non-fatal)
      try {
        await prisma.usageEvent.create({
          data: {
            workflowId: workflowId ?? null,
            eventType: "ai.run.completed",
            quantity: inputTokens + outputTokens,
            metadata: { model, inputTokens, outputTokens, durationMs, cost },
          } as any,
        });
      } catch {
        /* non-fatal */
      }

      let parsedOutput: unknown = content;
      if (responseFormat === "json") {
        try {
          parsedOutput = JSON.parse(content);
        } catch {
          parsedOutput = { raw: content };
        }
      }

      res.json({
        id: completion.id,
        model: completion.model,
        output: parsedOutput,
        usage: {
          inputTokens,
          outputTokens,
          totalTokens: inputTokens + outputTokens,
        },
        cost,
        durationMs,
        finishReason,
        createdAt: new Date(completion.created * 1000).toISOString(),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      recordAiRequestFailed(
        "openai",
        err instanceof Error ? err.constructor.name : "unknown",
      );
      addSpanAttributes({
        "error.type": err instanceof Error ? err.constructor.name : "unknown",
        "error.message": message,
      });
      res.status(500).json({ error: `AI run failed: ${message}` });
    }
  },
);

// GET /api/ai/runs — list recent runs (from token_usage table as a proxy)
router.get(
  "/ai/runs",
  authorize("ai:read"),
  async (req, res): Promise<void> => {
    const limit = Math.min(Number(req.query.limit ?? 20), 100);
    const rows = await prisma.tokenUsage.findMany({
      orderBy: { createdAt: "asc" } as any,
      take: limit,
    });

    res.json(
      rows.map((r: any) => ({
        id: r.id,
        modelName: r.modelName,
        provider: r.provider,
        workflowId: r.workflowId,
        inputTokens: r.inputTokens,
        outputTokens: r.outputTokens,
        cost: Number(r.cost),
        createdAt: r.createdAt.toISOString(),
      })),
    );
  },
);

export default router;
