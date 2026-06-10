import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, promptsTable, promptVersionsTable } from "@autoflow/db";

const router: IRouter = Router();

let seeded = false;
async function ensurePrompts() {
  if (seeded) return;
  seeded = true;
  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(promptsTable);
  if (count > 0) return;
  await db.insert(promptsTable).values([
    { name: "Data Extraction", description: "Extract structured data from unstructured text", content: "Extract the following fields from the provided text:\n{{fields}}\n\nText: {{input}}\n\nReturn as JSON.", version: 2, status: "approved", tags: ["extraction", "json"] },
    { name: "Summarize Email", description: "Generate concise email summaries", content: "Summarize the following email in 2-3 sentences, preserving the key action items:\n\n{{email}}", version: 1, status: "approved", tags: ["email", "summarization"] },
    { name: "Sentiment Analysis", description: "Analyze sentiment of customer feedback", content: "Analyze the sentiment of the following text and respond with: positive, negative, or neutral, followed by a confidence score 0-1.\n\nText: {{text}}", version: 1, status: "review", tags: ["sentiment", "classification"] },
    { name: "Code Review", description: "Review code snippets for best practices", content: "Review the following {{language}} code for bugs, performance issues, and best practices. Be concise.\n\n```{{language}}\n{{code}}\n```", version: 1, status: "draft", tags: ["code", "review"] },
  ]);
}

function fmtPrompt(row: typeof promptsTable.$inferSelect) {
  return {
    id: row.id, name: row.name, description: row.description ?? null,
    content: row.content, version: row.version, status: row.status,
    tags: row.tags ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

router.get("/prompts", async (_req, res): Promise<void> => {
  await ensurePrompts();
  const rows = await db.select().from(promptsTable).orderBy(promptsTable.id);
  res.json(rows.map(fmtPrompt));
});

router.get("/prompts/:id", async (req, res): Promise<void> => {
  const [row] = await db.select().from(promptsTable).where(eq(promptsTable.id, Number(req.params.id)));
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(fmtPrompt(row));
});

router.post("/prompts", async (req, res): Promise<void> => {
  const { name, description, content, tags } = req.body as { name: string; description?: string; content: string; tags?: string[] };
  if (!name?.trim() || !content?.trim()) { res.status(400).json({ error: "name and content required" }); return; }
  const [row] = await db.insert(promptsTable).values({ name: name.trim(), description, content: content.trim(), tags, version: 1, status: "draft" }).returning();
  await db.insert(promptVersionsTable).values({ promptId: row.id, content: content.trim(), version: 1, status: "draft" });
  res.status(201).json(fmtPrompt(row));
});

router.patch("/prompts/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const updates: Record<string, unknown> = {};
  const b = req.body as Partial<{ name: string; description: string; content: string; tags: string[] }>;
  if (b.name !== undefined) updates.name = b.name.trim();
  if (b.description !== undefined) updates.description = b.description;
  if (b.content !== undefined) updates.content = b.content.trim();
  if (b.tags !== undefined) updates.tags = b.tags;

  if (b.content) {
    const [current] = await db.select({ version: promptsTable.version }).from(promptsTable).where(eq(promptsTable.id, id));
    if (current) {
      const newVersion = (current.version ?? 1) + 1;
      updates.version = newVersion;
      await db.insert(promptVersionsTable).values({ promptId: id, content: b.content.trim(), version: newVersion, status: "draft" });
    }
  }

  const [row] = await db.update(promptsTable).set(updates).where(eq(promptsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(fmtPrompt(row));
});

router.delete("/prompts/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  await db.delete(promptVersionsTable).where(eq(promptVersionsTable.promptId, id));
  await db.delete(promptsTable).where(eq(promptsTable.id, id));
  res.status(204).end();
});

router.get("/prompts/:id/versions", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const rows = await db.select().from(promptVersionsTable).where(eq(promptVersionsTable.promptId, id)).orderBy(promptVersionsTable.version);
  res.json(rows.map((r) => ({ id: r.id, promptId: r.promptId, content: r.content, version: r.version, status: r.status, notes: r.notes ?? null, createdAt: r.createdAt.toISOString() })));
});

router.post("/prompts/:id/publish", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  await db.update(promptVersionsTable).set({ status: "approved" }).where(eq(promptVersionsTable.promptId, id));
  const [row] = await db.update(promptsTable).set({ status: "approved" }).where(eq(promptsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(fmtPrompt(row));
});

export default router;
