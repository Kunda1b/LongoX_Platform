export type PermissionScope =
  | "connector:read"
  | "connector:write"
  | "connector:install"
  | "connector:configure"
  | "connector:execute"
  | "connector:webhook"
  | "connector:poll"
  | "connector:upgrade"
  | "connector:uninstall"
  | "marketplace:list"
  | "marketplace:install"
  | "marketplace:publish"
  | "marketplace:review"
  | "template:read"
  | "template:install"
  | "template:create"
  | "template:publish";

export interface PermissionSet {
  scopes: PermissionScope[];
  tenantId: string;
  userId: string;
}

export function canAccess(
  permissions: PermissionSet,
  requiredScope: PermissionScope,
): boolean {
  return (
    permissions.scopes.includes(requiredScope) ||
    permissions.scopes.includes("*" as any)
  );
}

export function validatePermissionScopes(
  manifestScopes: string[],
  grantableScopes: PermissionScope[],
): { valid: boolean; missing: string[] } {
  const missing = manifestScopes.filter(
    (s) => !grantableScopes.includes(s as PermissionScope),
  );
  return { valid: missing.length === 0, missing };
}
