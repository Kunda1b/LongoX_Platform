"use client";

import { type ReactNode } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { TenantSwitcher } from "@/components/shell/tenant-switcher";
import { EnvironmentSwitcher } from "@/components/shell/environment-switcher";
import { GlobalSearch } from "@/components/shell/global-search";
import { CommandPalette } from "@/components/shell/command-palette";
import { NotificationCenter } from "@/components/shell/notification-center";
import { Search, Command } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <div className="ml-56 flex-1 flex flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-6">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <TenantSwitcher />
            <div className="h-4 w-px bg-border" />
            <EnvironmentSwitcher />
          </div>
          <div className="flex items-center gap-2">
            <button
              className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted transition-colors"
              onClick={() => {
                const event = new KeyboardEvent("keydown", {
                  metaKey: true,
                  key: "k",
                });
                document.dispatchEvent(event);
              }}
            >
              <Search className="h-3.5 w-3.5" />
              <span>Search...</span>
              <kbd className="rounded border bg-background px-1 font-mono text-[10px]">⌘K</kbd>
            </button>
            <NotificationCenter />
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2 text-sm">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
              </div>
              <span className="text-sm font-medium hidden md:inline">
                {user?.name}
              </span>
            </div>
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
      <GlobalSearch />
      <CommandPalette />
    </div>
  );
}
