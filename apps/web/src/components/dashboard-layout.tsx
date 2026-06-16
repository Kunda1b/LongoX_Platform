"use client";

import { type ReactNode, useState } from "react";
import { AppSidebar, MobileSidebar } from "@/components/app-sidebar";
import { TenantSwitcher } from "@/components/shell/tenant-switcher";
import { EnvironmentSwitcher } from "@/components/shell/environment-switcher";
import { GlobalSearch } from "@/components/shell/global-search";
import { CommandPalette } from "@/components/shell/command-palette";
import { NotificationCenter } from "@/components/shell/notification-center";
import { EmailVerificationBanner } from "@/components/email-verification-banner";
import Link from "next/link";
import { Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const openSearch = () => {
    const event = new KeyboardEvent("keydown", {
      metaKey: true,
      key: "k",
    });
    document.dispatchEvent(event);
  };

  return (
    <div className="flex min-h-screen min-w-0">
      <AppSidebar />
      <MobileSidebar open={mobileNavOpen} onOpenChange={setMobileNavOpen} />

      <div className="flex min-w-0 flex-1 flex-col lg:ml-56">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-3 sm:gap-3 sm:px-4 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 lg:hidden"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex min-w-0 flex-1 items-center gap-1 sm:gap-2">
            <div className="min-w-0 flex-1 sm:flex-none sm:max-w-[160px] md:max-w-[200px]">
              <TenantSwitcher />
            </div>
            <div className="hidden h-4 w-px shrink-0 bg-border sm:block" />
            <div className="hidden min-w-0 md:block">
              <EnvironmentSwitcher />
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <button
              type="button"
              className="flex items-center gap-2 rounded-md border bg-muted/50 px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted sm:px-3"
              onClick={openSearch}
              aria-label="Open search"
            >
              <Search className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">Search...</span>
              <kbd className="hidden rounded border bg-background px-1 font-mono text-[10px] md:inline">
                ⌘K
              </kbd>
            </button>
            <NotificationCenter />
            <div className="hidden h-4 w-px bg-border sm:block" />
            <Link
              href="/settings"
              className="flex items-center gap-2 text-sm rounded-md px-1 py-0.5 transition-colors hover:bg-accent"
              title="Profile settings"
            >
              <div className="relative flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-xs font-semibold text-primary ring-1 ring-transparent hover:ring-primary/30 transition-all">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user?.name ?? "User"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  user?.name?.charAt(0)?.toUpperCase() ?? "U"
                )}
              </div>
              <span className="hidden max-w-[120px] truncate font-medium md:inline">
                {user?.name}
              </span>
            </Link>
          </div>
        </header>

        <EmailVerificationBanner />

        <main className="min-w-0 flex-1 overflow-x-hidden p-4 sm:p-5 lg:p-6">
          {children}
        </main>
      </div>

      <GlobalSearch />
      <CommandPalette />
    </div>
  );
}
