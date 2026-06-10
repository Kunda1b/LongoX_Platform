import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, aiModelsTable } from "@longox/db";

const router: IRouter = Router();

let seeded = false;
async function ensureModels() {
  if (seeded) return;
  seeded = true;
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(aiModelsTable);
  if (count > 0) return;
  await db.insert(aiModelsTable).values([
    {
      provider: "openai",
      name: "GPT-4o",
      modelId: "gpt-4o",
      contextWindow: 128000,
      inputCostPerToken: "0.000005",
      outputCostPerToken: "0.000015",
      isEnabled: true,
    },
    {
      provider: "openai",
      name: "GPT-4o Mini",
      modelId: "gpt-4o-mini",
      contextWindow: 128000,
      inputCostPerToken: "0.00000015",
      outputCostPerToken: "0.0000006",
      isEnabled: true,
    },
    {
      provider: "anthropic",
      name: "Claude 3.5 Sonnet",
      modelId: "claude-3-5-sonnet-20241022",
      contextWindow: 200000,
      inputCostPerToken: "0.000003",
      outputCostPerToken: "0.000015",
      isEnabled: true,
    },
    {
      provider: "anthropic",
      name: "Claude 3 Haiku",
      modelId: "claude-3-haiku-20240307",
      contextWindow: 200000,
      inputCostPerToken: "0.00000025",
      outputCostPerToken: "0.00000125",
      isEnabled: true,
    },
    {
      provider: "google",
      name: "Gemini 1.5 Pro",
      modelId: "gemini-1.5-pro",
      contextWindow: 1000000,
      inputCostPerToken: "0.00000125",
      outputCostPerToken: "0.000005",
      isEnabled: true,
    },
    {
      provider: "mistral",
      name: "Mistral Large",
      modelId: "mistral-large-latest",
      contextWindow: 32000,
      inputCostPerToken: "0.000002",
      outputCostPerToken: "0.000006",
      isEnabled: false,
    },
  ]);
}

function fmt(row: typeof aiModelsTable.$inferSelect) {
  return {
    id: row.id,
    provider: row.provider,
    name: row.name,
    modelId: row.modelId,
    contextWindow: row.contextWindow,
    inputCostPerToken: Number(row.inputCostPerToken),
    outputCostPerToken: Number(row.outputCostPerToken),
    isEnabled: row.isEnabled,
    config: row.config ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

router.get("/ai-models", async (_req, res): Promise<void> => {
  await ensureModels();
  const rows = await db
    .select()
    .from(aiModelsTable)
    .orderBy(aiModelsTable.provider, aiModelsTable.name);
  res.json(rows.map(fmt));
});

router.get("/ai-models/:id", async (req, res): Promise<void> => {
  await ensureModels();
  const [row] = await db
    .select()
    .from(aiModelsTable)
    .where(eq(aiModelsTable.id, Number(req.params.id)));
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(fmt(row));
});

router.post("/ai-models", async (req, res): Promise<void> => {
  const {
    provider,
    name,
    modelId,
    contextWindow = 4096,
    inputCostPerToken = 0,
    outputCostPerToken = 0,
    isEnabled = true,
    config = {},
  } = req.body as {
    provider: string;
    name: string;
    modelId: string;
    contextWindow?: number;
    inputCostPerToken?: number;
    outputCostPerToken?: number;
    isEnabled?: boolean;
    config?: Record<string, unknown>;
  };
  if (!provider?.trim() || !name?.trim() || !modelId?.trim()) {
    res.status(400).json({ error: "provider, name, modelId required" });
    return;
  }
  const [row] = await db
    .insert(aiModelsTable)
    .values({
      provider: provider.trim(),
      name: name.trim(),
      modelId: modelId.trim(),
      contextWindow,
      inputCostPerToken: String(inputCostPerToken),
      outputCostPerToken: String(outputCostPerToken),
      isEnabled,
      config,
    })
    .returning();
  res.status(201).json(fmt(row));
});

router.patch("/ai-models/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const updates: Record<string, unknown> = {};
  const b = req.body as Partial<{
    provider: string;
    name: string;
    modelId: string;
    contextWindow: number;
    inputCostPerToken: number;
    outputCostPerToken: number;
    isEnabled: boolean;
    config: Record<string, unknown>;
  }>;
  if (b.provider !== undefined) updates.provider = b.provider;
  if (b.name !== undefined) updates.name = b.name;
  if (b.modelId !== undefined) updates.modelId = b.modelId;
  if (b.contextWindow !== undefined) updates.contextWindow = b.contextWindow;
  if (b.inputCostPerToken !== undefined)
    updates.inputCostPerToken = String(b.inputCostPerToken);
  if (b.outputCostPerToken !== undefined)
    updates.outputCostPerToken = String(b.outputCostPerToken);
  if (b.isEnabled !== undefined) updates.isEnabled = b.isEnabled;
  if (b.config !== undefined) updates.config = b.config;
  const [row] = await db
    .update(aiModelsTable)
    .set(updates)
    .where(eq(aiModelsTable.id, id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(fmt(row));
});

router.delete("/ai-models/:id", async (req, res): Promise<void> => {
  await db
    .delete(aiModelsTable)
    .where(eq(aiModelsTable.id, Number(req.params.id)));
  res.status(204).end();
});

export default router;
