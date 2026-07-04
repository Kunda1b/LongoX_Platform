/**
 * Prompt governance routes.
 *
 * Migrated from Drizzle to Prisma per ADR-013 Phase 3.
 * Uses `prisma.aiPrompt`, `prisma.aiPromptVersion`, and `prisma.promptApproval`
 * delegates with `as any` casts for legacy columns.
 */

import { Router, type IRouter } from "express";
import { prisma } from "@longox/db/prisma";
import { aiRouter } from "../routing/ai-router";
import type { ChatMessage } from "../providers";
import { authorize } from "@longox/shared-rbac";

const router: IRouter = Router();

router.get("/prompts/:id/versions", authorize("ai:read"), async (req, res): Promise<void> => {
  const id = String(req.params.id);
  const rows = await prisma.aiPromptVersion.findMany({
    where: { promptId: id } as any,
    orderBy: { version: "asc" } as any,
  });
  res.json(
    rows.map((r: any) => ({
      id: r.id,
      promptId: r.promptId,
      content: r.content,
      version: r.version,
      status: r.status,
      notes: r.notes ?? null,
      createdAt: r.createdAt.toISOString(),
    })),
  );
});

router.post("/prompts/:id/publish", authorize("ai:write"), async (req, res): Promise<void> => {
  const id = String(req.params.id);
  const { approverId, comment } = req.body as {
    approverId?: string;
    comment?: string;
  };

  const prompt = await prisma.aiPrompt.findUnique({
    where: { id } as any,
  });

  if (!prompt) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  await prisma.aiPromptVersion.updateMany({
    where: { promptId: id } as any,
    data: { status: "approved" } as any,
  });

  await prisma.promptApproval.create({
    data: {
      promptId: id,
      version: (prompt as any).version,
      requesterId: req.user?.id,
      approverId: approverId ?? req.user?.id,
      status: "approved",
      comment,
      decidedAt: new Date(),
    } as any,
  });

  const row = await prisma.aiPrompt.update({
    where: { id } as any,
    data: { status: "approved" } as any,
  });

  res.json({
    id: (row as any).id,
    name: (row as any).name,
    description: (row as any).description,
    content: (row as any).content,
    version: (row as any).version,
    status: (row as any).status,
    tags: (row as any).tags,
    createdAt: (row as any).createdAt.toISOString(),
    updatedAt: (row as any).updatedAt.toISOString(),
  });
});

router.post("/prompts/:id/rollback", authorize("ai:write"), async (req, res): Promise<void> => {
  const id = String(req.params.id);
  const { targetVersion } = req.body as { targetVersion: number };

  if (!targetVersion || targetVersion < 1) {
    res.status(400).json({ error: "targetVersion required and must be >= 1" });
    return;
  }

  const targetVersionRow = await prisma.aiPromptVersion.findFirst({
    where: {
      promptId: id,
      version: targetVersion,
    } as any,
  });

  if (!targetVersionRow) {
    res.status(404).json({ error: `Version ${targetVersion} not found` });
    return;
  }

  const currentPrompt = await prisma.aiPrompt.findUnique({
    where: { id } as any,
  });

  if (!currentPrompt) {
    res.status(404).json({ error: "Prompt not found" });
    return;
  }

  const newVersion = ((currentPrompt as any).version ?? 1) + 1;

  await prisma.aiPromptVersion.create({
    data: {
      promptId: id,
      content: (targetVersionRow as any).content,
      version: newVersion,
      status: "approved",
      notes: `Rolled back from v${(currentPrompt as any).version} to v${targetVersion}`,
    } as any,
  });

  const row = await prisma.aiPrompt.update({
    where: { id } as any,
    data: {
      content: (targetVersionRow as any).content,
      version: newVersion,
      status: "approved",
    } as any,
  });

  res.json({
    id: (row as any).id,
    name: (row as any).name,
    content: (row as any).content,
    version: (row as any).version,
    status: (row as any).status,
    rolledBackFrom: (currentPrompt as any).version,
    rolledBackTo: targetVersion,
  });
});

router.post("/prompts/:id/submit-for-review", authorize("ai:write"), async (req, res): Promise<void> => {
  const id = String(req.params.id);
  const row = await prisma.aiPrompt.update({
    where: { id } as any,
    data: { status: "review" } as any,
  }).catch(() => null);
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  await prisma.promptApproval.create({
    data: {
      promptId: id,
      version: (row as any).version,
      requesterId: req.user?.id,
      status: "pending",
    } as any,
  });

  res.json({ id: (row as any).id, status: (row as any).status, version: (row as any).version });
});

router.post("/prompts/:id/reject", authorize("ai:write"), async (req, res): Promise<void> => {
  const id = String(req.params.id);
  const { comment } = req.body as { comment?: string };

  const row = await prisma.aiPrompt.update({
    where: { id } as any,
    data: { status: "draft" } as any,
  }).catch(() => null);
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  await prisma.promptApproval.create({
    data: {
      promptId: id,
      version: (row as any).version,
      approverId: req.user?.id,
      status: "rejected",
      comment,
      decidedAt: new Date(),
    } as any,
  });

  res.json({ id: (row as any).id, status: (row as any).status });
});

router.get("/prompts/:id/approval-history", authorize("ai:read"), async (req, res): Promise<void> => {
  const id = String(req.params.id);
  const rows = await prisma.promptApproval.findMany({
    where: { promptId: id } as any,
    orderBy: { createdAt: "desc" } as any,
  });
  res.json(
    rows.map((r: any) => ({
      id: r.id,
      promptId: r.promptId,
      version: r.version,
      requesterId: r.requesterId,
      approverId: r.approverId,
      status: r.status,
      comment: r.comment,
      decidedAt: r.decidedAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
    })),
  );
});

router.post("/prompts/:id/test", authorize("ai:run"), async (req, res): Promise<void> => {
  const id = String(req.params.id);
  const { variables, modelId, provider } = req.body as {
    variables?: Record<string, string>;
    modelId?: string;
    provider?: string;
  };

  const prompt = await prisma.aiPrompt.findUnique({
    where: { id } as any,
  });

  if (!prompt) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  let content = (prompt as any).content;
  if (variables) {
    for (const [key, value] of Object.entries(variables)) {
      content = content.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
    }
  }

  const messages: ChatMessage[] = [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content },
  ];

  const startedAt = Date.now();

  try {
    const routingResult = await aiRouter.route(
      messages,
      { model: modelId, temperature: (prompt as any).temperature, maxTokens: (prompt as any).maxTokens },
      provider ? { providerPreferences: [provider as any] } : undefined,
    );

    const latencyMs = Date.now() - startedAt;

    res.json({
      promptId: id,
      version: (prompt as any).version,
      provider: routingResult.provider,
      model: routingResult.result.model,
      renderedContent: content,
      response: routingResult.result.content,
      usage: {
        inputTokens: routingResult.result.inputTokens,
        outputTokens: routingResult.result.outputTokens,
      },
      cost: routingResult.result.cost,
      latencyMs,
    });
  } catch (err) {
    res.status(500).json({
      error: err instanceof Error ? err.message : String(err),
      renderedContent: content,
    });
  }
});

export default router;
