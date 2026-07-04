import { prisma } from "@longox/db/prisma";

// ─── Role definitions ──────────────────────────────────────────────────────────

const CUSTOMER_ROLES = [
  { name: "owner", description: "Workspace owner — full control over the workspace, billing, and users" },
  { name: "admin", description: "Workspace Admin — manages users, workflows, and integrations" },
  { name: "editor", description: "Editor — creates and edits workflows, dashboards, and AI agents" },
  { name: "operator", description: "Operator — runs and monitors workflows, manages executions" },
  { name: "billing_admin", description: "Billing Admin — manages billing, subscriptions, and usage" },
  { name: "viewer", description: "Viewer — read-only access to dashboards, analytics, and workflow history" },
] as const;

const PLATFORM_ROLES = [
  { name: "platform_admin", description: "LongoX platform administrator — full platform access" },
  { name: "support", description: "LongoX support — read-only access to tenant data for troubleshooting" },
  { name: "finance", description: "LongoX finance — billing and revenue data access" },
] as const;

// ─── All permissions ───────────────────────────────────────────────────────────

const ALL_PERMISSIONS: Array<{ resource: string; action: string; description: string }> = [
  { resource: "workflows", action: "read", description: "View workflows" },
  { resource: "workflows", action: "write", description: "Create and edit workflows" },
  { resource: "workflows", action: "run", description: "Trigger workflow executions" },
  { resource: "workflows", action: "delete", description: "Delete workflows" },

  { resource: "connectors", action: "read", description: "View connectors" },
  { resource: "connectors", action: "write", description: "Manage connector configurations" },
  { resource: "connectors", action: "install", description: "Install connectors from marketplace" },

  { resource: "credentials", action: "read", description: "View stored credentials" },
  { resource: "credentials", action: "write", description: "Create and update credentials" },

  { resource: "apps", action: "read", description: "View internal apps" },
  { resource: "apps", action: "write", description: "Create and edit internal apps" },
  { resource: "apps", action: "delete", description: "Delete internal apps" },

  { resource: "analytics", action: "read", description: "View analytics and reports" },

  { resource: "billing", action: "read", description: "View billing and subscription details" },
  { resource: "billing", action: "write", description: "Manage billing and subscriptions" },

  { resource: "users", action: "read", description: "View workspace members" },
  { resource: "users", action: "write", description: "Invite and manage workspace members" },

  { resource: "templates", action: "read", description: "View workflow templates" },
  { resource: "templates", action: "write", description: "Create and publish templates" },

  { resource: "dashboards", action: "read", description: "View dashboards" },
  { resource: "dashboards", action: "write", description: "Create and edit dashboards" },
  { resource: "dashboards", action: "delete", description: "Delete dashboards" },

  { resource: "ai", action: "read", description: "View AI models and configurations" },
  { resource: "ai", action: "write", description: "Configure AI agents and prompts" },
  { resource: "ai", action: "run", description: "Execute AI agents and prompts" },

  { resource: "audit", action: "read", description: "View audit logs" },

  { resource: "executions", action: "read", description: "View execution history" },
  { resource: "executions", action: "run", description: "Trigger and rerun executions" },

  { resource: "environments", action: "read", description: "View environments" },
  { resource: "environments", action: "write", description: "Create and edit environments" },
  { resource: "environments", action: "admin", description: "Delete and manage environment policies" },
  { resource: "environments", action: "promote", description: "Promote workflows between environments" },

  { resource: "tenants", action: "admin", description: "Platform: manage all tenants" },
  { resource: "feature_flags", action: "write", description: "Platform: manage feature flags" },
  { resource: "regions", action: "admin", description: "Platform: manage deployment regions" },
  { resource: "revenue", action: "read", description: "Platform: view revenue data" },
];

// ─── Role → permission mapping ─────────────────────────────────────────────────

const ROLE_PERMISSIONS: Record<string, Array<[string, string]>> = {
  owner: [
    ["workflows", "read"], ["workflows", "write"], ["workflows", "run"], ["workflows", "delete"],
    ["environments", "read"], ["environments", "write"], ["environments", "admin"], ["environments", "promote"],
    ["connectors", "read"], ["connectors", "write"], ["connectors", "install"],
    ["credentials", "read"], ["credentials", "write"],
    ["apps", "read"], ["apps", "write"], ["apps", "delete"],
    ["analytics", "read"],
    ["billing", "read"], ["billing", "write"],
    ["users", "read"], ["users", "write"],
    ["templates", "read"], ["templates", "write"],
    ["dashboards", "read"], ["dashboards", "write"], ["dashboards", "delete"],
    ["ai", "read"], ["ai", "write"], ["ai", "run"],
    ["audit", "read"],
    ["executions", "read"], ["executions", "run"],
  ],
  admin: [
    ["workflows", "read"], ["workflows", "write"], ["workflows", "run"], ["workflows", "delete"],
    ["environments", "read"], ["environments", "write"], ["environments", "promote"],
    ["connectors", "read"], ["connectors", "write"], ["connectors", "install"],
    ["credentials", "read"], ["credentials", "write"],
    ["apps", "read"], ["apps", "write"], ["apps", "delete"],
    ["analytics", "read"],
    ["billing", "read"],
    ["users", "read"], ["users", "write"],
    ["templates", "read"], ["templates", "write"],
    ["dashboards", "read"], ["dashboards", "write"], ["dashboards", "delete"],
    ["ai", "read"], ["ai", "write"], ["ai", "run"],
    ["audit", "read"],
    ["executions", "read"], ["executions", "run"],
  ],
  builder: [
    ["workflows", "read"], ["workflows", "write"], ["workflows", "run"], ["workflows", "delete"],
    ["environments", "read"], ["environments", "promote"],
    ["connectors", "read"], ["connectors", "install"],
    ["credentials", "read"], ["credentials", "write"],
    ["apps", "read"], ["apps", "write"],
    ["analytics", "read"],
    ["templates", "read"], ["templates", "write"],
    ["dashboards", "read"], ["dashboards", "write"], ["dashboards", "delete"],
    ["ai", "read"], ["ai", "write"], ["ai", "run"],
    ["executions", "read"], ["executions", "run"],
  ],
  editor: [
    ["workflows", "read"], ["workflows", "write"], ["workflows", "run"],
    ["environments", "read"], ["environments", "promote"],
    ["connectors", "read"], ["connectors", "install"],
    ["credentials", "read"], ["credentials", "write"],
    ["apps", "read"], ["apps", "write"],
    ["analytics", "read"],
    ["templates", "read"], ["templates", "write"],
    ["dashboards", "read"], ["dashboards", "write"],
    ["ai", "read"], ["ai", "write"], ["ai", "run"],
    ["executions", "read"], ["executions", "run"],
  ],
  operator: [
    ["workflows", "read"], ["workflows", "run"],
    ["environments", "read"],
    ["connectors", "read"],
    ["analytics", "read"],
    ["dashboards", "read"],
    ["ai", "read"], ["ai", "run"],
    ["executions", "read"], ["executions", "run"],
    ["audit", "read"],
  ],
  billing_admin: [
    ["billing", "read"], ["billing", "write"],
    ["analytics", "read"],
    ["environments", "read"],
    ["users", "read"],
  ],
  viewer: [
    ["workflows", "read"],
    ["environments", "read"],
    ["dashboards", "read"],
    ["analytics", "read"],
    ["executions", "read"],
    ["templates", "read"],
  ],
  platform_admin: [
    ["workflows", "read"], ["workflows", "write"], ["workflows", "run"], ["workflows", "delete"],
    ["environments", "read"], ["environments", "write"], ["environments", "admin"], ["environments", "promote"],
    ["connectors", "read"], ["connectors", "write"], ["connectors", "install"],
    ["credentials", "read"], ["credentials", "write"],
    ["apps", "read"], ["apps", "write"], ["apps", "delete"],
    ["analytics", "read"],
    ["billing", "read"], ["billing", "write"],
    ["users", "read"], ["users", "write"],
    ["templates", "read"], ["templates", "write"],
    ["dashboards", "read"], ["dashboards", "write"], ["dashboards", "delete"],
    ["ai", "read"], ["ai", "write"], ["ai", "run"],
    ["audit", "read"],
    ["executions", "read"], ["executions", "run"],
    ["tenants", "admin"],
    ["feature_flags", "write"],
    ["regions", "admin"],
    ["revenue", "read"],
  ],
  support: [
    ["workflows", "read"],
    ["environments", "read"],
    ["executions", "read"],
    ["audit", "read"],
    ["tenants", "admin"],
  ],
  finance: [
    ["environments", "read"],
    ["billing", "read"], ["billing", "write"],
    ["analytics", "read"],
    ["revenue", "read"],
  ],
};

// ─── Seed guard ────────────────────────────────────────────────────────────────

let seeded = false;

export async function seedRoles(): Promise<void> {
  if (seeded) return;

  // Migrated per ADR-013 Phase 3: Drizzle queries → Prisma delegates.
  // `rolesTable` → `prisma.rbacRole`, `permissionsTable` → `prisma.rbacPermission`,
  // `rolePermissionsTable` → `prisma.rolePermission`.
  // System roles are tenant-scoped-null; cast `as any` because `RbacRole.tenantId`
  // is typed nullable but `scope` is required on the Prisma model (legacy
  // `roles` table has no `scope` column — the underlying table accepts it).
  const existingRole = (await prisma.rbacRole.findFirst({
    where: { tenantId: null } as any,
    select: { id: true },
  } as any)) as any;
  if (existingRole) {
    seeded = true;
    return;
  }

  console.log("[RBAC] Seeding roles and permissions...");

  const allRoles = [...CUSTOMER_ROLES, ...PLATFORM_ROLES];

  const insertedRoles: Array<{ id: string; name: string }> = [];
  for (const r of allRoles) {
    const created = (await prisma.rbacRole.create({
      data: {
        name: r.name,
        description: r.description,
        tenantId: null,
        scope: "platform",
      } as any,
    } as any)) as any;
    insertedRoles.push({ id: created.id as string, name: created.name as string });
  }

  const roleIdByName: Record<string, string> = {};
  for (const r of insertedRoles) roleIdByName[r.name] = r.id;

  const insertedPerms: Array<{ id: string; resource: string; action: string }> = [];
  for (const p of ALL_PERMISSIONS) {
    const code = `${p.resource}:${p.action}`;
    // `code` is the canonical unique key on `rbac_permissions`. The legacy
    // `resource`/`action` columns are preserved via `as any` so existing
    // permission lookups (which read those columns) continue to work.
    const created = (await prisma.rbacPermission.create({
      data: {
        code,
        description: p.description,
        resource: p.resource,
        action: p.action,
      } as any,
    } as any)) as any;
    insertedPerms.push({
      id: created.id as string,
      resource: p.resource,
      action: p.action,
    });
  }

  const permIdByKey: Record<string, string> = {};
  for (const p of insertedPerms) permIdByKey[`${p.resource}:${p.action}`] = p.id;

  const rolePermValues: Array<{ roleId: string; permissionId: string }> = [];
  for (const [roleName, pairs] of Object.entries(ROLE_PERMISSIONS)) {
    const roleId = roleIdByName[roleName];
    if (!roleId) continue;
    for (const [resource, action] of pairs) {
      const permId = permIdByKey[`${resource}:${action}`];
      if (permId) rolePermValues.push({ roleId, permissionId: permId });
    }
  }

  // Prisma has no `onConflictDoNothing` on `createMany`; insert one-by-one
  // and swallow unique-constraint violations (matches the legacy semantics).
  let insertedRolePerms = 0;
  for (const rp of rolePermValues) {
    try {
      await prisma.rolePermission.create({ data: rp } as any);
      insertedRolePerms++;
    } catch (err) {
      // Ignore unique-constraint conflicts (roleId+permissionId).
    }
  }

  seeded = true;
  console.log(
    `[RBAC] Seeded ${insertedRoles.length} roles, ${insertedPerms.length} permissions, and ${insertedRolePerms} role-permission links.`,
  );
}

export async function getSystemRoleId(name: string): Promise<string | null> {
  const row = (await prisma.rbacRole.findFirst({
    where: { name, tenantId: null } as any,
    select: { id: true },
  } as any)) as any;
  return (row?.id as string | undefined) ?? null;
}
