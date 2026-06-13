import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, aiRoutingPoliciesTable } from "@longox/db";

const router: IRouter = Router();

function fmt(row: typeof aiRoutingPoliciesTable.$inferSelect) {
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

router.get("/ai-routing-policies", async (req, res): Promise<void> => {
  const tenantId = req.tenantId;
  if (!tenantId) {
    res.status(400).json({ error: "Tenant context required" });
    return;
  }
  const rows = await db
    .select()
    .from(aiRoutingPoliciesTable)
    .where(eq(aiRoutingPoliciesTable.tenantId, tenantId))
    .orderBy(aiRoutingPoliciesTable.createdAt);
  res.json(rows.map(fmt));
});

router.get("/ai-routing-policies/:id", async (req, res): Promise<void> => {
  const tenantId = req.tenantId;
  const [row] = await db
    .select()
    .from(aiRoutingPoliciesTable)
    .where(
      and(
        eq(aiRoutingPoliciesTable.id, Number(req.params.id)),
        eq(aiRoutingPoliciesTable.tenantId, tenantId),
      ),
    );
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(fmt(row));
});

router.post("/ai-routing-policies", async (req, res): Promise<void> => {
  const tenantId = req.tenantId;
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
  const [row] = await db
    .insert(aiRoutingPoliciesTable)
    .values({
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
    })
    .returning();
  res.status(201).json(fmt(row));
});

router.patch("/ai-routing-policies/:id", async (req, res): Promise<void> => {
  const tenantId = req.tenantId;
  const id = Number(req.params.id);
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

  const [row] = await db
    .update(aiRoutingPoliciesTable)
    .set(updates)
    .where(
      and(
        eq(aiRoutingPoliciesTable.id, id),
        eq(aiRoutingPoliciesTable.tenantId, tenantId),
      ),
    )
    .returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(fmt(row));
});

router.delete("/ai-routing-policies/:id", async (req, res): Promise<void> => {
  const tenantId = req.tenantId;
  await db
    .delete(aiRoutingPoliciesTable)
    .where(
      and(
        eq(aiRoutingPoliciesTable.id, Number(req.params.id)),
        eq(aiRoutingPoliciesTable.tenantId, tenantId),
      ),
    );
  res.status(204).end();
});

export default router;
