"use client";

import { useAuth } from "@/lib/auth";

export type CustomerRole = "owner" | "admin" | "builder" | "viewer";
export type PlatformRole = "platform_admin" | "support" | "finance";
export type AppRole = CustomerRole | PlatformRole;

// Role hierarchy levels — higher number = more access
const ROLE_LEVEL: Record<string, number> = {
  viewer: 1,
  builder: 2,
  admin: 3,
  owner: 4,
  // Platform roles sit in their own tier
  support: 10,
  finance: 10,
  platform_admin: 20,
};

/**
 * Returns helpers for reading and checking the current user's role.
 *
 * Usage:
 *   const { role, isAtLeast, isPlatform } = useRole();
 *   isAtLeast("admin")     // true for admin, owner, platform_admin
 *   isPlatform             // true for platform_admin, support, finance
 *   isOwner                // exactly owner (or platform_admin)
 */
export function useRole() {
  const { user } = useAuth();
  const role = (user?.role ?? "viewer") as AppRole;

  const isPlatform =
    role === "platform_admin" || role === "support" || role === "finance";

  /**
   * True if the user's role level is >= the required level.
   * Platform admins always pass all customer role checks.
   */
  function isAtLeast(required: CustomerRole): boolean {
    if (role === "platform_admin") return true;
    return (ROLE_LEVEL[role] ?? 0) >= (ROLE_LEVEL[required] ?? 0);
  }

  /**
   * True if the user is exactly the given role (or platform_admin for all customer roles).
   */
  function hasRole(r: AppRole): boolean {
    if (role === "platform_admin") return true;
    return role === r;
  }

  return {
    role,
    isAtLeast,
    hasRole,
    isPlatform,
    isOwner: role === "owner" || role === "platform_admin",
    isAdmin: isAtLeast("admin"),
    isBuilder: isAtLeast("builder"),
    isViewer: true,
  };
}

/**
 * Determines whether a nav item is visible to the given role.
 * @param userRole   - The user's current role string
 * @param minRole    - The minimum role required ('viewer'|'builder'|'admin'|'owner'|'platform')
 */
export function canSeeNavItem(
  userRole: string,
  minRole: "viewer" | "builder" | "admin" | "owner" | "platform" | undefined,
): boolean {
  if (!minRole) return true;
  // Platform-only items: only platform_admin can see them
  if (minRole === "platform") return userRole === "platform_admin";
  // Platform admin always sees everything
  if (userRole === "platform_admin") return true;
  return (ROLE_LEVEL[userRole] ?? 0) >= (ROLE_LEVEL[minRole] ?? 0);
}
