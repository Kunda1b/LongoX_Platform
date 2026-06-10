"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Workflow,
  PlayCircle,
  Cable,
  KeyRound,
  LayoutTemplate,
  ShoppingCart,
  BarChart3,
  Palette,
  DollarSign,
  Settings,
  Shield,
  Users,
  Globe,
  Bot,
  FileText,
  Webhook,
  Puzzle,
  ScrollText,
  Flag,
  Bell,
  MapPin,
  HardDrive,
  LogOut,
} from "lucide-react";

const sidebarNav = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Workflows", href: "/workflows", icon: Workflow },
  { label: "Builder", href: "/builder", icon: Workflow },
  { label: "Executions", href: "/executions", icon: PlayCircle },
  { label: "Connectors", href: "/connectors", icon: Cable },
  { label: "Credentials", href: "/credentials", icon: KeyRound },
  { label: "Templates", href: "/templates", icon: LayoutTemplate },
  { label: "Marketplace", href: "/marketplace", icon: ShoppingCart },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Dashboards", href: "/dashboards", icon: Palette },
  { label: "Billing", href: "/billing", icon: DollarSign },
  { separator: true },
  { label: "Environments", href: "/environments", icon: Globe },
  { label: "Tenants", href: "/tenants", icon: Users },
  { label: "RBAC", href: "/rbac", icon: Shield },
  { separator: true },
  { label: "AI Playground", href: "/ai/playground", icon: Bot },
  { label: "AI Models", href: "/ai/models", icon: HardDrive },
  { label: "AI Analytics", href: "/ai/analytics", icon: BarChart3 },
  { label: "Prompts", href: "/ai/prompts", icon: FileText },
  { separator: true },
  { label: "Webhook Endpoints", href: "/webhook-endpoints", icon: Webhook },
  { label: "Apps", href: "/apps", icon: Puzzle },
  { label: "Audit Log", href: "/audit-log", icon: ScrollText },
  { label: "DLQ", href: "/dlq", icon: HardDrive },
  { label: "Feature Flags", href: "/feature-flags", icon: Flag },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Regions", href: "/settings/regions", icon: MapPin },
  { separator: true },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-56 flex-col border-r bg-sidebar">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
          FC
        </div>
        <span className="text-sm font-semibold">LongoX</span>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        {sidebarNav.map((item, i) => {
          if ("separator" in item) {
            return <div key={i} className="my-2 border-t" />;
          }
          const Icon = item.icon!;
          const active =
            pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-3">
        <div className="mb-2 truncate text-xs text-muted-foreground">
          {user?.name ?? user?.email ?? "Guest"}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-xs"
          onClick={logout}
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
