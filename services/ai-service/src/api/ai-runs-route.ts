import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, aiGuardrailsTable, aiGuardrailHitsTable, tokenUsageTable } from "@longox/db";
import { authorize } from "@longox/shared-rbac";
import { aiRunLifecycleService } from "../application/services/ai-run-lifecycle.service";
import { costBudgetService } from "../application/services/cost-budget.service";
import { moderationService } from "../application/services/moderation.service";
import type { ChatMessage } from "../providers";

const router: IRouter = Router();

router.post("/ai/runs", authorize("ai:run"), async (req, res): Promise<void> => {
  const tenantId = req.tenantId ?? 0;
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
    promptId?: number;
    workflowId?: number;
    guardrailIds?: number[];
    routingPolicyId?: number;
    scrubPii?: boolean;
    piiModes?: string[];
    budgetCheckEnabled?: boolean;
  };

  if (!messages || messages.length === 0) {
    res.status(400).json({ error: "messages array is required" });
    return;
  }

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
    res.status(result.error.includes("Budget") ? 402 : 500).json(result);
    return;
  }

  res.json(result);
});

router.get("/ai/runs", authorize("ai:read"), async (req, res): Promise<void> => {
  const limit = Math.min(Number(req.query.limit ?? 20), 100);
  const rows = await db
    .select()
    .from(tokenUsageTable)
    .orderBy(tokenUsageTable.createdAt)
    .limit(limit);

  res.json(
    rows.map((r) => ({
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
});

router.get("/ai/runs/:id", authorize("ai:read"), async (req, res): Promise<void> => {
  const [row] = await db
    .select()
    .from(tokenUsageTable)
    .where(eq(tokenUsageTable.id, Number(req.params.id)));

  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  res.json({
    id: row.id,
    modelName: row.modelName,
    provider: row.provider,
    workflowId: row.workflowId,
    inputTokens: row.inputTokens,
    outputTokens: row.outputTokens,
    cost: Number(row.cost),
    createdAt: row.createdAt.toISOString(),
  });
});

router.post("/ai/runs/:id/cancel", authorize("ai:run"), async (req, res): Promise<void> => {
  res.json({ id: Number(req.params.id), status: "cancelled", cancelledAt: new Date().toISOString() });
});

router.get("/ai/guardrails", authorize("ai:read"), async (req, res): Promise<void> => {
  const tenantId = req.tenantId ?? 0;
  const rows = await db
    .select()
    .from(aiGuardrailsTable)
    .where(eq(aiGuardrailsTable.tenantId, tenantId))
    .orderBy(aiGuardrailsTable.createdAt);

  res.json(
    rows.map((r) => ({
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
});

router.post("/ai/guardrails", authorize("ai:write"), async (req, res): Promise<void> => {
  const tenantId = req.tenantId ?? 0;
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

  const [row] = await db
    .insert(aiGuardrailsTable)
    .values({
      name: name.trim(),
      type,
      config,
      enabled,
      severity,
      tenantId,
    })
    .returning();

  res.status(201).json({
    id: row.id,
    name: row.name,
    type: row.type,
    config: row.config,
    enabled: row.enabled,
    severity: row.severity,
    tenantId: row.tenantId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });
});

router.get("/ai/guardrails/:id", authorize("ai:read"), async (req, res): Promise<void> => {
  const tenantId = req.tenantId ?? 0;
  const [row] = await db
    .select()
    .from(aiGuardrailsTable)
    .where(
      eq(aiGuardrailsTable.id, Number(req.params.id)),
    );

  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  res.json({
    id: row.id,
    name: row.name,
    type: row.type,
    config: row.config,
    enabled: row.enabled,
    severity: row.severity,
    tenantId: row.tenantId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });
});

router.patch("/ai/guardrails/:id", authorize("ai:write"), async (req, res): Promise<void> => {
  const id = Number(req.params.id);
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

  const [row] = await db
    .update(aiGuardrailsTable)
    .set(updates as any)
    .where(eq(aiGuardrailsTable.id, id))
    .returning();

  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  res.json({
    id: row.id,
    name: row.name,
    type: row.type,
    config: row.config,
    enabled: row.enabled,
    severity: row.severity,
    tenantId: row.tenantId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });
});

router.delete("/ai/guardrails/:id", authorize("ai:delete"), async (req, res): Promise<void> => {
  await db
    .delete(aiGuardrailsTable)
    .where(eq(aiGuardrailsTable.id, Number(req.params.id)));
  res.status(204).end();
});

router.get("/ai/guardrails/:id/hits", authorize("ai:read"), async (req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(aiGuardrailHitsTable)
    .where(eq(aiGuardrailHitsTable.guardrailId, Number(req.params.id)))
    .orderBy(aiGuardrailHitsTable.createdAt);

  res.json(
    rows.map((r) => ({
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
});

router.get("/ai/budget", authorize("ai:read"), async (req, res): Promise<void> => {
  const tenantId = req.tenantId ?? 0;
  if (!tenantId) {
    res.status(400).json({ error: "Tenant context required" });
    return;
  }

  const usage = await costBudgetService.getBudgetUsage(tenantId);
  res.json(usage);
});

router.post("/ai/moderation/scrub", authorize("ai:run"), async (req, res): Promise<void> => {
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

  res.json({ original: text, scrubbed: scrubbedText, modified: text !== scrubbedText });
});

export default router;
