import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, featureFlagsTable } from "@longox/db";

const router: IRouter = Router();

let seeded = false;
async function ensureFlags() {
  if (seeded) return;
  seeded = true;
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(featureFlagsTable);
  if (count > 0) return;
  await db.insert(featureFlagsTable).values([
    {
      key: "ai_workflow_nodes",
      name: "AI Workflow Nodes",
      description: "Enable AI-powered nodes in the workflow builder",
      enabled: true,
      rolloutPercentage: 100,
    },
    {
      key: "dashboard_v2",
      name: "Dashboard V2",
      description: "New dashboard builder with grid layout",
      enabled: true,
      rolloutPercentage: 80,
    },
    {
      key: "multi_tenant_isolation",
      name: "Multi-Tenant Isolation",
      description: "Strict data isolation per tenant",
      enabled: false,
      rolloutPercentage: 0,
    },
    {
      key: "beta_connectors",
      name: "Beta Connectors",
      description: "Access to connectors in beta/preview",
      enabled: true,
      rolloutPercentage: 25,
    },
    {
      key: "audit_export",
      name: "Audit Log Export",
      description: "Export audit log to CSV/JSON",
      enabled: false,
      rolloutPercentage: 0,
    },
    {
      key: "prompt_playground",
      name: "Prompt Playground",
      description: "Interactive prompt testing UI",
      enabled: true,
      rolloutPercentage: 50,
    },
  ]);
}

function fmt(row: typeof featureFlagsTable.$inferSelect) {
  return {
    id: row.id,
    key: row.key,
    name: row.name,
    description: row.description ?? null,
    enabled: row.enabled,
    rolloutPercentage: row.rolloutPercentage,
    conditions: row.conditions ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

router.get("/feature-flags", async (_req, res): Promise<void> => {
  await ensureFlags();
  const rows = await db
    .select()
    .from(featureFlagsTable)
    .orderBy(featureFlagsTable.key);
  res.json(rows.map(fmt));
});

router.post("/feature-flags", async (req, res): Promise<void> => {
  const {
    key,
    name,
    description,
    enabled = false,
    rolloutPercentage = 0,
    conditions,
  } = req.body as {
    key: string;
    name: string;
    description?: string;
    enabled?: boolean;
    rolloutPercentage?: number;
    conditions?: Record<string, unknown>;
  };
  if (!key?.trim() || !name?.trim()) {
    res.status(400).json({ error: "key and name required" });
    return;
  }
  const [row] = await db
    .insert(featureFlagsTable)
    .values({
      key: key.trim(),
      name: name.trim(),
      description,
      enabled,
      rolloutPercentage,
      conditions,
    })
    .returning();
  res.status(201).json(fmt(row));
});

router.patch("/feature-flags/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const b = req.body as Partial<{
    key: string;
    name: string;
    description: string;
    enabled: boolean;
    rolloutPercentage: number;
    conditions: Record<string, unknown>;
  }>;
  const updates: Record<string, unknown> = {};
  if (b.key !== undefined) updates.key = b.key;
  if (b.name !== undefined) updates.name = b.name;
  if (b.description !== undefined) updates.description = b.description;
  if (b.enabled !== undefined) updates.enabled = b.enabled;
  if (b.rolloutPercentage !== undefined)
    updates.rolloutPercentage = b.rolloutPercentage;
  if (b.conditions !== undefined) updates.conditions = b.conditions;
  const [row] = await db
    .update(featureFlagsTable)
    .set(updates)
    .where(eq(featureFlagsTable.id, id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(fmt(row));
});

router.delete("/feature-flags/:id", async (req, res): Promise<void> => {
  await db
    .delete(featureFlagsTable)
    .where(eq(featureFlagsTable.id, Number(req.params.id)));
  res.status(204).end();
});

export default router;
