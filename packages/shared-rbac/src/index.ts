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
export type Action = "read" | "write" | "run" | "delete" | "admin" | "install";

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
};

/** Canonical permission keys for route guards. Use with authorize(Permissions.workflows.read). */
export const Permissions = {
  workflows: {
    read: "workflows:read",
    write: "workflows:write",
    run: "workflows:run",
    delete: "workflows:delete",
  },
  connectors: {
    read: "connectors:read",
    write: "connectors:write",
    install: "connectors:install",
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
  billing: { read: "billing:read", write: "billing:write" },
  users: { read: "users:read", write: "users:write" },
  tenants: { admin: "tenants:admin" },
  templates: { read: "templates:read", write: "templates:write" },
  dashboards: {
    read: "dashboards:read",
    write: "dashboards:write",
    delete: "dashboards:delete",
  },
  ai: { read: "ai:read", write: "ai:write", run: "ai:run" },
  audit: { read: "audit:read" },
  executions: { read: "executions:read", run: "executions:run" },
} as const;

const PERMISSION_ALIASES: Record<string, string> = {
  "workflow.read": "workflows:read",
  "workflow.write": "workflows:write",
  "workflow.execute": "workflows:run",
  "workflow.run": "workflows:run",
  "workflow.delete": "workflows:delete",
  "tenant.admin": "tenants:admin",
  "tenant.read": "tenants:admin",
};

export function parsePermissionString(permission: string): AuthorizeOptions | null {
  const normalized = PERMISSION_ALIASES[permission] ?? permission.replace(".", ":");
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
  const allowed = (rolePermissions[userRole] as unknown as Record<string, Action[]>)?.[requiredResource];
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

function setCachedPermissions(cacheKey: string, permissions: Set<string>): void {
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
    .innerJoin(rolePermissionsTable, eq(rolePermissionsTable.roleId, rolesTable.id))
    .innerJoin(permissionsTable, eq(rolePermissionsTable.permissionId, permissionsTable.id))
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
async function getUserRoleName(userId: number, tenantId: number | null): Promise<string | null> {
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
    roleCache.set(cacheKey, { name: row.name, expiresAt: Date.now() + ROLE_CACHE_TTL_MS });
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

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
      roleName === "platform_admin" || user.role === "platform_admin" ||
      roleName === "Super Admin" || user.role === "super_admin"
    ) {
      next();
      return;
    }

    // Tenant-scoped admin / owner bypass — must belong to THIS tenant.
    const tenantRoleName = tenantId !== null ? await getUserRoleName(user.id, tenantId) : null;
    if (
      tenantRoleName === "owner" || tenantRoleName === "admin"
    ) {
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
export function authorize(permission: string): ReturnType<typeof createAuthorizeMiddleware>;
export function authorize(options: AuthorizeOptions): ReturnType<typeof createAuthorizeMiddleware>;
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
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const tenantId = user.tenantId ?? null;

    const platformRole = await getUserRoleName(user.id, null);
    if (platformRole === "platform_admin" || user.role === "platform_admin" ||
        platformRole === "Super Admin" || user.role === "super_admin") {
      next();
      return;
    }

    const tenantRole = tenantId !== null ? await getUserRoleName(user.id, tenantId) : null;
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
