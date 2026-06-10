import { Router, type IRouter } from "express";
import OpenAI from "openai";
import { db, tokenUsageTable, usageEventsTable } from "@autoflow/db";

const router: IRouter = Router();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface AiRunRequest {
  model?: string;
  systemPrompt?: string;
  userMessage: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: "text" | "json";
  workflowId?: number;
}

router.post("/ai/runs", async (req, res): Promise<void> => {
  if (!process.env.OPENAI_API_KEY) {
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
    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ];

    const completion = await openai.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      response_format: responseFormat === "json" ? { type: "json_object" } : undefined,
    });

    const durationMs = Date.now() - startedAt;
    const inputTokens = completion.usage?.prompt_tokens ?? 0;
    const outputTokens = completion.usage?.completion_tokens ?? 0;
    const content = completion.choices[0]?.message?.content ?? "";
    const finishReason = completion.choices[0]?.finish_reason ?? "stop";

    // Rough cost estimate (gpt-4o-mini pricing as default)
    const cost = inputTokens * 0.00000015 + outputTokens * 0.0000006;

    // Record token usage (non-fatal)
    try {
      await db.insert(tokenUsageTable).values({
        modelName: model,
        provider: "openai",
        workflowId: workflowId ?? null,
        inputTokens,
        outputTokens,
        cost: String(cost.toFixed(8)),
      });
    } catch { /* non-fatal */ }

    // Record usage metering event (non-fatal)
    try {
      await db.insert(usageEventsTable).values({
        workflowId: workflowId ?? null,
        eventType: "ai.run.completed",
        quantity: inputTokens + outputTokens,
        metadata: { model, inputTokens, outputTokens, durationMs, cost },
      });
    } catch { /* non-fatal */ }

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
      usage: { inputTokens, outputTokens, totalTokens: inputTokens + outputTokens },
      cost,
      durationMs,
      finishReason,
      createdAt: new Date(completion.created * 1000).toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: `AI run failed: ${message}` });
  }
});

// GET /api/ai/runs — list recent runs (from token_usage table as a proxy)
router.get("/ai/runs", async (req, res): Promise<void> => {
  const limit = Math.min(Number(req.query.limit ?? 20), 100);
  const rows = await db.select().from(tokenUsageTable)
    .orderBy(tokenUsageTable.createdAt)
    .limit(limit);

  res.json(rows.map((r) => ({
    id: r.id,
    modelName: r.modelName,
    provider: r.provider,
    workflowId: r.workflowId,
    inputTokens: r.inputTokens,
    outputTokens: r.outputTokens,
    cost: Number(r.cost),
    createdAt: r.createdAt.toISOString(),
  })));
});

export default router;
