import { Router, type IRouter } from "express";
import { prisma } from "@longox/db/prisma";
import { authorize } from "@longox/shared-rbac";

const router: IRouter = Router();

// ─── Lazy seed demo tenants ───────────────────────────────────────────────────

let seeded = false;

async function ensureTenants() {
  if (seeded) return;
  seeded = true;
  const count = await prisma.tenant.count();
  if (count > 0) return;
  await prisma.tenant.createMany({
    data: [
      {
        name: "Acme Corp",
        slug: "acme",
        planId: "enterprise",
        status: "active",
      } as any,
      {
        name: "Stark Industries",
        slug: "stark",
        planId: "pro",
        status: "active",
      } as any,
      {
        name: "Wayne Enterprises",
        slug: "wayne",
        planId: "free",
        status: "active",
      } as any,
    ],
  });
}

// ─── List tenants ─────────────────────────────────────────────────────────────

router.get(
  "/tenants",
  authorize({ resource: "tenants", action: "admin" }),
  async (_req, res): Promise<void> => {
    await ensureTenants();
    const rows = (await prisma.tenant.findMany({
      orderBy: { id: "asc" },
    })) as any[];
    res.json(
      rows.map((t) => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        plan: t.planId ?? t.plan,
        isActive: t.status === "active" ? true : t.isActive,
        settings: t.settings ?? null,
        createdAt:
          t.createdAt instanceof Date
            ? t.createdAt.toISOString()
            : new Date(t.createdAt).toISOString(),
        updatedAt:
          t.updatedAt instanceof Date
            ? t.updatedAt.toISOString()
            : new Date(t.updatedAt).toISOString(),
      })),
    );
  },
);

// ─── Get tenant ───────────────────────────────────────────────────────────────

router.get(
  "/tenants/:id",
  authorize({ resource: "tenants", action: "admin" }),
  async (req, res): Promise<void> => {
    const id = String(req.params.id);
    const t = (await prisma.tenant.findUnique({ where: { id } })) as any;
    if (!t) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json({
      id: t.id,
      name: t.name,
      slug: t.slug,
      plan: t.planId ?? t.plan,
      isActive: t.status === "active" ? true : t.isActive,
      settings: t.settings ?? null,
      createdAt:
        t.createdAt instanceof Date
          ? t.createdAt.toISOString()
          : new Date(t.createdAt).toISOString(),
      updatedAt:
        t.updatedAt instanceof Date
          ? t.updatedAt.toISOString()
          : new Date(t.updatedAt).toISOString(),
    });
  },
);

// ─── Create tenant ────────────────────────────────────────────────────────────

router.post(
  "/tenants",
  authorize({ resource: "tenants", action: "admin" }),
  async (req, res): Promise<void> => {
    const {
      name,
      slug,
      plan = "free",
      isActive = true,
      settings = {},
    } = req.body as {
      name: string;
      slug: string;
      plan?: string;
      isActive?: boolean;
      settings?: Record<string, unknown>;
    };
    if (!name?.trim() || !slug?.trim()) {
      res.status(400).json({ error: "name and slug are required" });
      return;
    }
    const t = (await prisma.tenant.create({
      data: {
        name: name.trim(),
        slug: slug.trim(),
        planId: plan,
        status: isActive ? "active" : "suspended",
        settings,
      } as any,
    })) as any;
    res.status(201).json({
      id: t.id,
      name: t.name,
      slug: t.slug,
      plan: t.planId ?? t.plan,
      isActive: t.status === "active" ? true : t.isActive,
      settings: t.settings ?? null,
      createdAt:
        t.createdAt instanceof Date
          ? t.createdAt.toISOString()
          : new Date(t.createdAt).toISOString(),
      updatedAt:
        t.updatedAt instanceof Date
          ? t.updatedAt.toISOString()
          : new Date(t.updatedAt).toISOString(),
    });
  },
);

// ─── Update tenant ────────────────────────────────────────────────────────────

router.patch(
  "/tenants/:id",
  authorize({ resource: "tenants", action: "admin" }),
  async (req, res): Promise<void> => {
    const id = String(req.params.id);
    const { name, slug, plan, isActive, settings } = req.body as Partial<{
      name: string;
      slug: string;
      plan: string;
      isActive: boolean;
      settings: Record<string, unknown>;
    }>;
    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name.trim();
    if (slug !== undefined) updates.slug = slug.trim();
    if (plan !== undefined) updates.planId = plan;
    if (isActive !== undefined)
      updates.status = isActive ? "active" : "suspended";
    if (settings !== undefined) updates.settings = settings;
    const t = (await prisma.tenant.update({
      where: { id },
      data: updates as any,
    })) as any;
    if (!t) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json({
      id: t.id,
      name: t.name,
      slug: t.slug,
      plan: t.planId ?? t.plan,
      isActive: t.status === "active" ? true : t.isActive,
      settings: t.settings ?? null,
      createdAt:
        t.createdAt instanceof Date
          ? t.createdAt.toISOString()
          : new Date(t.createdAt).toISOString(),
      updatedAt:
        t.updatedAt instanceof Date
          ? t.updatedAt.toISOString()
          : new Date(t.updatedAt).toISOString(),
    });
  },
);

// ─── Delete tenant ────────────────────────────────────────────────────────────

router.delete(
  "/tenants/:id",
  authorize({ resource: "tenants", action: "admin" }),
  async (req, res): Promise<void> => {
    const id = String(req.params.id);
    await prisma.tenant.delete({ where: { id } });
    res.status(204).end();
  },
);

export default router;
