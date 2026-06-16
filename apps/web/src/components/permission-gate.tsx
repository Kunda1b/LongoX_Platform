"use client";

import type { ReactNode } from "react";
import { usePermissions } from "@/hooks/use-permissions";
import { useRole } from "@/hooks/use-role";

type PermissionGateProps = {
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  minRole?: "viewer" | "builder" | "admin" | "owner";
  fallback?: ReactNode;
  children: ReactNode;
};

/**
 * Renders `children` only when the current user has the required permission(s).
 *
 * Usage:
 *   <PermissionGate permission="users:write">
 *     <InviteMemberButton />
 *   </PermissionGate>
 *
 *   <PermissionGate permissions={["billing:read", "billing:write"]} requireAll>
 *     <BillingPanel />
 *   </PermissionGate>
 *
 *   <PermissionGate minRole="admin" fallback={<p>Admins only</p>}>
 *     <AdminTools />
 *   </PermissionGate>
 */
export function PermissionGate({
  permission,
  permissions,
  requireAll = false,
  minRole,
  fallback = null,
  children,
}: PermissionGateProps) {
  const { can, canAny, canAll } = usePermissions();
  const { isAtLeast } = useRole();

  if (minRole && !isAtLeast(minRole)) return <>{fallback}</>;

  if (permission && !can(permission)) return <>{fallback}</>;

  if (permissions && permissions.length > 0) {
    const passes = requireAll ? canAll(...permissions) : canAny(...permissions);
    if (!passes) return <>{fallback}</>;
  }

  return <>{children}</>;
}
