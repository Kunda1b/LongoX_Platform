/**
 * Moderation service.
 *
 * Migrated from Drizzle to Prisma per ADR-013 Phase 3.
 * Uses `prisma.aiGuardrail` and `prisma.aiGuardrailHit` delegates with
 * `as any` casts for legacy columns.
 */

import { prisma } from "@longox/db/prisma";

export interface ModerationViolation {
  guardrailId?: string;
  guardrailName?: string;
  type: string;
  detail: string;
  severity: "block" | "warn" | "log";
}

export interface ModerationResult {
  passed: boolean;
  violations: ModerationViolation[];
  scrubbedText: string;
  blocked: boolean;
}

export type PiiMode = "email" | "phone" | "ssn" | "credit_card" | "ip_address" | "custom_regex";

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
const SSN_REGEX = /\b\d{3}-\d{2}-\d{4}\b/g;
const CREDIT_CARD_REGEX = /\b(?:\d{4}[-\s]?){3}\d{4}\b/g;
const IP_ADDRESS_REGEX = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g;

export class ModerationService {
  async moderateInput(
    text: string,
    guardrailIds: string[] = [],
  ): Promise<ModerationResult> {
    const guardrails = await this.loadGuardrails(guardrailIds);
    const violations: ModerationViolation[] = [];
    let scrubbedText = text;

    for (const guardrail of guardrails) {
      const result = await this.applyGuardrail(guardrail, scrubbedText);
      if (result.violations.length > 0) {
        violations.push(...result.violations);
        scrubbedText = result.scrubbedText;
      }
    }

    const blocked = violations.some((v) => v.severity === "block");

    return {
      passed: violations.length === 0 || !blocked,
      violations,
      scrubbedText,
      blocked,
    };
  }

  async moderateOutput(
    text: string,
    guardrailIds: string[] = [],
  ): Promise<ModerationResult> {
    return this.moderateInput(text, guardrailIds);
  }

  async scrubPII(
    text: string,
    modes: PiiMode[] = ["email", "phone", "ssn", "credit_card", "ip_address"],
    replacement = "[REDACTED]",
  ): Promise<string> {
    let scrubbed = text;

    if (modes.includes("email")) {
      scrubbed = scrubbed.replace(EMAIL_REGEX, replacement);
    }
    if (modes.includes("phone")) {
      scrubbed = scrubbed.replace(PHONE_REGEX, replacement);
    }
    if (modes.includes("ssn")) {
      scrubbed = scrubbed.replace(SSN_REGEX, replacement);
    }
    if (modes.includes("credit_card")) {
      scrubbed = scrubbed.replace(CREDIT_CARD_REGEX, replacement);
    }
    if (modes.includes("ip_address")) {
      scrubbed = scrubbed.replace(IP_ADDRESS_REGEX, replacement);
    }

    return scrubbed;
  }

  private async loadGuardrails(guardrailIds: string[]) {
    if (guardrailIds.length === 0) return [];

    const guardrails = await prisma.aiGuardrail.findMany({
      where: {
        enabled: true,
        id: { in: guardrailIds },
      } as any,
    });

    return guardrails;
  }

  private async applyGuardrail(
    guardrail: any,
    text: string,
  ): Promise<{ violations: ModerationViolation[]; scrubbedText: string }> {
    const violations: ModerationViolation[] = [];
    let scrubbedText = text;

    switch (guardrail.type) {
      case "keyword": {
        const keywords: string[] = (guardrail.config as any)?.keywords ?? [];
        for (const keyword of keywords) {
          if (text.toLowerCase().includes(keyword.toLowerCase())) {
            violations.push({
              guardrailId: guardrail.id,
              guardrailName: guardrail.name,
              type: "keyword",
              detail: `Matched keyword: ${keyword}`,
              severity: guardrail.severity as "block" | "warn" | "log",
            });
            scrubbedText = scrubbedText.replace(
              new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"),
              "[FILTERED]",
            );
          }
        }
        break;
      }

      case "regex": {
        const patterns: string[] = (guardrail.config as any)?.patterns ?? [];
        for (const pattern of patterns) {
          try {
            const regex = new RegExp(pattern, "gi");
            if (regex.test(text)) {
              const matches = text.match(regex);
              violations.push({
                guardrailId: guardrail.id,
                guardrailName: guardrail.name,
                type: "regex",
                detail: `Matched pattern: ${pattern}${matches ? ` (${matches.length} hits)` : ""}`,
                severity: guardrail.severity as "block" | "warn" | "log",
              });
              scrubbedText = scrubbedText.replace(regex, "[FILTERED]");
            }
          } catch {
            // invalid regex, skip
          }
        }
        break;
      }

      case "pii": {
        const piiModes: PiiMode[] = (guardrail.config as any)?.piiModes ?? [
          "email", "phone", "ssn", "credit_card", "ip_address",
        ];
        scrubbedText = await this.scrubPII(text, piiModes);
        if (scrubbedText !== text) {
          violations.push({
            guardrailId: guardrail.id,
            guardrailName: guardrail.name,
            type: "pii",
            detail: "PII detected and scrubbed",
            severity: guardrail.severity as "block" | "warn" | "log",
          });
        }
        break;
      }

      case "content_filter": {
        const blockedCategories: string[] = (guardrail.config as any)?.blockedCategories ?? [
          "hate", "violence", "self-harm", "sexual",
        ];
        for (const category of blockedCategories) {
          if (text.toLowerCase().includes(category)) {
            violations.push({
              guardrailId: guardrail.id,
              guardrailName: guardrail.name,
              type: "content_filter",
              detail: `Content matched blocked category: ${category}`,
              severity: guardrail.severity as "block" | "warn" | "log",
            });
          }
        }
        break;
      }

      case "moderation": {
        const openaiThreshold = (guardrail.config as any)?.threshold ?? 0.5;
        try {
          const { moderationService } = await import("../../moderation/moderation-service");
          const result = await moderationService.moderateContent(text, {
            hate: openaiThreshold,
            "hate/threatening": openaiThreshold,
            "self-harm": openaiThreshold,
            sexual: openaiThreshold,
            "sexual/minors": openaiThreshold * 0.6,
            violence: openaiThreshold,
            "violence/graphic": openaiThreshold,
          });

          if (!result.passed) {
            violations.push({
              guardrailId: guardrail.id,
              guardrailName: guardrail.name,
              type: "moderation",
              detail: `OpenAI moderation flagged: ${result.reasons.join(", ")}`,
              severity: guardrail.severity as "block" | "warn" | "log",
            });
          }
        } catch {
          // moderation service unavailable, skip
        }
        break;
      }

      case "custom": {
        const customFn: string = (guardrail.config as any)?.customFn ?? "";
        if (customFn) {
          try {
            const fn = new Function("text", customFn);
            const customResult = fn(text);
            if (customResult?.violation) {
              violations.push({
                guardrailId: guardrail.id,
                guardrailName: guardrail.name,
                type: "custom",
                detail: customResult.detail ?? "Custom guardrail triggered",
                severity: guardrail.severity as "block" | "warn" | "log",
              });
            }
          } catch {
            // custom function error, skip
          }
        }
        break;
      }
    }

    return { violations, scrubbedText };
  }
}

export const moderationService = new ModerationService();
