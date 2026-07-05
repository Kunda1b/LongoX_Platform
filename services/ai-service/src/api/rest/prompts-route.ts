/**
 * Prompts REST routes.
 *
 * Migrated from Drizzle to Prisma per ADR-013 Phase 3.
 * Uses `prisma.aiPrompt` and `prisma.aiPromptVersion` delegates with `as any`
 * casts for legacy columns.
 */

import { Router, type IRouter } from "express";
import { prisma } from "@longox/db/prisma";
import { authorize } from "@longox/shared-rbac";

const router: IRouter = Router();

let seeded = false;
async function ensurePrompts() {
  if (seeded) return;
  seeded = true;
  const count = await prisma.aiPrompt.count();
  if (count > 0) return;
  await prisma.aiPrompt.createMany({
    data: [
      {
        name: "Data Extraction",
        description: "Extract structured data from unstructured text",
        content:
          "Extract the following fields from the provided text:\n{{fields}}\n\nText: {{input}}\n\nReturn as JSON.",
        version: 2,
        status: "approved",
        tags: ["extraction", "json"],
      },
      {
        name: "Summarize Email",
        description: "Generate concise email summaries",
        content:
          "Summarize the following email in 2-3 sentences, preserving the key action items:\n\n{{email}}",
        version: 1,
        status: "approved",
        tags: ["email", "summarization"],
      },
      {
        name: "Sentiment Analysis",
        description: "Analyze sentiment of customer feedback",
        content:
          "Analyze the sentiment of the following text and respond with: positive, negative, or neutral, followed by a confidence score 0-1.\n\nText: {{text}}",
        version: 1,
        status: "review",
        tags: ["sentiment", "classification"],
      },
      {
        name: "Code Review",
        description: "Review code snippets for best practices",
        content:
          "Review the following {{language}} code for bugs, performance issues, and best practices. Be concise.\n\n```{{language}}\n{{code}}\n```",
        version: 1,
        status: "draft",
        tags: ["code", "review"],
      },
    ] as any,
  });
}

function fmtPrompt(row: any) {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? null,
    content: row.content,
    version: row.version,
    status: row.status,
    tags: row.tags ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

router.get(
  "/prompts",
  authorize("ai:read"),
  async (_req, res): Promise<void> => {
    await ensurePrompts();
    const rows = await prisma.aiPrompt.findMany({
      orderBy: { id: "asc" } as any,
    });
    res.json(rows.map(fmtPrompt));
  },
);

router.get(
  "/prompts/:id",
  authorize("ai:read"),
  async (req, res): Promise<void> => {
    const row = await prisma.aiPrompt.findUnique({
      where: { id: String(req.params.id) } as any,
    });
    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(fmtPrompt(row));
  },
);

router.post(
  "/prompts",
  authorize("ai:write"),
  async (req, res): Promise<void> => {
    const { name, description, content, tags } = req.body as {
      name: string;
      description?: string;
      content: string;
      tags?: string[];
    };
    if (!name?.trim() || !content?.trim()) {
      res.status(400).json({ error: "name and content required" });
      return;
    }
    const row = await prisma.aiPrompt.create({
      data: {
        name: name.trim(),
        description,
        content: content.trim(),
        tags,
        version: 1,
        status: "draft",
      } as any,
    });
    await prisma.aiPromptVersion.create({
      data: {
        promptId: (row as any).id,
        content: content.trim(),
        version: 1,
        status: "draft",
      } as any,
    });
    res.status(201).json(fmtPrompt(row));
  },
);

router.patch(
  "/prompts/:id",
  authorize("ai:write"),
  async (req, res): Promise<void> => {
    const id = String(req.params.id);
    const updates: Record<string, unknown> = {};
    const b = req.body as Partial<{
      name: string;
      description: string;
      content: string;
      tags: string[];
    }>;
    if (b.name !== undefined) updates.name = b.name.trim();
    if (b.description !== undefined) updates.description = b.description;
    if (b.content !== undefined) updates.content = b.content.trim();
    if (b.tags !== undefined) updates.tags = b.tags;

    if (b.content) {
      const current = await prisma.aiPrompt.findUnique({
        where: { id } as any,
      });
      if (current) {
        const newVersion = ((current as any).version ?? 1) + 1;
        updates.version = newVersion;
        await prisma.aiPromptVersion.create({
          data: {
            promptId: id,
            content: b.content.trim(),
            version: newVersion,
            status: "draft",
          } as any,
        });
      }
    }

    const row = await prisma.aiPrompt
      .update({
        where: { id } as any,
        data: updates as any,
      })
      .catch(() => null);
    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(fmtPrompt(row));
  },
);

router.delete(
  "/prompts/:id",
  authorize("ai:delete"),
  async (req, res): Promise<void> => {
    const id = String(req.params.id);
    await prisma.aiPromptVersion.deleteMany({
      where: { promptId: id } as any,
    });
    await prisma.aiPrompt
      .delete({
        where: { id } as any,
      })
      .catch(() => undefined);
    res.status(204).end();
  },
);

router.get(
  "/prompts/:id/versions",
  authorize("ai:read"),
  async (req, res): Promise<void> => {
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
  },
);

router.post(
  "/prompts/:id/publish",
  authorize("ai:write"),
  async (req, res): Promise<void> => {
    const id = String(req.params.id);
    await prisma.aiPromptVersion.updateMany({
      where: { promptId: id } as any,
      data: { status: "approved" } as any,
    });
    const row = await prisma.aiPrompt
      .update({
        where: { id } as any,
        data: { status: "approved" } as any,
      })
      .catch(() => null);
    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(fmtPrompt(row));
  },
);

export default router;
