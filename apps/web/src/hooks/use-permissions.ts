"use client";

import { useRole } from "./use-role";

const ROLE_PERMISSIONS: Record<string, Set<string>> = {
  owner: new Set([
    "workflows:read", "workflows:write", "workflows:run", "workflows:delete",
    "connectors:read", "connectors:write", "connectors:install",
    "credentials:read", "credentials:write",
    "apps:read", "apps:write", "apps:delete",
    "analytics:read",
    "billing:read", "billing:write",
    "users:read", "users:write",
    "templates:read", "templates:write",
    "dashboards:read", "dashboards:write", "dashboards:delete",
    "ai:read", "ai:write", "ai:run",
    "audit:read",
    "executions:read", "executions:run",
    "tenants:admin",
  ]),
  admin: new Set([
    "workflows:read", "workflows:write", "workflows:run", "workflows:delete",
    "connectors:read", "connectors:write", "connectors:install",
    "credentials:read", "credentials:write",
    "apps:read", "apps:write", "apps:delete",
    "analytics:read",
    "billing:read",
    "users:read", "users:write",
    "templates:read", "templates:write",
    "dashboards:read", "dashboards:write", "dashboards:delete",
    "ai:read", "ai:write", "ai:run",
    "audit:read",
    "executions:read", "executions:run",
  ]),
  builder: new Set([
    "workflows:read", "workflows:write", "workflows:run", "workflows:delete",
    "connectors:read", "connectors:install",
    "credentials:read", "credentials:write",
    "apps:read", "apps:write",
    "analytics:read",
    "templates:read", "templates:write",
    "dashboards:read", "dashboards:write", "dashboards:delete",
    "ai:read", "ai:write", "ai:run",
    "executions:read", "executions:run",
  ]),
  viewer: new Set([
    "workflows:read",
    "dashboards:read",
    "analytics:read",
    "executions:read",
    "templates:read",
  ]),
  platform_admin: new Set([
    "workflows:read", "workflows:write", "workflows:run", "workflows:delete",
    "connectors:read", "connectors:write", "connectors:install",
    "credentials:read", "credentials:write",
    "apps:read", "apps:write", "apps:delete",
    "analytics:read",
    "billing:read", "billing:write",
    "users:read", "users:write",
    "templates:read", "templates:write",
    "dashboards:read", "dashboards:write", "dashboards:delete",
    "ai:read", "ai:write", "ai:run",
    "audit:read",
    "executions:read", "executions:run",
    "tenants:admin",
    "feature_flags:write",
    "regions:admin",
    "revenue:read",
  ]),
  support: new Set([
    "workflows:read",
    "executions:read",
    "audit:read",
    "tenants:admin",
  ]),
  finance: new Set([
    "billing:read", "billing:write",
    "analytics:read",
    "revenue:read",
  ]),
};

/**
 * Returns a `can(permission)` function for the current user.
 *
 * Permission format:  "resource:action"
 *   e.g.  can("workflows:write")
 *          can("billing:read")
 *          can("users:write")
 */
export function usePermissions() {
  const { role } = useRole();

  const permissions = ROLE_PERMISSIONS[role] ?? ROLE_PERMISSIONS.viewer!;

  function can(permission: string): boolean {
    return permissions.has(permission);
  }

  function canAny(...perms: string[]): boolean {
    return perms.some((p) => permissions.has(p));
  }

  function canAll(...perms: string[]): boolean {
    return perms.every((p) => permissions.has(p));
  }

  return { can, canAny, canAll, permissions };
}
