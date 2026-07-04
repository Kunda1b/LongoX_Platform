/**
 * Template REST routes.
 *
 * Migrated from Drizzle to Prisma per ADR-013 Phase 3.
 * Uses `prisma.template` and `prisma.templateVersion` delegates.
 *
 * NOTE: The underlying `templates`/`template_versions` tables still carry
 * legacy columns (tags, nodes, uses, complexity, is_custom, template_type,
 * metadata, version, change_note, etc.) that are not yet reflected on the
 * Prisma model. We use `as any` casts so Prisma does not type-check those
 * fields while still persisting them.
 */

import { Router, type IRouter } from "express";
import { prisma } from "@longox/db/prisma";

const router: IRouter = Router();

function serialize(t: any) {
  return {
    id: t.id,
    name: t.name,
    description: t.description,
    category: t.category,
    tags: t.tags,
    triggerType: t.triggerType,
    nodeCount: t.nodeCount,
    uses: t.uses,
    complexity: t.complexity,
    isCustom: t.isCustom,
    templateType: t.templateType,
    metadata: t.metadata,
    nodes: t.nodes,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
}

router.get("/templates", async (req, res): Promise<void> => {
  const { category, search, type } = req.query as Record<
    string,
    string | undefined
  >;

  const where: Record<string, unknown> = {};
  if (category) where.category = category;
  if (type) where.templateType = type;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const rows = await prisma.template.findMany({
    where: where as any,
    orderBy: { uses: "desc" } as any,
  });

  res.json(rows.map(serialize));
});

router.get("/templates/:id", async (req, res): Promise<void> => {
  const id = req.params.id;
  if (!id) {
    res.status(400).json({ error: "id is required" });
    return;
  }

  const row = await prisma.template.findUnique({ where: { id } });
  if (!row) {
    res.status(404).json({ error: "Template not found" });
    return;
  }

  res.json(serialize(row));
});

router.post("/templates", async (req, res): Promise<void> => {
  const {
    name,
    description,
    category,
    tags,
    nodes,
    templateType,
    complexity,
    triggerType,
    metadata,
  } = req.body as Record<string, unknown>;

  if (!name) {
    res.status(400).json({ error: "name is required" });
    return;
  }

  const row = await prisma.template.create({
    data: {
      name: String(name),
      description: description ? String(description) : "",
      category: String(category ?? "general"),
      tags: (tags ?? []) as string[],
      nodes: (nodes ?? []) as any[],
      templateType: String(templateType ?? "workflow"),
      complexity: String(complexity ?? "beginner"),
      triggerType: String(triggerType ?? "manual"),
      nodeCount: Array.isArray(nodes) ? nodes.length : 0,
      isCustom: true,
      metadata: (metadata ?? {}) as Record<string, unknown>,
    } as any,
  });

  res.status(201).json(serialize(row));
});

router.post("/templates/:id/use", async (req, res): Promise<void> => {
  const id = req.params.id;
  if (!id) {
    res.status(400).json({ error: "id is required" });
    return;
  }

  // Atomic increment of legacy `uses` column.
  await prisma.$executeRawUnsafe(
    `UPDATE templates SET uses = uses + 1 WHERE id = $1`,
    id,
  );

  const row = await prisma.template.findUnique({ where: { id } });
  if (!row) {
    res.status(404).json({ error: "Template not found" });
    return;
  }
  res.json(serialize(row));
});

router.get("/templates/:id/versions", async (req, res): Promise<void> => {
  const id = req.params.id;
  if (!id) {
    res.status(400).json({ error: "id is required" });
    return;
  }

  const versions = await prisma.templateVersion.findMany({
    where: { templateId: id },
    orderBy: { version: "desc" } as any,
  });

  res.json(versions);
});

router.post("/templates/:id/fork", async (req, res): Promise<void> => {
  const id = req.params.id;
  if (!id) {
    res.status(400).json({ error: "id is required" });
    return;
  }

  const original = await prisma.template.findUnique({ where: { id } });
  if (!original) {
    res.status(404).json({ error: "Template not found" });
    return;
  }

  const o = original as any;
  const forked = await prisma.template.create({
    data: {
      name: `${o.name} (Fork)`,
      description: o.description,
      category: o.category,
      tags: o.tags,
      nodes: o.nodes as any[],
      templateType: o.templateType,
      complexity: o.complexity,
      triggerType: o.triggerType,
      nodeCount: o.nodeCount,
      isCustom: true,
      metadata: { ...((o.metadata as any) ?? {}), forkedFrom: id },
    } as any,
  });

  res.status(201).json(serialize(forked));
});

export default router;
