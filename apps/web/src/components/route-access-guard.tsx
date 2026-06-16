"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useRole } from "@/hooks/use-role";
import { useAuth } from "@/lib/auth";

type MinRole = "viewer" | "builder" | "admin" | "owner" | "platform";

/**
 * Route → minimum role map.
 * Checked by longest-prefix so more-specific paths override general ones.
 * "platform" means platform_admin only — never shown to customer roles.
 */
const ROUTE_RULES: Array<[string, MinRole]> = [
  // ── Platform-only (LongoX internal — never visible to customers) ──────────
  ["/compliance/audit-export", "platform"],
  ["/compliance/retention", "platform"],
  ["/compliance/gdpr", "platform"],
  ["/settings/regions", "platform"],
  ["/tenants", "platform"],
  ["/rbac", "platform"],
  ["/feature-flags", "platform"],
  ["/revenue", "platform"],

  // ── Owner only ────────────────────────────────────────────────────────────
  ["/billing", "owner"],
  ["/metering", "owner"],

  // ── Admin minimum ─────────────────────────────────────────────────────────
  ["/settings/team", "admin"],
  ["/settings/sso", "admin"],
  ["/audit-log", "admin"],
  ["/dlq", "admin"],
  ["/notifications", "admin"],
  ["/compliance", "admin"],
  ["/environments/promote", "admin"],
  ["/environments/promotions", "admin"],
  ["/environments/rollback", "admin"],
  ["/ai/models", "admin"],
  ["/ai/router", "admin"],

  // ── Builder minimum ───────────────────────────────────────────────────────
  ["/connectors", "builder"],
  ["/credentials", "builder"],
  ["/marketplace", "builder"],
  ["/apps", "builder"],
  ["/webhook-endpoints", "builder"],
  ["/environments", "builder"],
  ["/ai/playground", "builder"],
  ["/ai/prompts", "builder"],
  ["/ai/agents", "builder"],
  ["/ai/marketplace", "builder"],
  ["/ai/analytics", "builder"],
  ["/builder", "builder"],
];

const ROLE_LEVEL: Record<string, number> = {
  viewer: 1,
  builder: 2,
  admin: 3,
  owner: 4,
};

function resolveMinRole(pathname: string): MinRole | null {
  // Sort by descending length so longer (more specific) prefixes match first
  const sorted = [...ROUTE_RULES].sort((a, b) => b[0].length - a[0].length);
  for (const [prefix, minRole] of sorted) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) {
      return minRole;
    }
  }
  return null;
}

function hasAccess(userRole: string, minRole: MinRole): boolean {
  if (minRole === "platform") return userRole === "platform_admin";
  if (userRole === "platform_admin") return true;
  return (ROLE_LEVEL[userRole] ?? 0) >= (ROLE_LEVEL[minRole] ?? 0);
}

/**
 * Drop-in guard for the dashboard layout.
 * Silently redirects to /dashboard when the current user lacks access.
 * Renders nothing on its own — just a side-effect hook.
 */
export function RouteAccessGuard() {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoading } = useAuth();
  const { role } = useRole();

  useEffect(() => {
    if (isLoading) return;
    const minRole = resolveMinRole(pathname);
    if (!minRole) return;
    if (!hasAccess(role, minRole)) {
      router.replace("/dashboard");
    }
  }, [pathname, role, isLoading, router]);

  return null;
}
