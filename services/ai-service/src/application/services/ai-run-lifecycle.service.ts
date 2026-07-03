import {
  db,
  aiRoutingPoliciesTable,
  aiGuardrailsTable,
  aiGuardrailHitsTable,
  tokenUsageTable,
} from "@longox/db";
import { eq, and } from "drizzle-orm";
import { aiRouter } from "../../routing/ai-router";
import type { ChatMessage } from "../../providers";
import { CostBudgetService, BudgetExceededError } from "./cost-budget.service";
import { ModerationService } from "./moderation.service";
import { TokenAccountingService } from "./token-accounting.service";
import { AiAuditService } from "./ai-audit.service";

export interface AiRunInput {
  tenantId: number;
  messages: ChatMessage[];
  model?: string;
  provider?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: "text" | "json";
  promptId?: number;
  workflowId?: number;
  guardrailIds?: number[];
  routingPolicyId?: number;
  scrubPii?: boolean;
  piiModes?: string[];
  budgetCheckEnabled?: boolean;
}

export interface AiRunResult {
  success: boolean;
  output: string;
  model: string;
  provider: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    cost: number;
  };
  durationMs: number;
  guardrails: {
    inputPassed: boolean;
    inputViolations: Array<{ type: string; detail: string; severity: string }>;
    outputPassed: boolean;
    outputViolations: Array<{ type: string; detail: string; severity: string }>;
    blocked: boolean;
  };
  piiScrubbed: boolean;
  auditEvents: string[];
  error?: string;
}

export class AiRunLifecycleService {
  private costBudget = new CostBudgetService();
  private moderation = new ModerationService();
  private tokenAccounting = new TokenAccountingService();
  private audit = new AiAuditService();

  async executeRun(input: AiRunInput): Promise<AiRunResult> {
    const startedAt = Date.now();
    const auditEvents: string[] = [];
    const guardrailResult = {
      inputPassed: true,
      inputViolations: [] as Array<{
        type: string;
        detail: string;
        severity: string;
      }>,
      outputPassed: true,
      outputViolations: [] as Array<{
        type: string;
        detail: string;
        severity: string;
      }>,
      blocked: false,
    };

    const inputText = input.messages.map((m) => m.content).join("\n");

    try {
      await this.audit.record("ai.run.started", {
        provider: input.provider,
        model: input.model,
      });

      // Step 1: Check budget
      if (input.budgetCheckEnabled !== false) {
        try {
          await this.costBudget.checkBudget(input.tenantId, 0);
        } catch (err) {
          if (err instanceof BudgetExceededError) {
            await this.audit.record("ai.budget.exceeded", {
              budgetId: err.budgetId,
              budgetName: err.budgetName,
              error: err.message,
            });
            auditEvents.push("ai.budget.exceeded");
            throw err;
          }
          throw err;
        }
      }

      // Step 2: Input guardrails & moderation
      // `inputModeration` is hoisted out of the `if` block so it can be
      // referenced later when constructing effective messages. It is
      // `undefined` when no guardrails are configured.
      let inputModeration:
        | {
            passed: boolean;
            scrubbedText?: string;
            violations: Array<{
              type: string;
              detail: string;
              severity: string;
            }>;
            blocked: boolean;
          }
        | undefined;
      if (input.guardrailIds && input.guardrailIds.length > 0) {
        inputModeration = await this.moderation.moderateInput(
          inputText,
          input.guardrailIds,
        );
        guardrailResult.inputPassed = inputModeration.passed;
        guardrailResult.inputViolations = inputModeration.violations.map(
          (v) => ({
            type: v.type,
            detail: v.detail,
            severity: v.severity,
          }),
        );
        guardrailResult.blocked = inputModeration.blocked;

        if (guardrailResult.blocked) {
          await this.audit.record("ai.run.blocked", {
            blocked: true,
            guardrailName:
              guardrailResult.inputViolations[0]?.type ?? "unknown",
            violationType:
              guardrailResult.inputViolations[0]?.detail ?? "unknown",
          });
          auditEvents.push("ai.run.blocked");

          for (const v of guardrailResult.inputViolations) {
            try {
              await db.insert(aiGuardrailHitsTable).values({
                guardrailId: input.guardrailIds[0],
                violationType: v.type,
                violationDetail: v.detail,
                blocked: true,
              } as any);
            } catch {
              // non-fatal
            }
          }

          await this.tokenAccounting.recordUsage({
            modelName: input.model ?? "unknown",
            provider: input.provider ?? "unknown",
            inputTokens: 0,
            outputTokens: 0,
            cost: 0,
            tenantId: input.tenantId,
            workflowId: input.workflowId,
            promptId: input.promptId,
          });

          return {
            success: false,
            output: "Request blocked by guardrails",
            model: input.model ?? "unknown",
            provider: input.provider ?? "unknown",
            usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0, cost: 0 },
            durationMs: Date.now() - startedAt,
            guardrails: guardrailResult,
            piiScrubbed: false,
            auditEvents,
          };
        }
      }

      // Step 3: Route to provider
      const effectiveMessages = inputModeration?.scrubbedText
        ? input.messages.map((m) => ({
            ...m,
            content:
              m.content === inputText
                ? (inputModeration.scrubbedText ?? m.content)
                : m.content,
          }))
        : input.messages;

      let resolvedProvider = input.provider;
      let resolvedModel = input.model;

      if (input.routingPolicyId) {
        const [policy] = await db
          .select()
          .from(aiRoutingPoliciesTable)
          .where(
            and(
              eq(aiRoutingPoliciesTable.id, input.routingPolicyId),
              eq(aiRoutingPoliciesTable.isEnabled, true),
            ),
          );

        if (policy) {
          const routingResult = await aiRouter.route(
            effectiveMessages,
            {
              model: resolvedModel,
              temperature: input.temperature,
              maxTokens: input.maxTokens,
              responseFormat: input.responseFormat,
            },
            {
              strategy: policy.strategy as any,
              providerPreferences: (policy.providerPreferences ?? []) as any,
              // Drizzle types jsonb columns as `unknown` (defaults to `{}`);
              // cast to `string[] | undefined` to match the route options shape.
              modelAllowlist:
                (policy.modelAllowlist as string[] | null | undefined) ??
                undefined,
              modelDenylist:
                (policy.modelDenylist as string[] | null | undefined) ??
                undefined,
              fallbackEnabled: policy.fallbackEnabled,
              maxRetries: policy.maxRetries,
            },
          );

          resolvedProvider = routingResult.provider;
          resolvedModel = routingResult.result.model;
        }
      }

      // Step 4: Execute with AI router
      const routeResult = await aiRouter.route(
        effectiveMessages,
        {
          model: resolvedModel,
          temperature: input.temperature,
          maxTokens: input.maxTokens,
          responseFormat: input.responseFormat,
        },
        input.provider
          ? {
              providerPreferences: [input.provider as any],
            }
          : undefined,
      );

      resolvedProvider = routeResult.provider;
      resolvedModel = routeResult.result.model;

      const outputText = routeResult.result.content;
      const inputTokens = routeResult.result.inputTokens;
      const outputTokens = routeResult.result.outputTokens;
      const cost = routeResult.result.cost;

      // Step 5: Output guardrails & moderation
      let finalOutput = outputText;
      if (input.guardrailIds && input.guardrailIds.length > 0) {
        const outputModeration = await this.moderation.moderateOutput(
          finalOutput,
          input.guardrailIds,
        );
        guardrailResult.outputPassed = outputModeration.passed;
        guardrailResult.outputViolations = outputModeration.violations.map(
          (v) => ({
            type: v.type,
            detail: v.detail,
            severity: v.severity,
          }),
        );

        if (outputModeration.blocked) {
          guardrailResult.blocked = true;
          finalOutput = "Output blocked by guardrails";

          await this.audit.record("ai.run.blocked", {
            blocked: true,
            guardrailName:
              guardrailResult.outputViolations[0]?.type ?? "unknown",
            violationType:
              guardrailResult.outputViolations[0]?.detail ?? "unknown",
          });
          auditEvents.push("ai.run.blocked");
        } else {
          finalOutput = outputModeration.scrubbedText;
        }
      }

      // Step 6: Scrub PII
      let piiScrubbed = false;
      if (
        input.scrubPii !== false &&
        input.piiModes &&
        input.piiModes.length > 0
      ) {
        const scrubbed = await this.moderation.scrubPII(
          finalOutput,
          input.piiModes as any,
        );
        if (scrubbed !== finalOutput) {
          piiScrubbed = true;
          finalOutput = scrubbed;
        }
      }

      // Step 7: Record usage
      await this.tokenAccounting.recordUsage({
        modelName: resolvedModel,
        provider: resolvedProvider,
        inputTokens,
        outputTokens,
        cost,
        tenantId: input.tenantId,
        workflowId: input.workflowId,
        promptId: input.promptId,
      });

      await this.tokenAccounting.updateRollups(
        input.tenantId,
        "monthly",
        "ai_tokens",
        inputTokens + outputTokens,
        cost,
      );

      // Step 8: Record audit events
      await this.audit.record("ai.run.completed", {
        provider: resolvedProvider,
        model: resolvedModel,
        inputTokens,
        outputTokens,
        cost,
        durationMs: Date.now() - startedAt,
        blocked: guardrailResult.blocked,
      });
      auditEvents.push("ai.run.completed");

      return {
        success: true,
        output: finalOutput,
        model: resolvedModel,
        provider: resolvedProvider,
        usage: {
          inputTokens,
          outputTokens,
          totalTokens: inputTokens + outputTokens,
          cost,
        },
        durationMs: Date.now() - startedAt,
        guardrails: guardrailResult,
        piiScrubbed,
        auditEvents,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);

      await this.audit.record("ai.run.blocked", {
        error: errorMessage,
        blocked: true,
      });
      auditEvents.push("ai.run.blocked");

      return {
        success: false,
        output: "",
        model: input.model ?? "unknown",
        provider: input.provider ?? "unknown",
        usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0, cost: 0 },
        durationMs: Date.now() - startedAt,
        guardrails: guardrailResult,
        piiScrubbed: false,
        auditEvents,
        error: errorMessage,
      };
    }
  }
}

export const aiRunLifecycleService = new AiRunLifecycleService();
