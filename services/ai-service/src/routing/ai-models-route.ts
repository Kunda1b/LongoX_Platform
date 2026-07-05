/**
 * AI models routes.
 *
 * Migrated from Drizzle to Prisma per ADR-013 Phase 3.
 * Uses `prisma.aiModel` delegate with `as any` casts for legacy columns.
 */

import { Router, type IRouter } from "express";
import { prisma } from "@longox/db/prisma";
import { authorize } from "@longox/shared-rbac";

const router: IRouter = Router();

let seeded = false;
async function ensureModels() {
  if (seeded) return;
  seeded = true;
  const count = await prisma.aiModel.count();
  if (count > 0) return;
  await prisma.aiModel.createMany({
    data: [
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
    ] as any,
  });
}

function fmt(row: any) {
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

router.get(
  "/ai-models",
  authorize("ai:read"),
  async (_req, res): Promise<void> => {
    await ensureModels();
    const rows = await prisma.aiModel.findMany({
      orderBy: [{ provider: "asc" } as any, { name: "asc" } as any],
    });
    res.json(rows.map(fmt));
  },
);

router.get(
  "/ai-models/:id",
  authorize("ai:read"),
  async (req, res): Promise<void> => {
    await ensureModels();
    const row = await prisma.aiModel.findUnique({
      where: { id: String(req.params.id) } as any,
    });
    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(fmt(row));
  },
);

router.post(
  "/ai-models",
  authorize("ai:write"),
  async (req, res): Promise<void> => {
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
    const row = await prisma.aiModel.create({
      data: {
        provider: provider.trim(),
        name: name.trim(),
        modelId: modelId.trim(),
        contextWindow,
        inputCostPerToken: String(inputCostPerToken),
        outputCostPerToken: String(outputCostPerToken),
        isEnabled,
        config,
      } as any,
    });
    res.status(201).json(fmt(row));
  },
);

router.patch(
  "/ai-models/:id",
  authorize("ai:write"),
  async (req, res): Promise<void> => {
    const id = String(req.params.id);
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
    const row = await prisma.aiModel
      .update({
        where: { id } as any,
        data: updates as any,
      })
      .catch(() => null);
    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(fmt(row));
  },
);

router.delete(
  "/ai-models/:id",
  authorize("ai:delete"),
  async (req, res): Promise<void> => {
    await prisma.aiModel
      .delete({
        where: { id: String(req.params.id) } as any,
      })
      .catch(() => undefined);
    res.status(204).end();
  },
);

export default router;
