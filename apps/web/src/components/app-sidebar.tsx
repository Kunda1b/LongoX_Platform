"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
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
  Download,
  Clock,
  Route,
  Brain,
  type LucideIcon,
} from "lucide-react";

type NavItem =
  | { separator: true }
  | { label: string; href: string; icon: LucideIcon };

export const sidebarNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Workflows", href: "/workflows", icon: Workflow },
  { label: "Executions", href: "/executions", icon: PlayCircle },
  { label: "Connectors", href: "/connectors", icon: Cable },
  { label: "Credentials", href: "/credentials", icon: KeyRound },
  { label: "Templates", href: "/templates", icon: LayoutTemplate },
  { label: "Marketplace", href: "/marketplace", icon: ShoppingCart },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Dashboards", href: "/dashboards", icon: Palette },
  { label: "Billing", href: "/billing", icon: DollarSign },
  { label: "Usage & Metering", href: "/metering", icon: BarChart3 },
  { separator: true },
  { label: "Environments", href: "/environments", icon: Globe },
  { label: "Promote", href: "/environments/promote", icon: ArrowUpDown },
  { label: "Rollback", href: "/environments/rollback", icon: Undo2 },
  { label: "Diff", href: "/environments/diff", icon: FileDiff },
  { label: "Promotions", href: "/environments/promotions", icon: Globe },
  { label: "Tenants", href: "/tenants", icon: Users },
  { label: "RBAC", href: "/rbac", icon: Shield },
  { separator: true },
  { label: "AI Playground", href: "/ai/playground", icon: Bot },
  { label: "AI Models", href: "/ai/models", icon: HardDrive },
  { label: "AI Router", href: "/ai/router", icon: Route },
  { label: "AI Analytics", href: "/ai/analytics", icon: BarChart3 },
  { label: "Prompts", href: "/ai/prompts", icon: FileText },
  { label: "Agents", href: "/ai/agents", icon: Brain },
  { label: "Agent Marketplace", href: "/ai/marketplace", icon: ShoppingCart },
  { separator: true },
  { label: "Webhook Endpoints", href: "/webhook-endpoints", icon: Webhook },
  { label: "Apps", href: "/apps", icon: Puzzle },
  { label: "Audit Log", href: "/audit-log", icon: ScrollText },
  { label: "DLQ", href: "/dlq", icon: HardDrive },
  { label: "Feature Flags", href: "/feature-flags", icon: Flag },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Regions", href: "/settings/regions", icon: MapPin },
  { separator: true },
  { label: "Revenue", href: "/revenue", icon: DollarSign },
  { separator: true },
  { label: "Compliance", href: "/compliance", icon: ShieldCheck },
  { label: "Audit Export", href: "/compliance/audit-export", icon: Download },
  { label: "Data Retention", href: "/compliance/retention", icon: Clock },
  { label: "GDPR", href: "/compliance/gdpr", icon: ShieldCheck },
  { separator: true },
  { label: "SSO", href: "/settings/sso", icon: Shield },
  { separator: true },
  { label: "Settings", href: "/settings", icon: Settings },
];

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

  const initials = (user?.name ?? "")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  return (
    <div className="shrink-0 border-t p-3">
      <div className="mb-2 flex items-center gap-2 min-w-0">
        <div className="relative flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-xs font-semibold text-primary">
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
        <span className="truncate text-xs font-medium">
          {user?.name ?? user?.email ?? "Guest"}
        </span>
      </div>
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

  return (
    <nav className="flex-1 overflow-y-auto p-2">
      {sidebarNav.map((item, i) => {
        if ("separator" in item) {
          return <div key={i} className="my-2 border-t" />;
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
