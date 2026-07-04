import { Router, type IRouter } from "express";
import { prisma } from "@longox/db/prisma";
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
  const existingPerms = (await prisma.rbacPermission.findMany()) as any[];
  const permMap: Record<string, string> = Object.fromEntries(
    existingPerms.map((p) => [`${p.resource ?? p.code}:${p.action ?? ""}`, p.id]),
  );
  const missingPerms = SYSTEM_PERMISSIONS.filter(
    (p) => !permMap[`${p.resource}:${p.action}`],
  );
  for (const p of missingPerms) {
    const created = (await prisma.rbacPermission.create({
      data: {
        code: `${p.resource}:${p.action}`,
        description: p.description,
        resource: p.resource,
        action: p.action,
      } as any,
    })) as any;
    permMap[`${p.resource}:${p.action}`] = created.id;
  }

  // 2. Upsert system roles — insert only roles that don't exist yet
  const existingRoles = (await prisma.rbacRole.findMany({
    where: { tenantId: null },
  })) as any[];
  const roleMap: Record<string, string> = Object.fromEntries(
    existingRoles.map((r) => [r.name, r.id]),
  );
  for (const roleDef of SYSTEM_ROLES) {
    if (!roleMap[roleDef.name]) {
      const inserted = (await prisma.rbacRole.create({
        data: {
          name: roleDef.name,
          description: roleDef.description,
          scope: "tenant",
        } as any,
      })) as any;
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
  for (const a of assignments) {
    await prisma.rolePermission
      .create({ data: a })
      .catch(() => {
        // Ignore unique-constraint conflicts (onConflictDoNothing)
      });
  }
}

// ─── Permissions ──────────────────────────────────────────────────────────────

router.get("/permissions", authorize({ resource: "users", action: "write" }), async (_req, res): Promise<void> => {
  await ensureRbacSeed();
  const rows = (await prisma.rbacPermission.findMany({
    orderBy: [{ resource: "asc" } as any, { action: "asc" } as any],
  })) as any[];
  res.json(
    rows.map((p) => ({
      id: p.id,
      resource: p.resource ?? (p.code?.split(":")[0] ?? ""),
      action: p.action ?? (p.code?.split(":")[1] ?? ""),
      description: p.description ?? null,
      createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : new Date(p.createdAt).toISOString(),
    })),
  );
});

// ─── Roles ────────────────────────────────────────────────────────────────────

router.get("/roles", authorize({ resource: "users", action: "write" }), async (req, res): Promise<void> => {
  await ensureRbacSeed();
  const tenantId = req.query.tenantId ? String(req.query.tenantId) : undefined;

  const rows = (await prisma.rbacRole.findMany({
    where: tenantId !== undefined ? { tenantId } : undefined,
    orderBy: { id: "asc" },
  })) as any[];

  const withCounts = await Promise.all(
    rows.map(async (role) => {
      const count = await prisma.rolePermission.count({
        where: { roleId: role.id },
      });
      return {
        id: role.id,
        name: role.name,
        description: (role as any).description ?? null,
        tenantId: role.tenantId ?? null,
        permissionCount: count,
        createdAt: role.createdAt instanceof Date ? role.createdAt.toISOString() : new Date(role.createdAt).toISOString(),
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
  const role = (await prisma.rbacRole.create({
    data: {
      name: name.trim(),
      description,
      tenantId,
      scope: "tenant",
    } as any,
  })) as any;
  res.status(201).json({
    id: role.id,
    name: role.name,
    description: role.description ?? null,
    tenantId: role.tenantId ?? null,
    permissionCount: 0,
    createdAt: role.createdAt instanceof Date ? role.createdAt.toISOString() : new Date(role.createdAt).toISOString(),
  });
});

router.get("/roles/:id", authorize({ resource: "users", action: "write" }), async (req, res): Promise<void> => {
  const id = String(req.params.id);
  const role = (await prisma.rbacRole.findUnique({ where: { id } })) as any;
  if (!role) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const rolePerms = (await prisma.rolePermission.findMany({
    where: { roleId: id },
    include: { permission: true } as any,
  })) as any[];

  const permRows = rolePerms.map((rp) => rp.permission).filter(Boolean) as any[];

  res.json({
    id: role.id,
    name: role.name,
    description: (role as any).description ?? null,
    tenantId: role.tenantId ?? null,
    createdAt: role.createdAt instanceof Date ? role.createdAt.toISOString() : new Date(role.createdAt).toISOString(),
    permissions: permRows.map((p) => ({
      id: p.id,
      resource: p.resource ?? (p.code?.split(":")[0] ?? ""),
      action: p.action ?? (p.code?.split(":")[1] ?? ""),
      description: p.description ?? null,
      createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : new Date(p.createdAt).toISOString(),
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
  const role = (await prisma.rbacRole.update({
    where: { id },
    data: updates as any,
  })) as any;
  if (!role) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const count = await prisma.rolePermission.count({
    where: { roleId: id },
  });
  res.json({
    id: role.id,
    name: role.name,
    description: (role as any).description ?? null,
    tenantId: role.tenantId ?? null,
    permissionCount: count,
    createdAt: role.createdAt instanceof Date ? role.createdAt.toISOString() : new Date(role.createdAt).toISOString(),
  });
});

router.delete("/roles/:id", authorize({ resource: "users", action: "write" }), async (req, res): Promise<void> => {
  const id = String(req.params.id);
  await prisma.rolePermission.deleteMany({ where: { roleId: id } });
  // userRolesTable → membership
  await prisma.membership.deleteMany({ where: { roleId: id } as any });
  await prisma.rbacRole.delete({ where: { id } });
  res.status(204).end();
});

// ─── Role ↔ Permission ────────────────────────────────────────────────────────

router.put(
  "/roles/:id/permissions/:permissionId",
  authorize({ resource: "users", action: "write" }),
  async (req, res): Promise<void> => {
    const roleId = String(req.params.id);
    const permissionId = String(req.params.permissionId);
    await prisma.rolePermission
      .create({ data: { roleId, permissionId } })
      .catch(() => {
        // Ignore unique-constraint conflicts (onConflictDoNothing)
      });
    res.status(204).end();
  },
);

router.delete(
  "/roles/:id/permissions/:permissionId",
  authorize({ resource: "users", action: "write" }),
  async (req, res): Promise<void> => {
    const roleId = String(req.params.id);
    const permissionId = String(req.params.permissionId);
    await prisma.rolePermission.deleteMany({
      where: { roleId, permissionId },
    });
    res.status(204).end();
  },
);

// ─── User Role Assignments ────────────────────────────────────────────────────

router.get("/user-roles", authorize({ resource: "users", action: "write" }), async (req, res): Promise<void> => {
  const userId = req.query.userId as string | undefined;
  const tenantId = req.query.tenantId ? String(req.query.tenantId) : undefined;

  const where: any = {};
  if (userId) where.userId = userId;
  else if (tenantId !== undefined) where.tenantId = tenantId;

  const rows = (await prisma.membership.findMany({
    where,
    orderBy: { id: "asc" },
    include: { role: { select: { id: true, name: true, description: true } } } as any,
  })) as any[];

  const withTenants = await Promise.all(
    rows.map(async (r) => {
      let tenantName: string | null = null;
      if (r.tenantId) {
        const t = (await prisma.tenant.findUnique({
          where: { id: r.tenantId },
          select: { name: true },
        })) as any;
        tenantName = t?.name ?? null;
      }
      return {
        id: r.id,
        userId: r.userId,
        roleId: r.roleId,
        roleName: r.role?.name ?? "",
        tenantId: r.tenantId ?? null,
        tenantName,
        createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : new Date(r.createdAt).toISOString(),
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
  const row = (await prisma.membership.create({
    data: { userId: userId.trim(), roleId, tenantId } as any,
  })) as any;
  const role = (await prisma.rbacRole.findUnique({
    where: { id: roleId },
    select: { name: true },
  })) as any;
  let tenantName: string | null = null;
  if (tenantId) {
    const t = (await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true },
    })) as any;
    tenantName = t?.name ?? null;
  }
  res.status(201).json({
    id: row.id,
    userId: row.userId,
    roleId: row.roleId,
    roleName: role?.name ?? "",
    tenantId: row.tenantId ?? null,
    tenantName,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : new Date(row.createdAt).toISOString(),
  });
});

router.delete("/user-roles/:id", authorize({ resource: "users", action: "write" }), async (req, res): Promise<void> => {
  const id = String(req.params.id);
  await prisma.membership.delete({ where: { id } }).catch(() => {
    // Ignore if already deleted
  });
  res.status(204).end();
});

// ─── Workspace Members ────────────────────────────────────────────────────────

router.get("/members", authorize({ resource: "users", action: "read" }), async (req, res): Promise<void> => {
  await ensureRbacSeed();
  const tenantId = req.tenantId as string;

  const members = (await prisma.user.findMany({
    where: { tenantId } as any,
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      status: true,
      createdAt: true,
      lastLoginAt: true,
    },
  })) as any[];

  const userIds = members.map((m) => String(m.id));
  const roleAssignments: any[] = userIds.length
    ? ((await prisma.membership.findMany({
        where: { userId: { in: userIds } },
        include: { role: { select: { id: true, name: true, description: true } } } as any,
      })) as any[])
    : [];

  const roleByUser: Record<string, { id: string; name: string; description: string | null }> = {};
  for (const r of roleAssignments) {
    if (r.role) {
      roleByUser[r.userId] = { id: r.role.id, name: r.role.name, description: r.role.description ?? null };
    }
  }

  res.json(
    members.map((m) => ({
      userId: String(m.id),
      name: m.name,
      email: m.email,
      avatarUrl: m.avatarUrl ?? null,
      isActive: m.status === "active",
      joinedAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : new Date(m.createdAt).toISOString(),
      lastLoginAt: m.lastLoginAt
        ? (m.lastLoginAt instanceof Date ? m.lastLoginAt.toISOString() : new Date(m.lastLoginAt).toISOString())
        : null,
      role: roleByUser[String(m.id)] ?? null,
    })),
  );
});

router.put("/members/:userId/role", authorize({ resource: "users", action: "write" }), async (req, res): Promise<void> => {
  await ensureRbacSeed();
  const { userId } = req.params;
  const { roleId } = req.body as { roleId: string };
  const tenantId = req.tenantId as string;

  const user = (await prisma.user.findFirst({
    where: { id: String(userId), tenantId } as any,
    select: { id: true },
  })) as any;

  if (!user) {
    res.status(404).json({ error: "User not found in this workspace" });
    return;
  }

  const role = (await prisma.rbacRole.findUnique({ where: { id: roleId } })) as any;
  if (!role) {
    res.status(404).json({ error: "Role not found" });
    return;
  }

  await prisma.membership.deleteMany({
    where: { userId: userId as string, tenantId } as any,
  });

  const assignment = (await prisma.membership.create({
    data: { userId: userId as string, roleId, tenantId } as any,
  })) as any;

  res.json({
    userId,
    roleId: assignment.roleId,
    roleName: role.name,
    roleDescription: (role as any).description ?? null,
    tenantId: assignment.tenantId,
    createdAt: assignment.createdAt instanceof Date ? assignment.createdAt.toISOString() : new Date(assignment.createdAt).toISOString(),
  });
});

export default router;
