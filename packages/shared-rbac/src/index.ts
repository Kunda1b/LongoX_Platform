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

export type Scope = "platform" | "tenant" | "environment" | "resource" | "read-only";
export type Action = "read" | "write" | "run" | "delete" | "admin" | "install";

export const RESOURCE_ACTIONS: Record<string, Action[]> = {
  workflows: ["read", "write", "run", "delete"],
  connectors: ["read", "install"],
  apps: ["read", "write", "delete"],
  credentials: ["read", "write"],
  analytics: ["read"],
  billing: ["read", "write"],
  users: ["read", "write"],
  tenants: ["admin"],
  templates: ["read", "write"],
  dashboards: ["read", "write", "delete"],
};

export function canAccess(
  userRole: string,
  requiredResource: string,
  requiredAction: Action,
  rolePermissions: Record<string, Action[]>,
): boolean {
  if (userRole === "admin" || userRole === "super_admin") return true;
  const allowed = rolePermissions[userRole]?.[requiredResource];
  if (!allowed) return false;
  return allowed.includes(requiredAction) || allowed.includes("admin" as Action);
}

export function buildPermissionKey(resource: string, action: string): string {
  return `${resource}:${action}`;
}

export function parsePermissionKey(key: string): { resource: string; action: string } | null {
  const parts = key.split(":");
  if (parts.length !== 2) return null;
  return { resource: parts[0], action: parts[1] };
}
