import { Router, type IRouter } from "express";
import { eq, sql, and } from "drizzle-orm";
import { db, rolesTable, permissionsTable, rolePermissionsTable, userRolesTable, tenantsTable } from "@workspace/db";

const router: IRouter = Router();

// ─── Lazy seed system permissions + roles ────────────────────────────────────

let seeded = false;

const SYSTEM_PERMISSIONS = [
  { resource: "workflows", action: "read", description: "View workflows" },
  { resource: "workflows", action: "write", description: "Create and edit workflows" },
  { resource: "workflows", action: "run", description: "Execute workflows" },
  { resource: "workflows", action: "delete", description: "Delete workflows" },
  { resource: "connectors", action: "read", description: "View connectors" },
  { resource: "connectors", action: "install", description: "Install connectors" },
  { resource: "apps", action: "read", description: "View internal apps" },
  { resource: "apps", action: "write", description: "Create and edit apps" },
  { resource: "apps", action: "delete", description: "Delete apps" },
  { resource: "credentials", action: "read", description: "View credentials" },
  { resource: "credentials", action: "write", description: "Manage credentials" },
  { resource: "analytics", action: "read", description: "View analytics" },
  { resource: "billing", action: "read", description: "View billing" },
  { resource: "billing", action: "write", description: "Manage billing" },
  { resource: "users", action: "read", description: "View users" },
  { resource: "users", action: "write", description: "Manage users" },
  { resource: "tenants", action: "admin", description: "Administer tenants" },
];

async function ensureRbacSeed() {
  if (seeded) return;
  seeded = true;
  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(permissionsTable);
  if (count > 0) return;

  const insertedPerms = await db.insert(permissionsTable).values(SYSTEM_PERMISSIONS).returning();

  const adminRole = (await db.insert(rolesTable).values({ name: "Admin", description: "Full platform access" }).returning())[0];
  const editorRole = (await db.insert(rolesTable).values({ name: "Editor", description: "Create and run workflows and apps" }).returning())[0];
  const viewerRole = (await db.insert(rolesTable).values({ name: "Viewer", description: "Read-only access" }).returning())[0];

  const permMap = Object.fromEntries(insertedPerms.map((p) => [`${p.resource}:${p.action}`, p.id]));

  const adminPerms = insertedPerms.map((p) => ({ roleId: adminRole.id, permissionId: p.id }));
  const editorPerms = ["workflows:read", "workflows:write", "workflows:run", "connectors:read", "apps:read", "apps:write", "credentials:read", "analytics:read"].map((k) => ({ roleId: editorRole.id, permissionId: permMap[k] })).filter((r) => r.permissionId != null);
  const viewerPerms = ["workflows:read", "connectors:read", "apps:read", "analytics:read"].map((k) => ({ roleId: viewerRole.id, permissionId: permMap[k] })).filter((r) => r.permissionId != null);

  if (adminPerms.length) await db.insert(rolePermissionsTable).values(adminPerms).onConflictDoNothing();
  if (editorPerms.length) await db.insert(rolePermissionsTable).values(editorPerms).onConflictDoNothing();
  if (viewerPerms.length) await db.insert(rolePermissionsTable).values(viewerPerms).onConflictDoNothing();
}

// ─── Permissions ──────────────────────────────────────────────────────────────

router.get("/permissions", async (_req, res): Promise<void> => {
  await ensureRbacSeed();
  const rows = await db.select().from(permissionsTable).orderBy(permissionsTable.resource, permissionsTable.action);
  res.json(rows.map((p) => ({ id: p.id, resource: p.resource, action: p.action, description: p.description ?? null, createdAt: p.createdAt.toISOString() })));
});

// ─── Roles ────────────────────────────────────────────────────────────────────

router.get("/roles", async (req, res): Promise<void> => {
  await ensureRbacSeed();
  const tenantId = req.query.tenantId ? Number(req.query.tenantId) : undefined;

  const rows = await db.select().from(rolesTable)
    .where(tenantId !== undefined ? eq(rolesTable.tenantId, tenantId) : undefined)
    .orderBy(rolesTable.id);

  const withCounts = await Promise.all(rows.map(async (role) => {
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(rolePermissionsTable).where(eq(rolePermissionsTable.roleId, role.id));
    return { id: role.id, name: role.name, description: role.description ?? null, tenantId: role.tenantId ?? null, permissionCount: count, createdAt: role.createdAt.toISOString() };
  }));

  res.json(withCounts);
});

router.post("/roles", async (req, res): Promise<void> => {
  const { name, description, tenantId } = req.body as { name: string; description?: string; tenantId?: number };
  if (!name?.trim()) { res.status(400).json({ error: "name is required" }); return; }
  const [role] = await db.insert(rolesTable).values({ name: name.trim(), description, tenantId }).returning();
  res.status(201).json({ id: role.id, name: role.name, description: role.description ?? null, tenantId: role.tenantId ?? null, permissionCount: 0, createdAt: role.createdAt.toISOString() });
});

router.get("/roles/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const [role] = await db.select().from(rolesTable).where(eq(rolesTable.id, id));
  if (!role) { res.status(404).json({ error: "Not found" }); return; }

  const permRows = await db
    .select({ id: permissionsTable.id, resource: permissionsTable.resource, action: permissionsTable.action, description: permissionsTable.description, createdAt: permissionsTable.createdAt })
    .from(rolePermissionsTable)
    .innerJoin(permissionsTable, eq(rolePermissionsTable.permissionId, permissionsTable.id))
    .where(eq(rolePermissionsTable.roleId, id));

  res.json({
    id: role.id, name: role.name, description: role.description ?? null, tenantId: role.tenantId ?? null,
    createdAt: role.createdAt.toISOString(),
    permissions: permRows.map((p) => ({ id: p.id, resource: p.resource, action: p.action, description: p.description ?? null, createdAt: p.createdAt.toISOString() })),
  });
});

router.patch("/roles/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const { name, description, tenantId } = req.body as Partial<{ name: string; description: string; tenantId: number }>;
  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name.trim();
  if (description !== undefined) updates.description = description;
  if (tenantId !== undefined) updates.tenantId = tenantId;
  const [role] = await db.update(rolesTable).set(updates).where(eq(rolesTable.id, id)).returning();
  if (!role) { res.status(404).json({ error: "Not found" }); return; }
  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(rolePermissionsTable).where(eq(rolePermissionsTable.roleId, id));
  res.json({ id: role.id, name: role.name, description: role.description ?? null, tenantId: role.tenantId ?? null, permissionCount: count, createdAt: role.createdAt.toISOString() });
});

router.delete("/roles/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  await db.delete(rolePermissionsTable).where(eq(rolePermissionsTable.roleId, id));
  await db.delete(userRolesTable).where(eq(userRolesTable.roleId, id));
  await db.delete(rolesTable).where(eq(rolesTable.id, id));
  res.status(204).end();
});

// ─── Role ↔ Permission ────────────────────────────────────────────────────────

router.put("/roles/:id/permissions/:permissionId", async (req, res): Promise<void> => {
  const roleId = Number(req.params.id);
  const permissionId = Number(req.params.permissionId);
  await db.insert(rolePermissionsTable).values({ roleId, permissionId }).onConflictDoNothing();
  res.status(204).end();
});

router.delete("/roles/:id/permissions/:permissionId", async (req, res): Promise<void> => {
  const roleId = Number(req.params.id);
  const permissionId = Number(req.params.permissionId);
  await db.delete(rolePermissionsTable).where(and(eq(rolePermissionsTable.roleId, roleId), eq(rolePermissionsTable.permissionId, permissionId)));
  res.status(204).end();
});

// ─── User Role Assignments ────────────────────────────────────────────────────

router.get("/user-roles", async (req, res): Promise<void> => {
  const userId = req.query.userId as string | undefined;
  const tenantId = req.query.tenantId ? Number(req.query.tenantId) : undefined;

  const rows = await db
    .select({
      id: userRolesTable.id,
      userId: userRolesTable.userId,
      roleId: userRolesTable.roleId,
      roleName: rolesTable.name,
      tenantId: userRolesTable.tenantId,
      createdAt: userRolesTable.createdAt,
    })
    .from(userRolesTable)
    .innerJoin(rolesTable, eq(userRolesTable.roleId, rolesTable.id))
    .where(
      userId ? eq(userRolesTable.userId, userId) :
      tenantId !== undefined ? eq(userRolesTable.tenantId, tenantId) :
      undefined
    )
    .orderBy(userRolesTable.id);

  const withTenants = await Promise.all(rows.map(async (r) => {
    let tenantName: string | null = null;
    if (r.tenantId) {
      const [t] = await db.select({ name: tenantsTable.name }).from(tenantsTable).where(eq(tenantsTable.id, r.tenantId));
      tenantName = t?.name ?? null;
    }
    return { id: r.id, userId: r.userId, roleId: r.roleId, roleName: r.roleName, tenantId: r.tenantId ?? null, tenantName, createdAt: r.createdAt.toISOString() };
  }));

  res.json(withTenants);
});

router.post("/user-roles", async (req, res): Promise<void> => {
  const { userId, roleId, tenantId } = req.body as { userId: string; roleId: number; tenantId?: number };
  if (!userId?.trim() || !roleId) { res.status(400).json({ error: "userId and roleId are required" }); return; }
  const [row] = await db.insert(userRolesTable).values({ userId: userId.trim(), roleId, tenantId }).returning();
  const [role] = await db.select({ name: rolesTable.name }).from(rolesTable).where(eq(rolesTable.id, roleId));
  let tenantName: string | null = null;
  if (tenantId) {
    const [t] = await db.select({ name: tenantsTable.name }).from(tenantsTable).where(eq(tenantsTable.id, tenantId));
    tenantName = t?.name ?? null;
  }
  res.status(201).json({ id: row.id, userId: row.userId, roleId: row.roleId, roleName: role?.name ?? "", tenantId: row.tenantId ?? null, tenantName, createdAt: row.createdAt.toISOString() });
});

router.delete("/user-roles/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  await db.delete(userRolesTable).where(eq(userRolesTable.id, id));
  res.status(204).end();
});

export default router;
