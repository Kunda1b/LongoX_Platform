/**
 * AI routing policy routes.
 *
 * Migrated from Drizzle to Prisma per ADR-013 Phase 3.
 * Uses `prisma.aiRoutingPolicy` delegate with `as any` casts for legacy columns.
 */

import { Router, type IRouter } from "express";
import { prisma } from "@longox/db/prisma";
import { authorize } from "@longox/shared-rbac";

const router: IRouter = Router();

function fmt(row: any) {
  return {
    id: row.id,
    tenantId: row.tenantId,
    name: row.name,
    description: row.description ?? null,
    strategy: row.strategy,
    providerPreferences: row.providerPreferences ?? [],
    modelAllowlist: row.modelAllowlist ?? null,
    modelDenylist: row.modelDenylist ?? null,
    fallbackEnabled: row.fallbackEnabled,
    maxRetries: row.maxRetries,
    config: row.config ?? {},
    isEnabled: row.isEnabled,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

router.get("/ai-routing-policies", authorize("ai:read"), async (req, res): Promise<void> => {
  const tenantId = req.tenantId ?? "";
  if (!tenantId) {
    res.status(400).json({ error: "Tenant context required" });
    return;
  }
  const rows = await prisma.aiRoutingPolicy.findMany({
    where: { tenantId } as any,
    orderBy: { createdAt: "asc" } as any,
  });
  res.json(rows.map(fmt));
});

router.get("/ai-routing-policies/:id", authorize("ai:read"), async (req, res): Promise<void> => {
  const tenantId = req.tenantId ?? "";
  const row = await prisma.aiRoutingPolicy.findFirst({
    where: {
      id: String(req.params.id),
      tenantId,
    } as any,
  });
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(fmt(row));
});

router.post("/ai-routing-policies", authorize("ai:write"), async (req, res): Promise<void> => {
  const tenantId = req.tenantId ?? "";
  if (!tenantId) {
    res.status(400).json({ error: "Tenant context required" });
    return;
  }
  const {
    name,
    description,
    strategy = "cheapest",
    providerPreferences = [],
    modelAllowlist,
    modelDenylist,
    fallbackEnabled = true,
    maxRetries = 2,
    config = {},
  } = req.body as {
    name: string;
    description?: string;
    strategy?: string;
    providerPreferences?: string[];
    modelAllowlist?: string[];
    modelDenylist?: string[];
    fallbackEnabled?: boolean;
    maxRetries?: number;
    config?: Record<string, unknown>;
  };
  if (!name?.trim()) {
    res.status(400).json({ error: "name required" });
    return;
  }
  const row = await prisma.aiRoutingPolicy.create({
    data: {
      tenantId,
      name: name.trim(),
      description,
      strategy,
      providerPreferences,
      modelAllowlist,
      modelDenylist,
      fallbackEnabled,
      maxRetries,
      config,
    } as any,
  });
  res.status(201).json(fmt(row));
});

router.patch("/ai-routing-policies/:id", authorize("ai:write"), async (req, res): Promise<void> => {
  const tenantId = req.tenantId ?? "";
  const id = String(req.params.id);
  const updates: Record<string, unknown> = {};
  const b = req.body as Partial<{
    name: string;
    description: string;
    strategy: string;
    providerPreferences: string[];
    modelAllowlist: string[];
    modelDenylist: string[];
    fallbackEnabled: boolean;
    maxRetries: number;
    config: Record<string, unknown>;
    isEnabled: boolean;
  }>;
  if (b.name !== undefined) updates.name = b.name.trim();
  if (b.description !== undefined) updates.description = b.description;
  if (b.strategy !== undefined) updates.strategy = b.strategy;
  if (b.providerPreferences !== undefined) updates.providerPreferences = b.providerPreferences;
  if (b.modelAllowlist !== undefined) updates.modelAllowlist = b.modelAllowlist;
  if (b.modelDenylist !== undefined) updates.modelDenylist = b.modelDenylist;
  if (b.fallbackEnabled !== undefined) updates.fallbackEnabled = b.fallbackEnabled;
  if (b.maxRetries !== undefined) updates.maxRetries = b.maxRetries;
  if (b.config !== undefined) updates.config = b.config;
  if (b.isEnabled !== undefined) updates.isEnabled = b.isEnabled;

  const row = await prisma.aiRoutingPolicy.update({
    where: { id } as any,
    data: updates as any,
  }).catch(() => null);

  if (!row || (row as any).tenantId !== tenantId) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(fmt(row));
});

router.delete("/ai-routing-policies/:id", authorize("ai:delete"), async (req, res): Promise<void> => {
  const tenantId = req.tenantId ?? "";
  await prisma.aiRoutingPolicy.deleteMany({
    where: {
      id: String(req.params.id),
      tenantId,
    } as any,
  });
  res.status(204).end();
});

export default router;
