"use client";

import { useAuth } from "@/lib/auth";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building2,
  Flag,
  Shield,
  ScrollText,
  FileCheck,
  CreditCard,
} from "lucide-react";

const ADMIN_NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/tenants", label: "Tenants", icon: Building2 },
  { href: "/admin/feature-flags", label: "Feature Flags", icon: Flag },
  { href: "/admin/rbac", label: "RBAC", icon: Shield },
  { href: "/admin/audit-log", label: "Audit Log", icon: ScrollText },
  { href: "/admin/compliance", label: "Compliance", icon: FileCheck },
  { href: "/admin/billing", label: "Billing", icon: CreditCard },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-48">Loading...</div>
    );

  if (!user || (user.role !== "Admin" && user.role !== "Owner")) {
    router.push("/dashboard");
    return null;
  }

  return (
    <div className="flex gap-6 h-full">
      <nav className="w-56 shrink-0 space-y-1 border-r pr-4">
        <div className="mb-4 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Admin
        </div>
        {ADMIN_NAV.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
