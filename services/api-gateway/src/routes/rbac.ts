import { Router, type IRouter } from "express";
import { eq, sql, and, inArray, isNull } from "drizzle-orm";
import {
  db,
  rolesTable,
  permissionsTable,
  rolePermissionsTable,
  userRolesTable,
  tenantsTable,
  usersTable,
} from "@longox/db";
import { authorize } from "@longox/shared-rbac";

const router: IRouter = Router();

// ─── Lazy seed system permissions + roles ────────────────────────────────────

let seeded = false;

const SYSTEM_PERMISSIONS = [
  { resource: "workflows",   action: "read",    description: "View workflows" },
  { resource: "workflows",   action: "write",   description: "Create and edit workflows" },
  { resource: "workflows",   action: "run",     description: "Execute workflows" },
  { resource: "workflows",   action: "delete",  description: "Delete workflows" },
  { resource: "connectors",  action: "read",    description: "View connectors" },
  { resource: "connectors",  action: "install", description: "Install connectors" },
  { resource: "connectors",  action: "write",   description: "Configure connectors" },
  { resource: "apps",        action: "read",    description: "View internal apps" },
  { resource: "apps",        action: "write",   description: "Create and edit apps" },
  { resource: "apps",        action: "delete",  description: "Delete apps" },
  { resource: "credentials", action: "read",    description: "View credentials" },
  { resource: "credentials", action: "write",   description: "Manage credentials" },
  { resource: "analytics",   action: "read",    description: "View analytics" },
  { resource: "billing",     action: "read",    description: "View billing" },
  { resource: "billing",     action: "write",   description: "Manage billing & subscriptions" },
  { resource: "users",       action: "read",    description: "View users" },
  { resource: "users",       action: "write",   description: "Manage users and roles" },
  { resource: "tenants",     action: "admin",   description: "Delete or transfer workspace" },
  { resource: "templates",   action: "read",    description: "View templates" },
  { resource: "templates",   action: "write",   description: "Manage templates" },
  { resource: "dashboards",  action: "read",    description: "View dashboards" },
  { resource: "dashboards",  action: "write",   description: "Edit dashboards" },
  { resource: "dashboards",  action: "delete",  description: "Delete dashboards" },
  { resource: "ai",          action: "read",    description: "View AI models and prompts" },
  { resource: "ai",          action: "write",   description: "Manage AI prompts and models" },
  { resource: "ai",          action: "run",     description: "Execute AI runs" },
  { resource: "audit",       action: "read",    description: "View audit log" },
  { resource: "executions",  action: "read",    description: "View executions and DLQ" },
  { resource: "executions",  action: "run",     description: "Retry failed executions" },
];

// System role definitions — Owner > Admin > Builder > Viewer
const SYSTEM_ROLES = [
  {
    name: "Owner",
    description: "Workspace owner — full access including billing, workspace deletion, and ownership transfer",
  },
  {
    name: "Admin",
    description: "Workspace administrator — full access except billing and workspace management",
  },
  {
    name: "Builder",
    description: "Power user — create and edit workflows, dashboards, and AI agents",
  },
  {
    name: "Viewer",
    description: "Read-only — view dashboards, workflow runs, and reports",
  },
];

const ROLE_PERMISSIONS: Record<string, string[]> = {
  Owner: SYSTEM_PERMISSIONS.map((p) => `${p.resource}:${p.action}`), // all
  Admin: [
    "workflows:read",    "workflows:write",    "workflows:run",    "workflows:delete",
    "connectors:read",   "connectors:write",   "connectors:install",
    "apps:read",         "apps:write",         "apps:delete",
    "credentials:read",  "credentials:write",
    "analytics:read",
    "billing:read",
    "users:read",        "users:write",
    "templates:read",    "templates:write",
    "dashboards:read",   "dashboards:write",   "dashboards:delete",
    "ai:read",           "ai:write",           "ai:run",
    "audit:read",
    "executions:read",   "executions:run",
  ],
  Builder: [
    "workflows:read",    "workflows:write",    "workflows:run",
    "connectors:read",   "connectors:write",   "connectors:install",
    "apps:read",         "apps:write",
    "credentials:read",
    "analytics:read",
    "templates:read",
    "dashboards:read",   "dashboards:write",
    "ai:read",           "ai:write",           "ai:run",
    "executions:read",   "executions:run",
  ],
  Viewer: [
    "workflows:read",
    "connectors:read",
    "apps:read",
    "analytics:read",
    "templates:read",
    "dashboards:read",
    "ai:read",
    "executions:read",
  ],
};

async function ensureRbacSeed() {
  if (seeded) return;
  seeded = true;

  // 1. Upsert permissions — get existing, insert only missing ones
  const existingPerms = await db.select().from(permissionsTable);
  const permMap: Record<string, string> = Object.fromEntries(
    existingPerms.map((p) => [`${p.resource}:${p.action}`, p.id]),
  );
  const missingPerms = SYSTEM_PERMISSIONS.filter(
    (p) => !permMap[`${p.resource}:${p.action}`],
  );
  if (missingPerms.length > 0) {
    const inserted = await db
      .insert(permissionsTable)
      .values(missingPerms)
      .returning();
    for (const p of inserted) permMap[`${p.resource}:${p.action}`] = p.id;
  }

  // 2. Upsert system roles — insert only roles that don't exist yet
  const existingRoles = await db
    .select()
    .from(rolesTable)
    .where(isNull(rolesTable.tenantId));
  const roleMap: Record<string, string> = Object.fromEntries(
    existingRoles.map((r) => [r.name, r.id]),
  );
  for (const roleDef of SYSTEM_ROLES) {
    if (!roleMap[roleDef.name]) {
      const [inserted] = await db
        .insert(rolesTable)
        .values(roleDef)
        .returning();
      roleMap[roleDef.name] = inserted.id;
    }
  }

  // 3. Assign permissions to each role (idempotent via unique constraint)
  const assignments: { roleId: string; permissionId: string }[] = [];
  for (const [roleName, permKeys] of Object.entries(ROLE_PERMISSIONS)) {
    const roleId = roleMap[roleName];
    if (!roleId) continue;
    for (const key of permKeys) {
      const permId = permMap[key];
      if (permId) assignments.push({ roleId, permissionId: permId });
    }
  }
  if (assignments.length > 0) {
    await db
      .insert(rolePermissionsTable)
      .values(assignments)
      .onConflictDoNothing();
  }
}

// ─── Permissions ──────────────────────────────────────────────────────────────

router.get("/permissions", authorize({ resource: "users", action: "write" }), async (_req, res): Promise<void> => {
  await ensureRbacSeed();
  const rows = await db
    .select()
    .from(permissionsTable)
    .orderBy(permissionsTable.resource, permissionsTable.action);
  res.json(
    rows.map((p) => ({
      id: p.id,
      resource: p.resource,
      action: p.action,
      description: p.description ?? null,
      createdAt: p.createdAt.toISOString(),
    })),
  );
});

// ─── Roles ────────────────────────────────────────────────────────────────────

router.get("/roles", authorize({ resource: "users", action: "write" }), async (req, res): Promise<void> => {
  await ensureRbacSeed();
  const tenantId = req.query.tenantId ? String(req.query.tenantId) : undefined;

  const rows = await db
    .select()
    .from(rolesTable)
    .where(
      tenantId !== undefined ? eq(rolesTable.tenantId, tenantId) : undefined,
    )
    .orderBy(rolesTable.id);

  const withCounts = await Promise.all(
    rows.map(async (role) => {
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(rolePermissionsTable)
        .where(eq(rolePermissionsTable.roleId, role.id));
      return {
        id: role.id,
        name: role.name,
        description: role.description ?? null,
        tenantId: role.tenantId ?? null,
        permissionCount: count,
        createdAt: role.createdAt.toISOString(),
      };
    }),
  );

  res.json(withCounts);
});

router.post("/roles", authorize({ resource: "users", action: "write" }), async (req, res): Promise<void> => {
  const { name, description, tenantId } = req.body as {
    name: string;
    description?: string;
    tenantId?: string;
  };
  if (!name?.trim()) {
    res.status(400).json({ error: "name is required" });
    return;
  }
  const [role] = await db
    .insert(rolesTable)
    .values({ name: name.trim(), description, tenantId })
    .returning();
  res.status(201).json({
    id: role.id,
    name: role.name,
    description: role.description ?? null,
    tenantId: role.tenantId ?? null,
    permissionCount: 0,
    createdAt: role.createdAt.toISOString(),
  });
});

router.get("/roles/:id", authorize({ resource: "users", action: "write" }), async (req, res): Promise<void> => {
  const id = String(req.params.id);
  const [role] = await db
    .select()
    .from(rolesTable)
    .where(eq(rolesTable.id, id));
  if (!role) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const permRows = await db
    .select({
      id: permissionsTable.id,
      resource: permissionsTable.resource,
      action: permissionsTable.action,
      description: permissionsTable.description,
      createdAt: permissionsTable.createdAt,
    })
    .from(rolePermissionsTable)
    .innerJoin(
      permissionsTable,
      eq(rolePermissionsTable.permissionId, permissionsTable.id),
    )
    .where(eq(rolePermissionsTable.roleId, id));

  res.json({
    id: role.id,
    name: role.name,
    description: role.description ?? null,
    tenantId: role.tenantId ?? null,
    createdAt: role.createdAt.toISOString(),
    permissions: permRows.map((p) => ({
      id: p.id,
      resource: p.resource,
      action: p.action,
      description: p.description ?? null,
      createdAt: p.createdAt.toISOString(),
    })),
  });
});

router.patch("/roles/:id", authorize({ resource: "users", action: "write" }), async (req, res): Promise<void> => {
  const id = String(req.params.id);
  const { name, description, tenantId } = req.body as Partial<{
    name: string;
    description: string;
    tenantId: string;
  }>;
  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name.trim();
  if (description !== undefined) updates.description = description;
  if (tenantId !== undefined) updates.tenantId = tenantId;
  const [role] = await db
    .update(rolesTable)
    .set(updates)
    .where(eq(rolesTable.id, id))
    .returning();
  if (!role) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(rolePermissionsTable)
    .where(eq(rolePermissionsTable.roleId, id));
  res.json({
    id: role.id,
    name: role.name,
    description: role.description ?? null,
    tenantId: role.tenantId ?? null,
    permissionCount: count,
    createdAt: role.createdAt.toISOString(),
  });
});

router.delete("/roles/:id", authorize({ resource: "users", action: "write" }), async (req, res): Promise<void> => {
  const id = String(req.params.id);
  await db
    .delete(rolePermissionsTable)
    .where(eq(rolePermissionsTable.roleId, id));
  await db.delete(userRolesTable).where(eq(userRolesTable.roleId, id));
  await db.delete(rolesTable).where(eq(rolesTable.id, id));
  res.status(204).end();
});

// ─── Role ↔ Permission ────────────────────────────────────────────────────────

router.put(
  "/roles/:id/permissions/:permissionId",
  authorize({ resource: "users", action: "write" }),
  async (req, res): Promise<void> => {
    const roleId = String(req.params.id);
    const permissionId = String(req.params.permissionId);
    await db
      .insert(rolePermissionsTable)
      .values({ roleId, permissionId })
      .onConflictDoNothing();
    res.status(204).end();
  },
);

router.delete(
  "/roles/:id/permissions/:permissionId",
  authorize({ resource: "users", action: "write" }),
  async (req, res): Promise<void> => {
    const roleId = String(req.params.id);
    const permissionId = String(req.params.permissionId);
    await db
      .delete(rolePermissionsTable)
      .where(
        and(
          eq(rolePermissionsTable.roleId, roleId),
          eq(rolePermissionsTable.permissionId, permissionId),
        ),
      );
    res.status(204).end();
  },
);

// ─── User Role Assignments ────────────────────────────────────────────────────

router.get("/user-roles", authorize({ resource: "users", action: "write" }), async (req, res): Promise<void> => {
  const userId = req.query.userId as string | undefined;
  const tenantId = req.query.tenantId ? String(req.query.tenantId) : undefined;

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
      userId
        ? eq(userRolesTable.userId, userId)
        : tenantId !== undefined
          ? eq(userRolesTable.tenantId, tenantId)
          : undefined,
    )
    .orderBy(userRolesTable.id);

  const withTenants = await Promise.all(
    rows.map(async (r) => {
      let tenantName: string | null = null;
      if (r.tenantId) {
        const [t] = await db
          .select({ name: tenantsTable.name })
          .from(tenantsTable)
          .where(eq(tenantsTable.id, r.tenantId));
        tenantName = t?.name ?? null;
      }
      return {
        id: r.id,
        userId: r.userId,
        roleId: r.roleId,
        roleName: r.roleName,
        tenantId: r.tenantId ?? null,
        tenantName,
        createdAt: r.createdAt.toISOString(),
      };
    }),
  );

  res.json(withTenants);
});

router.post("/user-roles", authorize({ resource: "users", action: "write" }), async (req, res): Promise<void> => {
  const { userId, roleId, tenantId } = req.body as {
    userId: string;
    roleId: string;
    tenantId?: string;
  };
  if (!userId?.trim() || !roleId) {
    res.status(400).json({ error: "userId and roleId are required" });
    return;
  }
  const [row] = await db
    .insert(userRolesTable)
    .values({ userId: userId.trim(), roleId, tenantId })
    .returning();
  const [role] = await db
    .select({ name: rolesTable.name })
    .from(rolesTable)
    .where(eq(rolesTable.id, roleId));
  let tenantName: string | null = null;
  if (tenantId) {
    const [t] = await db
      .select({ name: tenantsTable.name })
      .from(tenantsTable)
      .where(eq(tenantsTable.id, tenantId));
    tenantName = t?.name ?? null;
  }
  res.status(201).json({
    id: row.id,
    userId: row.userId,
    roleId: row.roleId,
    roleName: role?.name ?? "",
    tenantId: row.tenantId ?? null,
    tenantName,
    createdAt: row.createdAt.toISOString(),
  });
});

router.delete("/user-roles/:id", authorize({ resource: "users", action: "write" }), async (req, res): Promise<void> => {
  const id = String(req.params.id);
  await db.delete(userRolesTable).where(eq(userRolesTable.id, id));
  res.status(204).end();
});

// ─── Workspace Members ────────────────────────────────────────────────────────

router.get("/members", authorize({ resource: "users", action: "read" }), async (req, res): Promise<void> => {
  await ensureRbacSeed();
  const tenantId = req.tenantId as string;

  const members = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      avatarUrl: usersTable.avatarUrl,
      isActive: usersTable.isActive,
      createdAt: usersTable.createdAt,
      lastLoginAt: usersTable.lastLoginAt,
    })
    .from(usersTable)
    .where(eq(usersTable.tenantId, tenantId))
    .orderBy(usersTable.createdAt);

  const userIds = members.map((m) => String(m.id));
  const roleAssignments =
    userIds.length > 0
      ? await db
          .select({
            userId: userRolesTable.userId,
            roleId: rolesTable.id,
            roleName: rolesTable.name,
            roleDescription: rolesTable.description,
          })
          .from(userRolesTable)
          .innerJoin(rolesTable, eq(userRolesTable.roleId, rolesTable.id))
          .where(inArray(userRolesTable.userId, userIds))
      : [];

  const roleByUser: Record<string, { id: string; name: string; description: string | null }> = {};
  for (const r of roleAssignments) {
    roleByUser[r.userId] = { id: r.roleId, name: r.roleName, description: r.roleDescription ?? null };
  }

  res.json(
    members.map((m) => ({
      userId: String(m.id),
      name: m.name,
      email: m.email,
      avatarUrl: m.avatarUrl ?? null,
      isActive: m.isActive,
      joinedAt: m.createdAt.toISOString(),
      lastLoginAt: m.lastLoginAt?.toISOString() ?? null,
      role: roleByUser[String(m.id)] ?? null,
    })),
  );
});

router.put("/members/:userId/role", authorize({ resource: "users", action: "write" }), async (req, res): Promise<void> => {
  await ensureRbacSeed();
  const { userId } = req.params;
  const { roleId } = req.body as { roleId: string };
  const tenantId = req.tenantId as string;

  const [user] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(and(eq(usersTable.id, String(userId)), eq(usersTable.tenantId, tenantId)));

  if (!user) {
    res.status(404).json({ error: "User not found in this workspace" });
    return;
  }

  const [role] = await db.select().from(rolesTable).where(eq(rolesTable.id, roleId));
  if (!role) {
    res.status(404).json({ error: "Role not found" });
    return;
  }

  await db.delete(userRolesTable).where(
    and(eq(userRolesTable.userId, userId as string), eq(userRolesTable.tenantId, tenantId)),
  );

  const [assignment] = await db
    .insert(userRolesTable)
    .values({ userId: userId as string, roleId, tenantId })
    .returning();

  res.json({
    userId,
    roleId: assignment.roleId,
    roleName: role.name,
    roleDescription: role.description ?? null,
    tenantId: assignment.tenantId,
    createdAt: assignment.createdAt.toISOString(),
  });
});

export default router;
