import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, tenantsTable } from "@autoflow/db";

const router: IRouter = Router();

// ─── Lazy seed demo tenants ───────────────────────────────────────────────────

let seeded = false;

async function ensureTenants() {
  if (seeded) return;
  seeded = true;
  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(tenantsTable);
  if (count > 0) return;
  await db.insert(tenantsTable).values([
    { name: "Acme Corp", slug: "acme", plan: "enterprise", isActive: true },
    { name: "Stark Industries", slug: "stark", plan: "pro", isActive: true },
    { name: "Wayne Enterprises", slug: "wayne", plan: "free", isActive: true },
  ]);
}

// ─── List tenants ─────────────────────────────────────────────────────────────

router.get("/tenants", async (_req, res): Promise<void> => {
  await ensureTenants();
  const rows = await db.select().from(tenantsTable).orderBy(tenantsTable.id);
  res.json(rows.map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    plan: t.plan,
    isActive: t.isActive,
    settings: t.settings ?? null,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  })));
});

// ─── Get tenant ───────────────────────────────────────────────────────────────

router.get("/tenants/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const [t] = await db.select().from(tenantsTable).where(eq(tenantsTable.id, id));
  if (!t) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ id: t.id, name: t.name, slug: t.slug, plan: t.plan, isActive: t.isActive, settings: t.settings ?? null, createdAt: t.createdAt.toISOString(), updatedAt: t.updatedAt.toISOString() });
});

// ─── Create tenant ────────────────────────────────────────────────────────────

router.post("/tenants", async (req, res): Promise<void> => {
  const { name, slug, plan = "free", isActive = true, settings = {} } = req.body as {
    name: string; slug: string; plan?: string; isActive?: boolean; settings?: Record<string, unknown>;
  };
  if (!name?.trim() || !slug?.trim()) { res.status(400).json({ error: "name and slug are required" }); return; }
  const [t] = await db.insert(tenantsTable).values({ name: name.trim(), slug: slug.trim(), plan, isActive, settings }).returning();
  res.status(201).json({ id: t.id, name: t.name, slug: t.slug, plan: t.plan, isActive: t.isActive, settings: t.settings ?? null, createdAt: t.createdAt.toISOString(), updatedAt: t.updatedAt.toISOString() });
});

// ─── Update tenant ────────────────────────────────────────────────────────────

router.patch("/tenants/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const { name, slug, plan, isActive, settings } = req.body as Partial<{ name: string; slug: string; plan: string; isActive: boolean; settings: Record<string, unknown> }>;
  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name.trim();
  if (slug !== undefined) updates.slug = slug.trim();
  if (plan !== undefined) updates.plan = plan;
  if (isActive !== undefined) updates.isActive = isActive;
  if (settings !== undefined) updates.settings = settings;
  const [t] = await db.update(tenantsTable).set(updates).where(eq(tenantsTable.id, id)).returning();
  if (!t) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ id: t.id, name: t.name, slug: t.slug, plan: t.plan, isActive: t.isActive, settings: t.settings ?? null, createdAt: t.createdAt.toISOString(), updatedAt: t.updatedAt.toISOString() });
});

// ─── Delete tenant ────────────────────────────────────────────────────────────

router.delete("/tenants/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  await db.delete(tenantsTable).where(eq(tenantsTable.id, id));
  res.status(204).end();
});

export default router;
