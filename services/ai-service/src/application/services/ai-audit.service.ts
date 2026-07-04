/**
 * AI audit service.
 *
 * Migrated from Drizzle to Prisma per ADR-013 Phase 3.
 * Uses `prisma.auditLog` delegate with `as any` casts for legacy columns.
 */

import { prisma } from "@longox/db/prisma";

export type AiAuditEventType =
  | "ai.run.guardrail.violation"
  | "ai.run.started"
  | "ai.run.completed"
  | "ai.run.blocked"
  | "ai.prompt.created"
  | "ai.prompt.promoted"
  | "ai.budget.exceeded"
  | "ai.guardrail.hit"
  | "ai.evaluation.passed"
  | "ai.evaluation.failed";

export interface AiAuditDetail {
  runId?: string;
  promptId?: string;
  version?: number;
  provider?: string;
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
  cost?: number;
  guardrailId?: string;
  guardrailName?: string;
  violationType?: string;
  stage?: string;
  severity?: string;
  detail?: string;
  budgetId?: string;
  budgetName?: string;
  evaluationScore?: number;
  evaluationDiff?: number;
  error?: string;
  blocked?: boolean;
  durationMs?: number;
}

export class AiAuditService {
  async record(
    eventType: AiAuditEventType,
    detail: AiAuditDetail,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          actorType: "system",
          actorId: detail.runId ? String(detail.runId) : null,
          action: eventType,
          resourceType: "ai",
          resourceId: detail.runId
            ? String(detail.runId)
            : detail.promptId
              ? String(detail.promptId)
              : "unknown",
          metadata: {
            ...detail,
            ...(metadata ?? {}),
          },
        } as any,
      });
    } catch {
      // non-fatal audit logging
    }
  }
}

export const aiAuditService = new AiAuditService();
