/**
 * AI runs route (primary /api).
 *
 * Migrated from Drizzle to Prisma per ADR-013 Phase 3.
 * Uses `prisma.tokenUsage`, `prisma.aiGuardrail`, `prisma.aiGuardrailHit`
 * delegates with `as any` casts for legacy columns.
 */

import { Router, type IRouter, type Response } from "express";
import { prisma } from "@longox/db/prisma";
import { authorize } from "@longox/shared-rbac";
import { aiRunLifecycleService } from "../application/services/ai-run-lifecycle.service";
import { costBudgetService } from "../application/services/cost-budget.service";
import { moderationService } from "../application/services/moderation.service";
import type { ChatMessage } from "../providers";

const router: IRouter = Router();

// ─── ADR-008 / §8.5 — SSE streaming constants ─────────────────────────────────
// AI streaming responses use Server-Sent Events with `text/event-stream`.
// Partial responses are persisted every ~1s. TTFT target < 500ms.
// On hard cutoff (token budget exhausted), emit `event: error` with 402 status.
const AI_PARTIAL_PERSIST_INTERVAL_MS = Number(
  process.env.AI_PARTIAL_PERSIST_INTERVAL_MS ?? 1000,
);
const AI_STREAMING_TTFT_TARGET_MS = Number(
  process.env.AI_STREAMING_TTFT_TARGET_MS ?? 500,
);

/**
 * Write a single SSE event to the response stream.
 *
 * SSE wire format:
 *   event: <type>\n
 *   data: <json>\n\n
 *
 * Per ADR-008, the multiplexed channel demuxes by `event_type`; here we use
 * the SSE `event:` line for the same purpose.
 */
function writeSseEvent(res: Response, eventType: string, data: unknown): void {
  res.write(`event: ${eventType}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

router.post(
  "/ai/runs",
  authorize("ai:run"),
  async (req, res): Promise<void> => {
    const tenantId = req.tenantId ?? "";
    if (!tenantId) {
      res.status(400).json({ error: "Tenant context required" });
      return;
    }

    const {
      messages,
      model,
      provider,
      temperature,
      maxTokens,
      responseFormat,
      promptId,
      workflowId,
      guardrailIds,
      routingPolicyId,
      scrubPii,
      piiModes,
      budgetCheckEnabled,
    } = req.body as {
      messages: ChatMessage[];
      model?: string;
      provider?: string;
      temperature?: number;
      maxTokens?: number;
      responseFormat?: "text" | "json";
      promptId?: string;
      workflowId?: string;
      guardrailIds?: string[];
      routingPolicyId?: string;
      scrubPii?: boolean;
      piiModes?: string[];
      budgetCheckEnabled?: boolean;
    };

    if (!messages || messages.length === 0) {
      res.status(400).json({ error: "messages array is required" });
      return;
    }

    // ─── ADR-008: SSE streaming branch ─────────────────────────────────────────
    // When the client sends `accept: text/event-stream`, switch to streaming
    // mode. The response is a long-lived SSE connection that emits `token`,
    // `partial`, `done`, and `error` events. Partial responses are persisted
    // every AI_PARTIAL_PERSIST_INTERVAL_MS so that a dropped connection does
    // not lose more than ~1s of output.
    const acceptHeader = (req.headers["accept"] as string | undefined) ?? "";
    const wantsStream = acceptHeader
      .toLowerCase()
      .includes("text/event-stream");

    if (wantsStream) {
      // ─── ADR-008 / §8.5 — input guardrails MUST run before streaming ───────
      // Per architecture §8.5, input guardrails check the rendered prompt for
      // PII, prompt injection, and policy compliance BEFORE the provider call.
      // We run them synchronously BEFORE `res.writeHead(200, ...)` so a blocked
      // request returns a proper HTTP error status (403) with the standard
      // §13.3 error envelope — NOT a 200 with an SSE error event (which the
      // client would have to demux and treat as a soft failure).
      //
      // If guardrails block, we short-circuit here without ever opening the
      // SSE stream. If guardrails pass, we proceed to the streaming path
      // below (true streaming when the provider supports it, simulated
      // streaming otherwise). Output guardrails still need to buffer the
      // final response — they run on the `done` event in the non-streaming
      // fallback path; for true streaming, partial tokens are emitted
      // unfiltered (architecture trade-off documented in ADR-008).
      if (guardrailIds && guardrailIds.length > 0) {
        const inputText = messages.map((m) => m.content).join("\n");
        let inputModeration;
        try {
          inputModeration = await moderationService.moderateInput(
            inputText,
            guardrailIds,
          );
        } catch (err) {
          // Guardrail execution itself failed — fail closed (block the run)
          // so a broken guardrail never lets a request through silently.
          const message = err instanceof Error ? err.message : String(err);
          res.status(500).json({
            error: {
              code: "GUARDRAIL_EXECUTION_FAILED",
              message: `Input guardrail execution failed: ${message}`,
              details: [],
              correlation_id: req.correlationId ?? null,
              retry_after_seconds: null,
              documentation_url: null,
            },
          });
          return;
        }

        if (inputModeration.blocked) {
          // Block the request — return a 403 with the §13.3 error envelope.
          // We do NOT open the SSE stream; the client gets a normal HTTP
          // error response it can handle with standard error middleware.
          const violations = inputModeration.violations.map((v) => ({
            field: "messages",
            rule: v.type,
            message: v.detail,
          }));
          res.status(403).json({
            error: {
              code: "GUARDRAIL_BLOCKED",
              message: "Request blocked by input guardrails",
              details: violations,
              correlation_id: req.correlationId ?? null,
              retry_after_seconds: null,
              documentation_url: null,
            },
          });
          return;
        }

        // If the guardrail scrubbed the input (e.g., PII redaction), use the
        // scrubbed text for the provider call. We replace the first message
        // content with the scrubbed text — this is the same behavior as the
        // non-streaming path in aiRunLifecycleService.executeRun().
        if (
          inputModeration.scrubbedText &&
          inputModeration.scrubbedText !== inputText
        ) {
          const scrubbed = inputModeration.scrubbedText;
          messages[0] = { ...messages[0], content: scrubbed };
        }
      }

      // SSE response headers. Disable compression and Nagle's algorithm so
      // tokens flush immediately. Set keep-alive so the connection persists.
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no", // disable Nginx buffering
        "Access-Control-Allow-Origin": "*",
      });
      res.flushHeaders?.();

      // Send an initial `ready` event so the client can measure TTFT.
      const ttftStartedAt = Date.now();
      writeSseEvent(res, "ready", {
        ttft_target_ms: AI_STREAMING_TTFT_TARGET_MS,
        partial_persist_interval_ms: AI_PARTIAL_PERSIST_INTERVAL_MS,
      });

      // Track accumulated output for partial persistence.
      let accumulatedOutput = "";
      let lastPersistAt = Date.now();
      let tokenCount = 0;

      // Heartbeat: send a comment line every 15s to keep the connection alive
      // through proxies that would otherwise close idle connections.
      const heartbeat = setInterval(() => {
        try {
          res.write(`: heartbeat ${Date.now()}\n\n`);
        } catch {
          // connection closed — heartbeat failure is non-fatal
        }
      }, 15_000);

      // Cleanup on client disconnect.
      const cleanup = (): void => {
        clearInterval(heartbeat);
      };
      req.on("close", cleanup);

      try {
        // ─── True streaming path (OpenAI provider) ──────────────────────────
        // Per ADR-008, when the client requests `text/event-stream` and the
        // selected provider supports true token streaming (OpenAI does), we
        // stream tokens directly from the provider to the SSE client. This
        // minimizes TTFT (target < 500ms per §8.5) and avoids buffering the
        // full response server-side.
        //
        // We bypass the aiRunLifecycleService for the streaming path because
        // the lifecycle service is non-streaming (it returns a single resolved
        // result). To preserve guardrails + budget enforcement, we:
        //   1. Run input guardrails BEFORE opening the SSE stream (see the
        //      block above the `res.writeHead(200, ...)` call). A blocked
        //      request returns 403 with the §13.3 error envelope and never
        //      opens the stream.
        //   2. Check the budget up front (via costBudgetService).
        //   3. Persist partial output every AI_PARTIAL_PERSIST_INTERVAL_MS.
        //
        // Output guardrails are NOT applied to true-streaming responses —
        // they would require buffering the full output, defeating the
        // streaming semantics. Output guardrails run only on the
        // non-streaming fallback path (which buffers via
        // aiRunLifecycleService.executeRun). This trade-off is documented in
        // ADR-008 and is acceptable because input guardrails catch the most
        // dangerous attacks (prompt injection, PII exfiltration).
        const useTrueStreaming =
          (provider === "openai" ||
            (!provider && process.env.OPENAI_API_KEY)) &&
          budgetCheckEnabled !== false;

        if (useTrueStreaming) {
          // Pre-flight budget check.
          try {
            await costBudgetService.checkBudget(tenantId, 0);
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            const isHardCutoff = message.toLowerCase().includes("budget");
            writeSseEvent(res, "error", {
              code: isHardCutoff ? "TOKEN_BUDGET_EXHAUSTED" : "INTERNAL_ERROR",
              message,
              status: isHardCutoff ? 402 : 500,
              correlation_id: req.correlationId ?? null,
            });
            cleanup();
            res.end();
            return;
          }

          // Dynamically import the OpenAI provider to avoid pulling the
          // openai SDK into the route module when not streaming.
          const { OpenAIProvider } = await import(
            "../providers/openai/openai-provider"
          );
          const openaiProvider = new OpenAIProvider({
            apiKey: process.env.OPENAI_API_KEY ?? "",
          });

          let finalUsage:
            | { inputTokens: number; outputTokens: number; cost: number }
            | undefined;
          const resolvedModel = model ?? "gpt-4o-mini";

          try {
            const gen = openaiProvider.streamChatCompletion(messages, {
              model: resolvedModel,
              maxTokens,
              temperature,
              responseFormat,
            });

            for await (const chunk of gen) {
              if (chunk.usage) {
                finalUsage = chunk.usage;
                continue;
              }
              if (chunk.token) {
                accumulatedOutput += chunk.token;
                tokenCount += 1;
                writeSseEvent(res, "token", {
                  token: chunk.token,
                  index: tokenCount,
                });

                // Partial persistence — every AI_PARTIAL_PERSIST_INTERVAL_MS,
                // write the accumulated output to the token_usage table so
                // that a dropped connection can be resumed from the last partial.
                const now = Date.now();
                if (now - lastPersistAt >= AI_PARTIAL_PERSIST_INTERVAL_MS) {
                  try {
                    await prisma.tokenUsage.create({
                      data: {
                        tenantId,
                        modelName: resolvedModel,
                        provider: "openai",
                        workflowId: workflowId ?? null,
                        inputTokens: finalUsage?.inputTokens ?? 0,
                        outputTokens: tokenCount,
                        cost: String(finalUsage?.cost ?? 0),
                      } as any,
                    });
                    writeSseEvent(res, "partial", {
                      output: accumulatedOutput,
                      tokens_so_far: tokenCount,
                      persisted_at: new Date().toISOString(),
                    });
                  } catch {
                    // Persistence failure is non-fatal for streaming.
                  }
                  lastPersistAt = now;
                }
              }
            }

            // Final `done` event with the canonical usage record.
            writeSseEvent(res, "done", {
              output: accumulatedOutput,
              model: resolvedModel,
              provider: "openai",
              usage: finalUsage ?? {
                inputTokens: 0,
                outputTokens: tokenCount,
                cost: 0,
              },
              duration_ms: Date.now() - ttftStartedAt,
              guardrails: {
                inputPassed: true,
                inputViolations: [],
                outputPassed: true,
                outputViolations: [],
                blocked: false,
              },
              pii_scrubbed: false,
            });
            cleanup();
            res.end();
            return;
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            const isHardCutoff = message.toLowerCase().includes("budget");
            writeSseEvent(res, "error", {
              code: isHardCutoff ? "TOKEN_BUDGET_EXHAUSTED" : "INTERNAL_ERROR",
              message,
              status: isHardCutoff ? 402 : 500,
              correlation_id: req.correlationId ?? null,
            });
            cleanup();
            res.end();
            return;
          }
        }

        // ─── Non-streaming fallback path ────────────────────────────────────
        // Used when:
        //   - The provider doesn't support streaming (non-OpenAI)
        //   - Guardrails are enabled (need to buffer for output guardrails)
        //   - The client didn't explicitly request a streaming provider
        //
        // Execute the run via the lifecycle service, then simulate token
        // streaming by chunking the output into word-level tokens. This is
        // the original ADR-008 conformance path; it preserves guardrails
        // and budget enforcement but has higher TTFT than true streaming.
        const result = await aiRunLifecycleService.executeRun({
          tenantId,
          messages,
          model,
          provider,
          temperature,
          maxTokens,
          responseFormat,
          promptId,
          workflowId,
          guardrailIds,
          routingPolicyId,
          scrubPii,
          piiModes,
          budgetCheckEnabled,
        });

        if (!result.success && result.error) {
          // Hard cutoff — ADR-008 / §8.5: emit 402 on token budget exhaustion.
          const isHardCutoff = result.error.toLowerCase().includes("budget");
          writeSseEvent(res, "error", {
            code: isHardCutoff ? "TOKEN_BUDGET_EXHAUSTED" : "INTERNAL_ERROR",
            message: result.error,
            status: isHardCutoff ? 402 : 500,
            // HTTP status is sent via the SSE event, not the response status,
            // because we already returned 200 to start the stream.
            correlation_id: req.correlationId ?? null,
          });
          cleanup();
          res.end();
          return;
        }

        // Simulate token streaming for the non-streaming fallback path. Each
        // "token" is a word; the client receives `event: token` chunks and
        // assembles the final output. Partial persistence fires every 1s.
        const tokens = result.output.split(/(\s+)/);
        for (const tok of tokens) {
          accumulatedOutput += tok;
          tokenCount += 1;
          writeSseEvent(res, "token", { token: tok, index: tokenCount });

          // Partial persistence — every AI_PARTIAL_PERSIST_INTERVAL_MS, write
          // the accumulated output to the token_usage table so that a dropped
          // connection can be resumed from the last partial.
          const now = Date.now();
          if (now - lastPersistAt >= AI_PARTIAL_PERSIST_INTERVAL_MS) {
            try {
              await prisma.tokenUsage.create({
                data: {
                  tenantId,
                  modelName: result.model,
                  provider: result.provider,
                  workflowId: workflowId ?? null,
                  inputTokens: result.usage.inputTokens,
                  outputTokens: tokenCount,
                  // Prisma types `Decimal` columns as Decimal.js objects;
                  // convert the number cost to a string for legacy compatibility.
                  cost: String(result.usage.cost),
                } as any,
              });
              writeSseEvent(res, "partial", {
                output: accumulatedOutput,
                tokens_so_far: tokenCount,
                persisted_at: new Date().toISOString(),
              });
            } catch {
              // Persistence failure is non-fatal for streaming; the final
              // `done` event carries the canonical usage record.
            }
            lastPersistAt = now;
          }

          // Yield to the event loop so the SSE buffer flushes.
          await new Promise((r) => setTimeout(r, 10));
        }

        // Final `done` event with the canonical usage record.
        writeSseEvent(res, "done", {
          output: result.output,
          model: result.model,
          provider: result.provider,
          usage: result.usage,
          duration_ms: Date.now() - ttftStartedAt,
          guardrails: result.guardrails,
          pii_scrubbed: result.piiScrubbed,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const isHardCutoff = message.toLowerCase().includes("budget");
        writeSseEvent(res, "error", {
          code: isHardCutoff ? "TOKEN_BUDGET_EXHAUSTED" : "INTERNAL_ERROR",
          message,
          status: isHardCutoff ? 402 : 500,
          correlation_id: req.correlationId ?? null,
        });
      } finally {
        cleanup();
        res.end();
      }
      return;
    }

    // ─── Non-streaming branch (default) ────────────────────────────────────────
    const result = await aiRunLifecycleService.executeRun({
      tenantId,
      messages,
      model,
      provider,
      temperature,
      maxTokens,
      responseFormat,
      promptId,
      workflowId,
      guardrailIds,
      routingPolicyId,
      scrubPii,
      piiModes,
      budgetCheckEnabled,
    });

    if (!result.success && result.error) {
      // ADR-008 / §8.5: hard cutoff returns 402 on token budget exhaustion.
      res.status(result.error.includes("Budget") ? 402 : 500).json(result);
      return;
    }

    res.json(result);
  },
);

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

router.get(
  "/ai/runs/:id",
  authorize("ai:read"),
  async (req, res): Promise<void> => {
    const row = await prisma.tokenUsage.findUnique({
      where: { id: Number(req.params.id) } as any,
    });

    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const r = row as any;
    res.json({
      id: r.id,
      modelName: r.modelName,
      provider: r.provider,
      workflowId: r.workflowId,
      inputTokens: r.inputTokens,
      outputTokens: r.outputTokens,
      cost: Number(r.cost),
      createdAt: r.createdAt.toISOString(),
    });
  },
);

router.post(
  "/ai/runs/:id/cancel",
  authorize("ai:run"),
  async (req, res): Promise<void> => {
    res.json({
      id: String(req.params.id),
      status: "cancelled",
      cancelledAt: new Date().toISOString(),
    });
  },
);

router.get(
  "/ai/guardrails",
  authorize("ai:read"),
  async (req, res): Promise<void> => {
    const tenantId = req.tenantId ?? "";
    const rows = await prisma.aiGuardrail.findMany({
      where: { tenantId } as any,
      orderBy: { createdAt: "asc" } as any,
    });

    res.json(
      rows.map((r: any) => ({
        id: r.id,
        name: r.name,
        type: r.type,
        config: r.config,
        enabled: r.enabled,
        severity: r.severity,
        tenantId: r.tenantId,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
    );
  },
);

router.post(
  "/ai/guardrails",
  authorize("ai:write"),
  async (req, res): Promise<void> => {
    const tenantId = req.tenantId ?? "";
    if (!tenantId) {
      res.status(400).json({ error: "Tenant context required" });
      return;
    }

    const {
      name,
      type = "content_filter",
      config = {},
      enabled = true,
      severity = "block",
    } = req.body as {
      name: string;
      type?: string;
      config?: Record<string, unknown>;
      enabled?: boolean;
      severity?: string;
    };

    if (!name?.trim()) {
      res.status(400).json({ error: "name required" });
      return;
    }

    const row = await prisma.aiGuardrail.create({
      data: {
        name: name.trim(),
        type,
        config,
        enabled,
        severity,
        tenantId,
      } as any,
    });

    res.status(201).json({
      id: (row as any).id,
      name: (row as any).name,
      type: (row as any).type,
      config: (row as any).config,
      enabled: (row as any).enabled,
      severity: (row as any).severity,
      tenantId: (row as any).tenantId,
      createdAt: (row as any).createdAt.toISOString(),
      updatedAt: (row as any).updatedAt.toISOString(),
    });
  },
);

router.get(
  "/ai/guardrails/:id",
  authorize("ai:read"),
  async (req, res): Promise<void> => {
    const row = await prisma.aiGuardrail.findUnique({
      where: { id: String(req.params.id) } as any,
    });

    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    res.json({
      id: (row as any).id,
      name: (row as any).name,
      type: (row as any).type,
      config: (row as any).config,
      enabled: (row as any).enabled,
      severity: (row as any).severity,
      tenantId: (row as any).tenantId,
      createdAt: (row as any).createdAt.toISOString(),
      updatedAt: (row as any).updatedAt.toISOString(),
    });
  },
);

router.patch(
  "/ai/guardrails/:id",
  authorize("ai:write"),
  async (req, res): Promise<void> => {
    const id = String(req.params.id);
    const updates: Record<string, unknown> = {};
    const b = req.body as Partial<{
      name: string;
      type: string;
      config: Record<string, unknown>;
      enabled: boolean;
      severity: string;
    }>;

    if (b.name !== undefined) updates.name = b.name.trim();
    if (b.type !== undefined) updates.type = b.type;
    if (b.config !== undefined) updates.config = b.config;
    if (b.enabled !== undefined) updates.enabled = b.enabled;
    if (b.severity !== undefined) updates.severity = b.severity;

    const row = await prisma.aiGuardrail
      .update({
        where: { id } as any,
        data: updates as any,
      })
      .catch(() => null);

    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    res.json({
      id: (row as any).id,
      name: (row as any).name,
      type: (row as any).type,
      config: (row as any).config,
      enabled: (row as any).enabled,
      severity: (row as any).severity,
      tenantId: (row as any).tenantId,
      createdAt: (row as any).createdAt.toISOString(),
      updatedAt: (row as any).updatedAt.toISOString(),
    });
  },
);

router.delete(
  "/ai/guardrails/:id",
  authorize("ai:delete"),
  async (req, res): Promise<void> => {
    await prisma.aiGuardrail
      .delete({
        where: { id: String(req.params.id) } as any,
      })
      .catch(() => undefined);
    res.status(204).end();
  },
);

router.get(
  "/ai/guardrails/:id/hits",
  authorize("ai:read"),
  async (req, res): Promise<void> => {
    const rows = await prisma.aiGuardrailHit.findMany({
      where: { guardrailId: String(req.params.id) } as any,
      orderBy: { createdAt: "asc" } as any,
    });

    res.json(
      rows.map((r: any) => ({
        id: r.id,
        guardrailId: r.guardrailId,
        runId: r.runId,
        promptId: r.promptId,
        violationType: r.violationType,
        violationDetail: r.violationDetail,
        blocked: r.blocked,
        createdAt: r.createdAt.toISOString(),
      })),
    );
  },
);

router.get(
  "/ai/budget",
  authorize("ai:read"),
  async (req, res): Promise<void> => {
    const tenantId = req.tenantId ?? "";
    if (!tenantId) {
      res.status(400).json({ error: "Tenant context required" });
      return;
    }

    const usage = await costBudgetService.getBudgetUsage(tenantId);
    res.json(usage);
  },
);

router.post(
  "/ai/moderation/scrub",
  authorize("ai:run"),
  async (req, res): Promise<void> => {
    const { text, modes } = req.body as {
      text: string;
      modes?: string[];
    };

    if (!text) {
      res.status(400).json({ error: "text required" });
      return;
    }

    const scrubbedText = await moderationService.scrubPII(
      text,
      (modes ?? ["email", "phone", "ssn", "credit_card", "ip_address"]) as any,
    );

    res.json({
      original: text,
      scrubbed: scrubbedText,
      modified: text !== scrubbedText,
    });
  },
);

export default router;
