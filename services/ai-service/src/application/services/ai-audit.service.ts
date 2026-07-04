import { db, auditLogTable } from "@longox/db";

export type AiAuditEventType =
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
      await db.insert(auditLogTable).values({
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
      } as any);
    } catch {
      // non-fatal audit logging
    }
  }
}

export const aiAuditService = new AiAuditService();
