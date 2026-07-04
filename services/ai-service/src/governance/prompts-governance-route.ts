import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, promptsTable, promptVersionsTable, promptApprovalsTable } from "@longox/db";
import { aiRouter } from "../routing/ai-router";
import type { ChatMessage } from "../providers";
import { authorize } from "@longox/shared-rbac";

const router: IRouter = Router();

router.get("/prompts/:id/versions", authorize("ai:read"), async (req, res): Promise<void> => {
  const id = String(req.params.id);
  const rows = await db
    .select()
    .from(promptVersionsTable)
    .where(eq(promptVersionsTable.promptId, id))
    .orderBy(promptVersionsTable.version);
  res.json(
    rows.map((r) => ({
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
    approverId?: number;
    comment?: string;
  };

  const [prompt] = await db
    .select()
    .from(promptsTable)
    .where(eq(promptsTable.id, id));

  if (!prompt) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  await db
    .update(promptVersionsTable)
    .set({ status: "approved" })
    .where(eq(promptVersionsTable.promptId, id));

  await db.insert(promptApprovalsTable).values({
    promptId: id,
    version: prompt.version,
    requesterId: req.user?.id,
    approverId: approverId ?? req.user?.id,
    status: "approved",
    comment,
    decidedAt: new Date(),
  });

  const [row] = await db
    .update(promptsTable)
    .set({ status: "approved" })
    .where(eq(promptsTable.id, id))
    .returning();

  res.json({
    id: row.id,
    name: row.name,
    description: row.description,
    content: row.content,
    version: row.version,
    status: row.status,
    tags: row.tags,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });
});

router.post("/prompts/:id/rollback", authorize("ai:write"), async (req, res): Promise<void> => {
  const id = String(req.params.id);
  const { targetVersion } = req.body as { targetVersion: number };

  if (!targetVersion || targetVersion < 1) {
    res.status(400).json({ error: "targetVersion required and must be >= 1" });
    return;
  }

  const [targetVersionRow] = await db
    .select()
    .from(promptVersionsTable)
    .where(
      and(
        eq(promptVersionsTable.promptId, id),
        eq(promptVersionsTable.version, targetVersion),
      ),
    );

  if (!targetVersionRow) {
    res.status(404).json({ error: `Version ${targetVersion} not found` });
    return;
  }

  const [currentPrompt] = await db
    .select({ version: promptsTable.version })
    .from(promptsTable)
    .where(eq(promptsTable.id, id));

  if (!currentPrompt) {
    res.status(404).json({ error: "Prompt not found" });
    return;
  }

  const newVersion = (currentPrompt.version ?? 1) + 1;

  await db.insert(promptVersionsTable).values({
    promptId: id,
    content: targetVersionRow.content,
    version: newVersion,
    status: "approved",
    notes: `Rolled back from v${currentPrompt.version} to v${targetVersion}`,
  });

  const [row] = await db
    .update(promptsTable)
    .set({
      content: targetVersionRow.content,
      version: newVersion,
      status: "approved",
    })
    .where(eq(promptsTable.id, id))
    .returning();

  res.json({
    id: row.id,
    name: row.name,
    content: row.content,
    version: row.version,
    status: row.status,
    rolledBackFrom: currentPrompt.version,
    rolledBackTo: targetVersion,
  });
});

router.post("/prompts/:id/submit-for-review", authorize("ai:write"), async (req, res): Promise<void> => {
  const id = String(req.params.id);
  const [row] = await db
    .update(promptsTable)
    .set({ status: "review" })
    .where(eq(promptsTable.id, id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  await db.insert(promptApprovalsTable).values({
    promptId: id,
    version: row.version,
    requesterId: req.user?.id,
    status: "pending",
  });

  res.json({ id: row.id, status: row.status, version: row.version });
});

router.post("/prompts/:id/reject", authorize("ai:write"), async (req, res): Promise<void> => {
  const id = String(req.params.id);
  const { comment } = req.body as { comment?: string };

  const [row] = await db
    .update(promptsTable)
    .set({ status: "draft" })
    .where(eq(promptsTable.id, id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  await db.insert(promptApprovalsTable).values({
    promptId: id,
    version: row.version,
    approverId: req.user?.id,
    status: "rejected",
    comment,
    decidedAt: new Date(),
  });

  res.json({ id: row.id, status: row.status });
});

router.get("/prompts/:id/approval-history", authorize("ai:read"), async (req, res): Promise<void> => {
  const id = String(req.params.id);
  const rows = await db
    .select()
    .from(promptApprovalsTable)
    .where(eq(promptApprovalsTable.promptId, id))
    .orderBy(desc(promptApprovalsTable.createdAt));
  res.json(
    rows.map((r) => ({
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

  const [prompt] = await db
    .select()
    .from(promptsTable)
    .where(eq(promptsTable.id, id));

  if (!prompt) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  let content = prompt.content;
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
      { model: modelId, temperature: prompt.temperature, maxTokens: prompt.maxTokens },
      provider ? { providerPreferences: [provider as any] } : undefined,
    );

    const latencyMs = Date.now() - startedAt;

    res.json({
      promptId: id,
      version: prompt.version,
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
