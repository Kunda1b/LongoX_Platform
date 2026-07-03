export { seedRoles, getSystemRoleId } from "./seed.js";

import { eq, and, isNull } from "drizzle-orm";
import {
  db,
  rolesTable,
  permissionsTable,
  rolePermissionsTable,
  userRolesTable,
} from "@longox/db";
import type { Request, Response, NextFunction } from "express";

// NOTE: This `Request.user` declaration MUST match the one in
// `packages/shared-auth/src/index.ts` exactly. TypeScript merges global
// `Express.Request` declarations across packages, and TS2717 fires if the
// `user` property has different shapes in different files.
//
// The canonical `AuthUser` type is `{ id, email, name, tenantId: number | null,
// role }`. Both shared-rbac and shared-auth declare it identically so that
// services depending on either package see the same `req.user` shape.
// Downstream services that import BOTH packages still typecheck cleanly.
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        name: string;
        tenantId: number | null;
        role: string;
      };
      tenantId?: number;
      correlationId?: string;
    }
  }
}

export interface Permission {
  id: number;
  resource: string;
  action: string;
  description: string | null;
}

export interface Role {
  id: number;
  name: string;
  description: string | null;
  tenantId: number | null;
  permissions: Permission[];
  createdAt: string;
}

export interface UserRole {
  id: number;
  userId: string;
  roleId: number;
  roleName: string;
  tenantId: number | null;
  createdAt: string;
}

export type Scope =
  | "platform"
  | "tenant"
  | "environment"
  | "resource"
  | "read-only";
export type Action =
  | "read"
  | "write"
  | "run"
  | "delete"
  | "admin"
  | "install"
  | "promote";

export const RESOURCE_ACTIONS: Record<string, Action[]> = {
  workflows: ["read", "write", "run", "delete"],
  connectors: ["read", "install", "write"],
  apps: ["read", "write", "delete"],
  credentials: ["read", "write"],
  analytics: ["read"],
  billing: ["read", "write"],
  users: ["read", "write"],
  tenants: ["admin"],
  templates: ["read", "write"],
  dashboards: ["read", "write", "delete"],
  ai: ["read", "write", "run"],
  audit: ["read"],
  executions: ["read", "run"],
  environments: ["read", "write", "admin", "promote"],
};

/** Canonical permission keys for route guards. Use with authorize(Permissions.workflows.read). */
export const Permissions = {
  workflows: {
    read: "workflows:read",
    write: "workflows:write",
    run: "workflows:run",
    delete: "workflows:delete",
    // ─── ADR §15 Table 23 — atomic permissions ──────────────────────────────
    // These were missing in the original implementation. Added to comply
    // with the architecture's atomic permission catalog.
    create: "workflows:create", // workflow.create
    publish: "workflows:publish", // workflow.publish
    view: "workflows:read", // workflow.view (alias)
  },
  connectors: {
    read: "connectors:read",
    write: "connectors:write",
    install: "connectors:install",
    // ─── ADR §15 Table 23 — atomic permissions ──────────────────────────────
    revoke: "connectors:revoke", // connector.revoke
    edit: "connectors:edit", // connector.edit
    version_publish: "connectors:version_publish", // connector.version.publish
    release: "connectors:release", // connector.release
  },
  apps: {
    read: "apps:read",
    write: "apps:write",
    delete: "apps:delete",
  },
  credentials: {
    read: "credentials:read",
    write: "credentials:write",
  },
  analytics: { read: "analytics:read" },
  billing: {
    read: "billing:read",
    write: "billing:write",
    // ─── ADR §15 Table 23 — atomic permissions ──────────────────────────────
    manage: "billing:manage", // billing.manage
  },
  users: {
    read: "users:read",
    write: "users:write",
    // ─── ADR §15 Table 23 — atomic permissions ──────────────────────────────
    manage: "users:manage", // user.manage
  },
  roles: {
    // ─── ADR §15 Table 23 — atomic permissions ──────────────────────────────
    manage: "roles:manage", // role.manage
  },
  tenants: {
    admin: "tenants:admin",
    // ─── ADR §15 Table 23 — atomic permissions ──────────────────────────────
    support: "tenants:support", // tenant.support
    policy_management: "tenants:policy_management", // policy.management
    catalog_moderate: "tenants:catalog_moderate", // global.catalog.moderate
  },
  templates: {
    read: "templates:read",
    write: "templates:write",
    // ─── ADR §15 Table 23 — atomic permissions ──────────────────────────────
    publish: "templates:publish", // template.publish
  },
  dashboards: {
    read: "dashboards:read",
    write: "dashboards:write",
    delete: "dashboards:delete",
    // ─── ADR §15 Table 23 — atomic permissions ──────────────────────────────
    create: "dashboards:create", // dashboard.create
    publish: "dashboards:publish", // dashboard.publish
    view: "dashboards:read", // dashboard.view (alias)
  },
  ai: { read: "ai:read", write: "ai:write", run: "ai:run" },
  audit: {
    read: "audit:read",
    // ─── ADR §15 Table 23 — atomic permissions ──────────────────────────────
    search: "audit:search", // audit.search
  },
  executions: {
    read: "executions:read",
    run: "executions:run",
    // ─── ADR §15 Table 23 — atomic permissions ──────────────────────────────
    view: "executions:read", // execution.view (alias)
    retry: "executions:retry", // execution.retry
    cancel: "executions:cancel", // execution.cancel
  },
  environments: {
    read: "environments:read",
    write: "environments:write",
    admin: "environments:admin",
    promote: "environments:promote",
    // ─── ADR §15 Table 23 — atomic permissions ──────────────────────────────
    version_promote: "environments:promote", // version.promote (alias)
    deployment_rollback: "environments:deployment_rollback", // deployment.rollback
    change_approve: "environments:change_approve", // change.approve
  },
  feature_flags: {
    // ─── ADR §15 Table 23 — atomic permissions ──────────────────────────────
    set: "feature_flags:set", // feature_flag.set
  },
  reports: {
    // ─── ADR §15 Table 23 — atomic permissions ──────────────────────────────
    view: "reports:view", // report.view
  },
} as const;

/**
 * Flat list of every atomic permission in the catalog.
 *
 * Per architecture.md §15: "Permission catalog additive-only; role changes
 * versioned." Add to this list only — never remove (deprecate instead).
 */
export const ATOMIC_PERMISSIONS: readonly string[] = Object.freeze([
  // Workflows
  "workflows:create",
  "workflows:read", // workflow.view alias
  "workflows:write",
  "workflows:run",
  "workflows:publish",
  "workflows:delete",
  // Executions
  "executions:read", // execution.view alias
  "executions:run",
  "executions:retry",
  "executions:cancel",
  // Connectors
  "connectors:read",
  "connectors:install",
  "connectors:revoke",
  "connectors:edit",
  "connectors:version_publish",
  "connectors:release",
  "connectors:write",
  // Dashboards
  "dashboards:create",
  "dashboards:read", // dashboard.view alias
  "dashboards:write",
  "dashboards:publish",
  "dashboards:delete",
  // Templates
  "templates:read",
  "templates:write",
  "templates:publish",
  // Billing
  "billing:read",
  "billing:manage",
  // Audit
  "audit:read",
  "audit:search",
  // Users / Roles
  "users:read",
  "users:write",
  "users:manage",
  "roles:manage",
  // Tenants / Platform-scope
  "tenants:admin",
  "tenants:support",
  "tenants:policy_management",
  "tenants:catalog_moderate",
  // Environments / Environment-scope
  "environments:read",
  "environments:write",
  "environments:admin",
  "environments:promote", // version.promote
  "environments:deployment_rollback",
  "environments:change_approve",
  // Feature flags
  "feature_flags:set",
  // Reports
  "reports:view",
]);

const PERMISSION_ALIASES: Record<string, string> = {
  "workflow.read": "workflows:read",
  "workflow.write": "workflows:write",
  "workflow.execute": "workflows:run",
  "workflow.run": "workflows:run",
  "workflow.delete": "workflows:delete",
  "workflow.create": "workflows:create",
  "workflow.publish": "workflows:publish",
  "workflow.view": "workflows:read",
  "tenant.admin": "tenants:admin",
  "tenant.read": "tenants:admin",
  "tenant.support": "tenants:support",
  "policy.management": "tenants:policy_management",
  "global.catalog.moderate": "tenants:catalog_moderate",
  "execution.view": "executions:read",
  "execution.retry": "executions:retry",
  "execution.cancel": "executions:cancel",
  "connector.install": "connectors:install",
  "connector.revoke": "connectors:revoke",
  "connector.edit": "connectors:edit",
  "connector.version.publish": "connectors:version_publish",
  "connector.release": "connectors:release",
  "dashboard.create": "dashboards:create",
  "dashboard.publish": "dashboards:publish",
  "dashboard.view": "dashboards:read",
  "template.publish": "templates:publish",
  "billing.view": "billing:read",
  "billing.manage": "billing:manage",
  "audit.search": "audit:search",
  "user.manage": "users:manage",
  "role.manage": "roles:manage",
  "feature_flag.set": "feature_flags:set",
  "version.promote": "environments:promote",
  "deployment.rollback": "environments:deployment_rollback",
  "change.approve": "environments:change_approve",
  "report.view": "reports:view",
};

// ─── ADR §15 — Authorization decision API with reason codes ───────────────────
// Per architecture.md §15: "Authorization engine returns allow/deny + reason
// code (UI explains why action is unavailable)." The legacy `authorize()`
// middleware returns 403 without a reason; the new `decide()` function returns
// a structured decision that UI can render.

export type DecisionReasonCode =
  | "ALLOWED"
  | "DENIED_MISSING_PERMISSION"
  | "DENIED_WRONG_TENANT"
  | "DENIED_WRONG_SCOPE"
  | "DENIED_SUSPENDED_USER"
  | "DENIED_EXPIRED_SESSION"
  | "DENIED_FEATURE_FLAG_DISABLED"
  | "DENIED_QUOTA_EXCEEDED";

export interface AuthorizationDecision {
  allowed: boolean;
  reason_code: DecisionReasonCode;
  message: string;
  required_permission: string;
  user_permissions: string[];
  /** The scope at which the decision was made (platform / tenant / env / resource). */
  scope: Scope;
}

/**
 * Decide whether a user is allowed to perform an action.
 *
 * Returns a structured decision with a reason code so the UI can explain
 * *why* an action is unavailable (per architecture.md §15). This is the
 * preferred entry point for new code; the legacy `authorize()` middleware
 * delegates to this and shapes the 403 response from its result.
 *
 * @param userPermissions - the user's atomic permission set (e.g. from `getUserPermissions`)
 * @param requiredPermission - the canonical permission key (e.g. "workflows:publish")
 * @param context - the scope and tenant context for the decision
 */
export function decide(
  userPermissions: string[] | Set<string>,
  requiredPermission: string,
  context: {
    scope?: Scope;
    userTenantId?: number | null;
    resourceTenantId?: number | null;
    userStatus?: "active" | "suspended";
  } = {},
): AuthorizationDecision {
  const perms =
    userPermissions instanceof Set
      ? Array.from(userPermissions)
      : userPermissions;
  const scope = context.scope ?? "tenant";

  // 1. Suspended user — deny everything.
  if (context.userStatus === "suspended") {
    return {
      allowed: false,
      reason_code: "DENIED_SUSPENDED_USER",
      message: "Your account is suspended. Contact your workspace admin.",
      required_permission: requiredPermission,
      user_permissions: perms,
      scope,
    };
  }

  // 2. Wrong tenant — deny (defense in depth for Tier 1 isolation).
  if (
    context.resourceTenantId !== undefined &&
    context.userTenantId !== undefined &&
    context.resourceTenantId !== null &&
    context.userTenantId !== null &&
    context.resourceTenantId !== context.userTenantId
  ) {
    return {
      allowed: false,
      reason_code: "DENIED_WRONG_TENANT",
      message: "This resource belongs to a different workspace.",
      required_permission: requiredPermission,
      user_permissions: perms,
      scope,
    };
  }

  // 3. Normalize the required permission (handle aliases).
  const normalized =
    PERMISSION_ALIASES[requiredPermission] ??
    (requiredPermission.includes(":")
      ? requiredPermission
      : requiredPermission.replace(".", ":"));

  // 4. Check the permission.
  if (perms.includes(normalized) || perms.includes("*")) {
    return {
      allowed: true,
      reason_code: "ALLOWED",
      message: "Allowed",
      required_permission: normalized,
      user_permissions: perms,
      scope,
    };
  }

  // 5. Default deny.
  return {
    allowed: false,
    reason_code: "DENIED_MISSING_PERMISSION",
    message: `Your role does not include the "${normalized}" permission. Contact your workspace admin to request access.`,
    required_permission: normalized,
    user_permissions: perms,
    scope,
  };
}

export function parsePermissionString(
  permission: string,
): AuthorizeOptions | null {
  const normalized =
    PERMISSION_ALIASES[permission] ?? permission.replace(".", ":");
  const parsed = parsePermissionKey(normalized);
  if (!parsed) return null;
  return { resource: parsed.resource, action: parsed.action };
}

export function canAccess(
  userRole: string,
  requiredResource: string,
  requiredAction: Action,
  rolePermissions: Record<string, Action[]>,
): boolean {
  if (userRole === "admin" || userRole === "super_admin") return true;
  const allowed = (
    rolePermissions[userRole] as unknown as Record<string, Action[]>
  )?.[requiredResource];
  if (!allowed) return false;
  return (
    allowed.includes(requiredAction) || allowed.includes("admin" as Action)
  );
}

export function buildPermissionKey(resource: string, action: string): string {
  return `${resource}:${action}`;
}

export function parsePermissionKey(
  key: string,
): { resource: string; action: string } | null {
  const parts = key.split(":");
  if (parts.length !== 2) return null;
  return { resource: parts[0], action: parts[1] };
}

// ─── Permission Cache ──────────────────────────────────────────────────────────

interface CachedPermissions {
  permissions: Set<string>;
  expiresAt: number;
}

const permissionCache = new Map<string, CachedPermissions>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCachedPermissions(cacheKey: string): Set<string> | null {
  const cached = permissionCache.get(cacheKey);
  if (!cached) return null;
  if (Date.now() > cached.expiresAt) {
    permissionCache.delete(cacheKey);
    return null;
  }
  return cached.permissions;
}

function setCachedPermissions(
  cacheKey: string,
  permissions: Set<string>,
): void {
  permissionCache.set(cacheKey, {
    permissions,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

export function clearPermissionCache(userId?: string): void {
  if (userId) {
    for (const key of permissionCache.keys()) {
      if (key.startsWith(`perm:${userId}:`)) {
        permissionCache.delete(key);
      }
    }
    for (const key of roleCache.keys()) {
      if (key.startsWith(`${userId}:`)) {
        roleCache.delete(key);
      }
    }
  } else {
    permissionCache.clear();
    roleCache.clear();
  }
}

// ─── Fetch User Permissions ────────────────────────────────────────────────────

async function getUserPermissions(
  userId: number,
  tenantId: number | null,
): Promise<Set<string>> {
  const cacheKey = `perm:${userId}:tenant:${tenantId ?? "global"}`;
  const cached = getCachedPermissions(cacheKey);
  if (cached) return cached;

  const rows = await db
    .select({
      resource: permissionsTable.resource,
      action: permissionsTable.action,
    })
    .from(userRolesTable)
    .innerJoin(rolesTable, eq(userRolesTable.roleId, rolesTable.id))
    .innerJoin(
      rolePermissionsTable,
      eq(rolePermissionsTable.roleId, rolesTable.id),
    )
    .innerJoin(
      permissionsTable,
      eq(rolePermissionsTable.permissionId, permissionsTable.id),
    )
    .where(
      and(
        eq(userRolesTable.userId, String(userId)),
        tenantId !== null
          ? eq(userRolesTable.tenantId, tenantId)
          : isNull(userRolesTable.tenantId),
      ),
    );

  const permissions = new Set<string>();
  for (const row of rows) {
    permissions.add(`${row.resource}:${row.action}`);
  }

  setCachedPermissions(cacheKey, permissions);
  return permissions;
}

// ─── Role Name Cache ───────────────────────────────────────────────────────────

interface CachedRole {
  name: string;
  expiresAt: number;
}

// Keyed by "${userId}:${tenantId}" to be tenant-scoped
const roleCache = new Map<string, CachedRole>();
const ROLE_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Fetch the role name for a user scoped to a specific tenant (or globally for
 * platform users when tenantId is null).  The tenant scope prevents an admin
 * in workspace A from bypassing permission checks in workspace B.
 */
async function getUserRoleName(
  userId: number,
  tenantId: number | null,
): Promise<string | null> {
  const cacheKey = `${userId}:${tenantId ?? "null"}`;
  const cached = roleCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.name;
  }

  const [row] = await db
    .select({ name: rolesTable.name })
    .from(userRolesTable)
    .innerJoin(rolesTable, eq(userRolesTable.roleId, rolesTable.id))
    .where(
      and(
        eq(userRolesTable.userId, String(userId)),
        tenantId !== null
          ? eq(userRolesTable.tenantId, tenantId)
          : isNull(userRolesTable.tenantId),
      ),
    )
    .limit(1);

  if (row) {
    roleCache.set(cacheKey, {
      name: row.name,
      expiresAt: Date.now() + ROLE_CACHE_TTL_MS,
    });
    return row.name;
  }
  return null;
}

// ─── Middleware ─────────────────────────────────────────────────────────────────

export interface AuthorizeOptions {
  resource: string;
  action: string;
}

function createAuthorizeMiddleware(options: AuthorizeOptions) {
  const { resource, action } = options;
  const permissionKey = `${resource}:${action}`;

  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const tenantId = user.tenantId ?? null;

    // Platform-level bypass — these roles are never tenant-scoped.
    // We still fetch the role from the DB (with null tenantId) to confirm it.
    const roleName = await getUserRoleName(user.id, null);
    if (
      roleName === "platform_admin" ||
      user.role === "platform_admin" ||
      roleName === "Super Admin" ||
      user.role === "super_admin"
    ) {
      next();
      return;
    }

    // Tenant-scoped admin / owner bypass — must belong to THIS tenant.
    const tenantRoleName =
      tenantId !== null ? await getUserRoleName(user.id, tenantId) : null;
    if (tenantRoleName === "owner" || tenantRoleName === "admin") {
      next();
      return;
    }

    // Granular permission check scoped to the user's current tenant.
    const permissions = await getUserPermissions(user.id, tenantId);

    if (permissions.has(permissionKey)) {
      next();
      return;
    }

    if (permissions.has(`${resource}:admin`)) {
      next();
      return;
    }

    res.status(403).json({
      error: "Forbidden",
      message: `Missing permission: ${permissionKey}`,
      required: permissionKey,
    });
  };
}

/**
 * Express middleware for permission checks.
 *
 * Usage:
 *   authorize("workflows.read")
 *   authorize("workflow.execute")  // alias for workflows.run
 *   authorize({ resource: "workflows", action: "read" })
 */
export function authorize(
  permission: string,
): ReturnType<typeof createAuthorizeMiddleware>;
export function authorize(
  options: AuthorizeOptions,
): ReturnType<typeof createAuthorizeMiddleware>;
export function authorize(
  permissionOrOptions: string | AuthorizeOptions,
): ReturnType<typeof createAuthorizeMiddleware> {
  if (typeof permissionOrOptions === "string") {
    const parsed = parsePermissionString(permissionOrOptions);
    if (!parsed) {
      throw new Error(`Invalid permission string: ${permissionOrOptions}`);
    }
    return createAuthorizeMiddleware(parsed);
  }
  return createAuthorizeMiddleware(permissionOrOptions);
}

/**
 * Shorthand middleware that requires multiple permissions (any one match).
 *
 * Usage:
 *   router.delete("/workflows/:id",
 *     authorizeAny([
 *       { resource: "workflows", action: "delete" },
 *       { resource: "workflows", action: "admin" },
 *     ]),
 *     handler
 *   )
 */
export function authorizeAny(options: AuthorizeOptions[]) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const tenantId = user.tenantId ?? null;

    const platformRole = await getUserRoleName(user.id, null);
    if (
      platformRole === "platform_admin" ||
      user.role === "platform_admin" ||
      platformRole === "Super Admin" ||
      user.role === "super_admin"
    ) {
      next();
      return;
    }

    const tenantRole =
      tenantId !== null ? await getUserRoleName(user.id, tenantId) : null;
    if (tenantRole === "owner" || tenantRole === "admin") {
      next();
      return;
    }

    const permissions = await getUserPermissions(user.id, tenantId);

    for (const { resource, action } of options) {
      const key = `${resource}:${action}`;
      if (permissions.has(key) || permissions.has(`${resource}:admin`)) {
        next();
        return;
      }
    }

    res.status(403).json({
      error: "Forbidden",
      message: `Missing one of: ${options.map((o) => `${o.resource}:${o.action}`).join(", ")}`,
    });
  };
}

/**
 * Middleware that requires tenant context. Blocks requests from users
 * without a tenantId.
 */
export function requireTenantContext(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  if (!req.user.tenantId) {
    res.status(403).json({
      error: "Tenant context required",
      message: "This endpoint requires an active tenant membership",
    });
    return;
  }
  next();
}
