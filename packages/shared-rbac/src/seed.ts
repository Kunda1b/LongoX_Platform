import { eq, and, isNull, inArray } from "drizzle-orm";
import {
  db,
  rolesTable,
  permissionsTable,
  rolePermissionsTable,
} from "@longox/db";

// ─── Role definitions ──────────────────────────────────────────────────────────

const CUSTOMER_ROLES = [
  { name: "owner", description: "Workspace owner — full control over the workspace, billing, and users" },
  { name: "admin", description: "Workspace admin — manages users, workflows, and integrations" },
  { name: "builder", description: "Power user — creates workflows, dashboards, and AI agents" },
  { name: "viewer", description: "Read-only access to dashboards, analytics, and workflow history" },
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

  const existingRoles = await db.select({ id: rolesTable.id }).from(rolesTable).where(isNull(rolesTable.tenantId)).limit(1);
  if (existingRoles.length > 0) {
    seeded = true;
    return;
  }

  console.log("[RBAC] Seeding roles and permissions...");

  const allRoles = [...CUSTOMER_ROLES, ...PLATFORM_ROLES];

  const insertedRoles = await db
    .insert(rolesTable)
    .values(allRoles.map((r) => ({ name: r.name, description: r.description })))
    .returning({ id: rolesTable.id, name: rolesTable.name });

  const roleIdByName: Record<string, number> = {};
  for (const r of insertedRoles) roleIdByName[r.name] = r.id;

  const insertedPerms = await db
    .insert(permissionsTable)
    .values(ALL_PERMISSIONS)
    .returning({ id: permissionsTable.id, resource: permissionsTable.resource, action: permissionsTable.action });

  const permIdByKey: Record<string, number> = {};
  for (const p of insertedPerms) permIdByKey[`${p.resource}:${p.action}`] = p.id;

  const rolePermValues: Array<{ roleId: number; permissionId: number }> = [];
  for (const [roleName, pairs] of Object.entries(ROLE_PERMISSIONS)) {
    const roleId = roleIdByName[roleName];
    if (!roleId) continue;
    for (const [resource, action] of pairs) {
      const permId = permIdByKey[`${resource}:${action}`];
      if (permId) rolePermValues.push({ roleId, permissionId: permId });
    }
  }

  if (rolePermValues.length > 0) {
    await db.insert(rolePermissionsTable).values(rolePermValues).onConflictDoNothing();
  }

  seeded = true;
  console.log(`[RBAC] Seeded ${insertedRoles.length} roles and ${insertedPerms.length} permissions.`);
}

export async function getSystemRoleId(name: string): Promise<number | null> {
  const [row] = await db
    .select({ id: rolesTable.id })
    .from(rolesTable)
    .where(and(eq(rolesTable.name, name), isNull(rolesTable.tenantId)))
    .limit(1);
  return row?.id ?? null;
}
