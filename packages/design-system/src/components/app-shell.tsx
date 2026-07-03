/**
 * AppShell — the top-level layout component for authenticated LongoX apps.
 *
 * Per architecture.md §29.2: "First five primitives (Button, Input, Dialog,
 * Tabs, Tooltip) and AppShell component" are Phase 1 design-system deliverables.
 *
 * The AppShell provides:
 *   - Top navigation bar (logo, tenant switcher, user menu, notifications)
 *   - Optional left sidebar (collapsible, with nav items)
 *   - Main content area (children)
 *   - Optional right panel (for context-specific panels like execution details)
 *
 * The shell is intentionally presentational — it does not own data fetching.
 * The host app passes nav items, user info, and tenant context as props so
 * the shell can render consistently across web/admin/marketplace apps.
 */

import * as React from "react";
import { cn } from "../utils";

export interface AppShellNavItem {
  id: string;
  label: string;
  href: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  active?: boolean;
}

export interface AppShellUserMenu {
  name: string;
  email: string;
  avatarUrl?: string;
  tenantName?: string;
  tenantRole?: string;
  items: Array<{
    id: string;
    label: string;
    href?: string;
    onClick?: () => void;
    danger?: boolean;
  }>;
}

export interface AppShellProps {
  /** Logo element (usually the LX hex monogram). */
  logo?: React.ReactNode;
  /** Top-bar nav items (right-aligned). */
  topNav?: AppShellNavItem[];
  /** Left-sidebar nav items. Omit to hide the sidebar. */
  sideNav?: AppShellNavItem[];
  /** Currently active side-nav item id. */
  activeSideNavId?: string;
  /** User menu (top-right dropdown). */
  userMenu?: AppShellUserMenu;
  /** Notifications bell content. */
  notifications?: React.ReactNode;
  /** Right-panel content (e.g. execution details). Omit to hide. */
  rightPanel?: React.ReactNode;
  /** Search bar (top-center). Omit to hide. */
  searchSlot?: React.ReactNode;
  /** Page title (rendered in the top bar). */
  pageTitle?: string;
  /** Breadcrumbs rendered above the main content. */
  breadcrumbs?: React.ReactNode;
  /** Children — main content area. */
  children?: React.ReactNode;
  /** Optional footer. */
  footer?: React.ReactNode;
  /** Sidebar collapsed state (controlled). */
  sidebarCollapsed?: boolean;
  /** Sidebar collapse toggle callback. */
  onSidebarToggle?: () => void;
  /** Additional className for the root element. */
  className?: string;
  /** Test id for the root element. */
  testId?: string;
}

/**
 * AppShell — renders the standard authenticated layout.
 *
 * Layout structure:
 *
 *   ┌─────────────────────────────────────────────────────────────────┐
 *   │ [logo]  [pageTitle]      [search]      [topNav]  [🔔] [user]    │  top bar
 *   ├──────────────┬───────────────────────────────────┬──────────────┤
 *   │              │  [breadcrumbs]                     │              │
 *   │  sideNav     │                                   │  rightPanel  │
 *   │              │  children (main content)          │              │
 *   │              │                                   │              │
 *   ├──────────────┴───────────────────────────────────┴──────────────┤
 *   │  footer                                                         │
 *   └─────────────────────────────────────────────────────────────────┘
 */
export function AppShell({
  logo,
  topNav = [],
  sideNav,
  activeSideNavId,
  userMenu,
  notifications,
  rightPanel,
  searchSlot,
  pageTitle,
  breadcrumbs,
  children,
  footer,
  sidebarCollapsed = false,
  onSidebarToggle,
  className,
  testId,
}: AppShellProps): React.ReactElement {
  const hasSidebar = Boolean(sideNav && sideNav.length > 0);
  const hasRightPanel = Boolean(rightPanel);

  return (
    <div
      className={cn(
        "longox-app-shell",
        "flex h-screen flex-col bg-background text-foreground",
        className,
      )}
      data-testid={testId}
    >
      {/* ─── Top bar ───────────────────────────────────────────────────── */}
      <header
        className={cn(
          "longox-app-shell__topbar",
          "flex h-14 shrink-0 items-center gap-4 border-b border-border px-4",
        )}
      >
        {hasSidebar && (
          <button
            type="button"
            onClick={onSidebarToggle}
            aria-label="Toggle sidebar"
            className={cn(
              "longox-app-shell__sidebar-toggle",
              "inline-flex h-8 w-8 items-center justify-center rounded text-muted-foreground",
              "hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden
            >
              <path
                d="M2 4h12M2 8h12M2 12h12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}

        {logo && <div className="longox-app-shell__logo shrink-0">{logo}</div>}

        {pageTitle && (
          <h1 className="longox-app-shell__title truncate text-base font-semibold">
            {pageTitle}
          </h1>
        )}

        {searchSlot && (
          <div className="longox-app-shell__search mx-auto w-full max-w-md">
            {searchSlot}
          </div>
        )}

        <nav className="longox-app-shell__topnav ml-auto flex items-center gap-1">
          {topNav.map((item) => (
            <a
              key={item.id}
              href={item.href}
              className={cn(
                "longox-app-shell__topnav-item",
                "inline-flex h-8 items-center gap-2 rounded-md px-3 text-sm font-medium",
                "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                item.active && "bg-accent text-accent-foreground",
              )}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.badge}
            </a>
          ))}
        </nav>

        {notifications && (
          <div className="longox-app-shell__notifications">{notifications}</div>
        )}

        {userMenu && (
          <details className="longox-app-shell__user-menu relative">
            <summary
              className={cn(
                "longox-app-shell__user-menu-trigger",
                "flex cursor-pointer list-none items-center gap-2 rounded-full",
              )}
            >
              {userMenu.avatarUrl ? (
                <img
                  src={userMenu.avatarUrl}
                  alt={userMenu.name}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                  {userMenu.name.slice(0, 2).toUpperCase()}
                </div>
              )}
            </summary>
            <div
              className={cn(
                "longox-app-shell__user-menu-dropdown",
                "absolute right-0 top-full mt-2 w-64 rounded-md border border-border bg-popover p-1 shadow-md",
              )}
            >
              <div className="px-3 py-2">
                <div className="text-sm font-semibold">{userMenu.name}</div>
                <div className="text-xs text-muted-foreground">
                  {userMenu.email}
                </div>
                {userMenu.tenantName && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    {userMenu.tenantName}
                    {userMenu.tenantRole && ` · ${userMenu.tenantRole}`}
                  </div>
                )}
              </div>
              <div className="my-1 h-px bg-border" />
              {userMenu.items.map((item) => (
                <a
                  key={item.id}
                  href={item.href}
                  onClick={item.onClick}
                  className={cn(
                    "block rounded-sm px-3 py-1.5 text-sm",
                    "text-foreground hover:bg-accent hover:text-accent-foreground",
                    item.danger &&
                      "text-destructive hover:bg-destructive hover:text-destructive-foreground",
                  )}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </details>
        )}
      </header>

      {/* ─── Body: sidebar + main + right panel ───────────────────────── */}
      <div className="longox-app-shell__body flex flex-1 overflow-hidden">
        {hasSidebar && !sidebarCollapsed && (
          <aside
            className={cn(
              "longox-app-shell__sidebar",
              "w-60 shrink-0 overflow-y-auto border-r border-border bg-sidebar",
            )}
          >
            <nav className="p-2">
              {(sideNav ?? []).map((item) => (
                <a
                  key={item.id}
                  href={item.href}
                  className={cn(
                    "longox-app-shell__sidenav-item",
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium",
                    "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    (item.active || item.id === activeSideNavId) &&
                      "bg-sidebar-accent text-sidebar-accent-foreground",
                  )}
                >
                  {item.icon}
                  <span className="flex-1">{item.label}</span>
                  {item.badge}
                </a>
              ))}
            </nav>
          </aside>
        )}

        <main
          className={cn(
            "longox-app-shell__main",
            "flex flex-1 flex-col overflow-y-auto",
          )}
        >
          {breadcrumbs && (
            <div className="border-b border-border px-6 py-2">
              {breadcrumbs}
            </div>
          )}
          <div className="longox-app-shell__content flex-1 p-6">{children}</div>
          {footer && (
            <footer className="border-t border-border px-6 py-3 text-xs text-muted-foreground">
              {footer}
            </footer>
          )}
        </main>

        {hasRightPanel && (
          <aside
            className={cn(
              "longox-app-shell__right-panel",
              "w-80 shrink-0 overflow-y-auto border-l border-border bg-panel",
            )}
          >
            {rightPanel}
          </aside>
        )}
      </div>
    </div>
  );
}

export default AppShell;
