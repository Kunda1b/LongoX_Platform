import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, environmentsTable, workflowPromotionsTable } from "@autoflow/db";

const router: IRouter = Router();

// ─── Lazy seed default environments ──────────────────────────────────────────

let seeded = false;

async function ensureEnvironments() {
  if (seeded) return;
  seeded = true;

  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(environmentsTable);
  if (count > 0) return;

  await db.insert(environmentsTable).values([
    { name: "Development", type: "dev", description: "Local dev environment for testing changes", isDefault: true },
    { name: "Staging", type: "staging", description: "Pre-production environment for QA and review", isDefault: false },
    { name: "Production", type: "prod", description: "Live environment serving end users", isDefault: false },
  ]);
}

// ─── List environments ────────────────────────────────────────────────────────

router.get("/environments", async (_req, res): Promise<void> => {
  await ensureEnvironments();

  const envs = await db.select().from(environmentsTable).orderBy(environmentsTable.id);

  const withCounts = await Promise.all(envs.map(async (env) => {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(workflowPromotionsTable)
      .where(eq(workflowPromotionsTable.toEnvironment, env.type));

    return {
      id: env.id,
      name: env.name,
      type: env.type,
      description: env.description ?? null,
      isDefault: env.isDefault,
      workflowCount: count,
      createdAt: env.createdAt.toISOString(),
    };
  }));

  res.json(withCounts);
});

// ─── Create environment ───────────────────────────────────────────────────────

router.post("/environments", async (req, res): Promise<void> => {
  await ensureEnvironments();

  const body = req.body as { name?: string; type?: string; description?: string };
  if (!body.name || !body.type) {
    res.status(400).json({ error: "name and type are required" });
    return;
  }

  const [env] = await db.insert(environmentsTable).values({
    name: body.name,
    type: body.type,
    description: body.description ?? null,
    isDefault: false,
  }).returning();

  res.status(201).json({
    id: env.id,
    name: env.name,
    type: env.type,
    description: env.description ?? null,
    isDefault: env.isDefault,
    workflowCount: 0,
    createdAt: env.createdAt.toISOString(),
  });
});

// ─── Get environment ──────────────────────────────────────────────────────────

router.get("/environments/:id", async (req, res): Promise<void> => {
  await ensureEnvironments();

  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [env] = await db.select().from(environmentsTable).where(eq(environmentsTable.id, id));
  if (!env) { res.status(404).json({ error: "Not found" }); return; }

  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` })
    .from(workflowPromotionsTable)
    .where(eq(workflowPromotionsTable.toEnvironment, env.type));

  res.json({
    id: env.id,
    name: env.name,
    type: env.type,
    description: env.description ?? null,
    isDefault: env.isDefault,
    workflowCount: count,
    createdAt: env.createdAt.toISOString(),
  });
});

// ─── Update environment ───────────────────────────────────────────────────────

router.patch("/environments/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const body = req.body as { name?: string; type?: string; description?: string };
  const [env] = await db.update(environmentsTable)
    .set({
      ...(body.name && { name: body.name }),
      ...(body.type && { type: body.type }),
      ...(body.description !== undefined && { description: body.description }),
    })
    .where(eq(environmentsTable.id, id))
    .returning();

  if (!env) { res.status(404).json({ error: "Not found" }); return; }

  res.json({
    id: env.id,
    name: env.name,
    type: env.type,
    description: env.description ?? null,
    isDefault: env.isDefault,
    workflowCount: 0,
    createdAt: env.createdAt.toISOString(),
  });
});

// ─── Delete environment ───────────────────────────────────────────────────────

router.delete("/environments/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [env] = await db.select().from(environmentsTable).where(eq(environmentsTable.id, id));
  if (!env) { res.status(404).json({ error: "Not found" }); return; }
  if (env.isDefault) { res.status(400).json({ error: "Cannot delete default environments" }); return; }

  await db.delete(environmentsTable).where(eq(environmentsTable.id, id));
  res.status(204).end();
});

export default router;
