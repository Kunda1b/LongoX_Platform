import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, regionPoliciesTable } from "@longox/db";

const router: IRouter = Router();

let seeded = false;
async function ensureRegions() {
  if (seeded) return;
  seeded = true;
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(regionPoliciesTable);
  if (count > 0) return;
  await db.insert(regionPoliciesTable).values([
    {
      name: "US East Primary",
      region: "us-east-1",
      tier: "premium",
      replicationFactor: 3,
      notes: "Primary production region. Multi-AZ deployment.",
    },
    {
      name: "US West Failover",
      region: "us-west-2",
      tier: "premium",
      replicationFactor: 2,
      notes: "Hot standby for US East. Failover in < 30s.",
    },
    {
      name: "EU West GDPR",
      region: "eu-west-1",
      tier: "premium",
      replicationFactor: 3,
      notes: "EU data residency zone. GDPR-compliant data processing.",
    },
    {
      name: "APAC Singapore",
      region: "ap-southeast-1",
      tier: "standard",
      replicationFactor: 2,
      notes: "APAC latency zone for SEA customers.",
    },
    {
      name: "EU Central Dev",
      region: "eu-central-1",
      tier: "edge",
      replicationFactor: 1,
      notes: "Low-cost dev/test region in Frankfurt.",
    },
  ]);
}

function fmt(row: typeof regionPoliciesTable.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    region: row.region,
    tier: row.tier,
    replicationFactor: row.replicationFactor,
    notes: row.notes ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

router.get("/region-policies", async (_req, res): Promise<void> => {
  await ensureRegions();
  const rows = await db
    .select()
    .from(regionPoliciesTable)
    .orderBy(regionPoliciesTable.id);
  res.json(rows.map(fmt));
});

router.post("/region-policies", async (req, res): Promise<void> => {
  const {
    name,
    region,
    tier = "standard",
    replicationFactor = 1,
    notes,
  } = req.body as {
    name: string;
    region: string;
    tier?: string;
    replicationFactor?: number;
    notes?: string;
  };
  if (!name?.trim() || !region?.trim()) {
    res.status(400).json({ error: "name and region required" });
    return;
  }
  const [row] = await db
    .insert(regionPoliciesTable)
    .values({
      name: name.trim(),
      region: region.trim(),
      tier,
      replicationFactor,
      notes,
    })
    .returning();
  res.status(201).json(fmt(row));
});

router.patch("/region-policies/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const b = req.body as Partial<{
    name: string;
    region: string;
    tier: string;
    replicationFactor: number;
    notes: string;
  }>;
  const updates: Record<string, unknown> = {};
  if (b.name !== undefined) updates.name = b.name.trim();
  if (b.region !== undefined) updates.region = b.region.trim();
  if (b.tier !== undefined) updates.tier = b.tier;
  if (b.replicationFactor !== undefined)
    updates.replicationFactor = b.replicationFactor;
  if (b.notes !== undefined) updates.notes = b.notes;
  const [row] = await db
    .update(regionPoliciesTable)
    .set(updates)
    .where(eq(regionPoliciesTable.id, id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(fmt(row));
});

router.delete("/region-policies/:id", async (req, res): Promise<void> => {
  await db
    .delete(regionPoliciesTable)
    .where(eq(regionPoliciesTable.id, Number(req.params.id)));
  res.status(204).end();
});

export default router;
