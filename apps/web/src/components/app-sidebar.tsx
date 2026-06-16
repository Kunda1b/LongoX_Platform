"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useRole, canSeeNavItem } from "@/hooks/use-role";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
  ArrowUpDown,
  Undo2,
  FileDiff,
  ShieldCheck,
  Clock,
  Route,
  Brain,
  CreditCard,
  Activity,
  type LucideIcon,
} from "lucide-react";

type NavRole = "viewer" | "builder" | "admin" | "owner" | "platform";

type NavItem =
  | { separator: true; label?: string }
  | { label: string; href: string; icon: LucideIcon; minRole?: NavRole };

export const sidebarNav: NavItem[] = [
  // ── Main ─────────────────────────────────────────────────────────────────
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Workflows", href: "/workflows", icon: Workflow },
  { label: "Executions", href: "/executions", icon: PlayCircle },
  { label: "Dashboards", href: "/dashboards", icon: Palette },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },

  // ── Build ─────────────────────────────────────────────────────────────────
  { separator: true, label: "Build" },
  { label: "Connectors", href: "/connectors", icon: Cable, minRole: "builder" },
  { label: "Credentials", href: "/credentials", icon: KeyRound, minRole: "builder" },
  { label: "Templates", href: "/templates", icon: LayoutTemplate },
  { label: "Marketplace", href: "/marketplace", icon: ShoppingCart, minRole: "builder" },
  { label: "Apps", href: "/apps", icon: Puzzle, minRole: "builder" },
  { label: "Webhook Endpoints", href: "/webhook-endpoints", icon: Webhook, minRole: "builder" },

  // ── AI ────────────────────────────────────────────────────────────────────
  { separator: true, label: "AI" },
  { label: "AI Playground", href: "/ai/playground", icon: Bot, minRole: "builder" },
  { label: "Prompts", href: "/ai/prompts", icon: FileText, minRole: "builder" },
  { label: "Agents", href: "/ai/agents", icon: Brain, minRole: "builder" },
  { label: "Agent Marketplace", href: "/ai/marketplace", icon: ShoppingCart, minRole: "builder" },
  { label: "AI Analytics", href: "/ai/analytics", icon: BarChart3, minRole: "builder" },
  { label: "AI Models", href: "/ai/models", icon: HardDrive, minRole: "admin" },
  { label: "AI Router", href: "/ai/router", icon: Route, minRole: "admin" },

  // ── Environments ──────────────────────────────────────────────────────────
  { separator: true, label: "Environments" },
  { label: "Environments", href: "/environments", icon: Globe, minRole: "builder" },
  { label: "Promote", href: "/environments/promote", icon: ArrowUpDown, minRole: "admin" },
  { label: "Rollback", href: "/environments/rollback", icon: Undo2, minRole: "admin" },
  { label: "Diff", href: "/environments/diff", icon: FileDiff, minRole: "builder" },

  // ── Manage ────────────────────────────────────────────────────────────────
  { separator: true, label: "Manage" },
  { label: "Audit Log", href: "/audit-log", icon: ScrollText, minRole: "admin" },
  { label: "DLQ", href: "/dlq", icon: HardDrive, minRole: "admin" },
  { label: "Notifications", href: "/notifications", icon: Bell, minRole: "admin" },
  { label: "Compliance", href: "/compliance", icon: ShieldCheck, minRole: "admin" },
  { label: "SSO", href: "/settings/sso", icon: Shield, minRole: "admin" },

  // ── Account ───────────────────────────────────────────────────────────────
  { separator: true, label: "Account" },
  { label: "Billing", href: "/billing", icon: CreditCard, minRole: "owner" },
  { label: "Usage & Metering", href: "/metering", icon: Activity, minRole: "owner" },
  { label: "Team Members", href: "/settings/team", icon: Users, minRole: "admin" },
  { label: "Settings", href: "/settings", icon: Settings },

  // ── Platform (LongoX internal only) ──────────────────────────────────────
  { separator: true, label: "Platform" },
  { label: "Tenants", href: "/tenants", icon: Users, minRole: "platform" },
  { label: "RBAC", href: "/rbac", icon: Shield, minRole: "platform" },
  { label: "Feature Flags", href: "/feature-flags", icon: Flag, minRole: "platform" },
  { label: "Regions", href: "/settings/regions", icon: MapPin, minRole: "platform" },
  { label: "Revenue", href: "/revenue", icon: DollarSign, minRole: "platform" },
  { label: "Audit Export", href: "/compliance/audit-export", icon: ScrollText, minRole: "platform" },
  { label: "Data Retention", href: "/compliance/retention", icon: Clock, minRole: "platform" },
  { label: "GDPR", href: "/compliance/gdpr", icon: ShieldCheck, minRole: "platform" },
];

const ROLE_LABEL: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  builder: "Builder",
  viewer: "Viewer",
  platform_admin: "Platform Admin",
  support: "Support",
  finance: "Finance",
};

function SidebarBrand() {
  return (
    <div className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
        LX
      </div>
      <span className="text-sm font-semibold">LongoX</span>
    </div>
  );
}

function SidebarFooter({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth();
  const { role } = useRole();

  const initials =
    (user?.name ?? "")
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";

  return (
    <div className="shrink-0 border-t p-3">
      <Link
        href="/settings"
        onClick={onNavigate}
        className="mb-2 flex items-center gap-2 min-w-0 rounded-md px-1 py-1 transition-colors hover:bg-sidebar-accent"
        title="Profile settings"
      >
        <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-xs font-semibold text-primary">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user?.name ?? "User"}
              className="h-full w-full object-cover"
            />
          ) : (
            initials
          )}
        </div>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-xs font-medium leading-tight">
            {user?.name ?? user?.email ?? "Guest"}
          </span>
          <span className="text-[10px] leading-tight text-muted-foreground capitalize">
            {ROLE_LABEL[role] ?? role}
          </span>
        </div>
      </Link>
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start gap-2 text-xs"
        onClick={() => {
          onNavigate?.();
          logout();
        }}
      >
        <LogOut className="h-3.5 w-3.5" />
        Sign out
      </Button>
    </div>
  );
}

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { role } = useRole();

  // Collapse empty sections: only emit a separator when at least one item follows it
  const visibleItems: NavItem[] = [];
  let pendingSep: { separator: true; label?: string } | null = null;

  for (const item of sidebarNav) {
    if ("separator" in item) {
      pendingSep = item;
      continue;
    }
    if (!canSeeNavItem(role, item.minRole)) continue;
    if (pendingSep) {
      visibleItems.push(pendingSep);
      pendingSep = null;
    }
    visibleItems.push(item);
  }

  return (
    <nav className="flex-1 overflow-y-auto p-2">
      {visibleItems.map((item, i) => {
        if ("separator" in item) {
          return (
            <div key={i} className="mt-4 mb-1 px-3">
              {item.label && (
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  {item.label}
                </p>
              )}
            </div>
          );
        }
        const Icon = item.icon;
        const active =
          pathname === item.href || pathname?.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AppSidebar() {
  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-56 flex-col border-r bg-sidebar lg:flex">
      <SidebarBrand />
      <SidebarNav />
      <SidebarFooter />
    </aside>
  );
}

type MobileSidebarProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function MobileSidebar({ open, onOpenChange }: MobileSidebarProps) {
  const close = () => onOpenChange(false);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[min(100vw-2rem,18rem)] p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>Navigation menu</SheetTitle>
        </SheetHeader>
        <div className="flex h-full flex-col bg-sidebar">
          <SidebarBrand />
          <SidebarNav onNavigate={close} />
          <SidebarFooter onNavigate={close} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
