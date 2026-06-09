import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  GitBranch,
  PlayCircle,
  Plug2,
  LayoutGrid,
  FileCode2,
  AlertCircle,
  ShieldCheck,
  KeyRound,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
} from "lucide-react";

const nav = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Workflows", path: "/workflows", icon: GitBranch },
  { label: "Executions", path: "/executions", icon: PlayCircle },
  { label: "Connectors", path: "/connectors", icon: Plug2 },
  { label: "Apps", path: "/apps", icon: LayoutGrid },
  { label: "Templates", path: "/templates", icon: FileCode2 },
  { label: "Dead Letter Queue", path: "/dlq", icon: AlertCircle },
  { label: "Audit Log", path: "/audit", icon: ShieldCheck },
  { label: "Credentials", path: "/credentials", icon: KeyRound },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <aside
        className={cn(
          "relative flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-200 shrink-0",
          collapsed ? "w-12" : "w-56"
        )}
      >
        <div className={cn("flex items-center gap-2 h-14 px-3 border-b border-sidebar-border shrink-0", collapsed && "justify-center px-0")}>
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-sidebar-primary text-sidebar-primary-foreground shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          {!collapsed && (
            <span className="font-semibold text-sm tracking-tight text-sidebar-foreground">AutoFlow</span>
          )}
        </div>

        <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden">
          {nav.map(({ label, path, icon: Icon }) => {
            const active = location === path || (path !== "/dashboard" && location.startsWith(path));
            return (
              <Link key={path} href={path}>
                <a
                  title={collapsed ? label : undefined}
                  className={cn(
                    "flex items-center gap-2.5 mx-1.5 mb-0.5 px-2 py-2 rounded text-[0.8125rem] font-medium transition-colors cursor-pointer",
                    active
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                    collapsed && "justify-center px-0 mx-0 rounded-none w-full"
                  )}
                >
                  <Icon className={cn("shrink-0", collapsed ? "w-5 h-5" : "w-4 h-4")} />
                  {!collapsed && <span className="truncate">{label}</span>}
                </a>
              </Link>
            );
          })}
        </nav>

        <div className={cn("border-t border-sidebar-border py-2", collapsed ? "flex justify-center" : "px-2")}>
          <Link href="/settings">
            <a className={cn(
              "flex items-center gap-2.5 px-2 py-2 rounded text-[0.8125rem] font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors",
              collapsed && "justify-center px-0 w-full rounded-none"
            )}>
              <Settings className={cn("shrink-0", collapsed ? "w-5 h-5" : "w-4 h-4")} />
              {!collapsed && <span>Settings</span>}
            </a>
          </Link>
        </div>

        <button
          onClick={() => setCollapsed((c) => !c)}
          className="absolute -right-3 top-16 z-10 flex items-center justify-center w-6 h-6 rounded-full bg-sidebar-border text-sidebar-foreground border border-sidebar-border hover:bg-sidebar-accent transition-colors"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
