"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  FileText,
  Workflow,
  Users,
  Settings,
  Globe,
  Command,
} from "lucide-react";
import { cn } from "@/lib/utils";

const searchRoutes = [
  { label: "Dashboard", href: "/dashboard", icon: FileText },
  { label: "Workflows", href: "/workflows", icon: Workflow },
  { label: "Executions", href: "/executions", icon: Workflow },
  { label: "Connectors", href: "/connectors", icon: Globe },
  { label: "Tenants", href: "/tenants", icon: Users },
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "Environments", href: "/environments", icon: Globe },
  { label: "Audit Log", href: "/audit-log", icon: FileText },
  { label: "Notifications", href: "/notifications", icon: FileText },
  { label: "RBAC", href: "/rbac", icon: Users },
  { label: "Billing", href: "/billing", icon: FileText },
  { label: "Feature Flags", href: "/feature-flags", icon: FileText },
  { label: "Marketplace", href: "/marketplace", icon: Globe },
  { label: "Templates", href: "/templates", icon: FileText },
  { label: "Analytics", href: "/analytics", icon: FileText },
  { label: "Promote", href: "/environments/promote", icon: Globe },
  { label: "Rollback", href: "/environments/rollback", icon: Globe },
  { label: "Promotions", href: "/environments/promotions", icon: Globe },
  { label: "Compliance", href: "/compliance", icon: FileText },
  { label: "Data Retention", href: "/compliance/retention", icon: FileText },
  { label: "GDPR", href: "/compliance/gdpr", icon: FileText },
  { label: "Audit Export", href: "/compliance/audit-export", icon: FileText },
  { label: "SSO", href: "/settings/sso", icon: Settings },
];

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setSelectedIndex(0);
    }
  }, [open]);

  const filtered = query.trim()
    ? searchRoutes.filter((r) =>
        r.label.toLowerCase().includes(query.toLowerCase()),
      )
    : searchRoutes;

  const handleSelect = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        handleSelect(filtered[selectedIndex].href);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="w-full max-w-lg rounded-lg border bg-background shadow-2xl overflow-hidden">
        <div className="flex items-center border-b px-3">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search pages..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="flex h-12 w-full bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground"
          />
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-xs">
              ESC
            </kbd>
          </div>
        </div>
        <div className="max-h-72 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No results found
            </div>
          ) : (
            filtered.map((item, i) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.href}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                    i === selectedIndex
                      ? "bg-accent text-accent-foreground"
                      : "text-foreground hover:bg-accent/50",
                  )}
                  onClick={() => handleSelect(item.href)}
                  onMouseEnter={() => setSelectedIndex(i)}
                >
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span>{item.label}</span>
                </button>
              );
            })
          )}
        </div>
        <div className="border-t px-3 py-2 text-xs text-muted-foreground flex items-center gap-4">
          <span>
            <kbd className="rounded border bg-muted px-1 font-mono">↑↓</kbd>{" "}
            Navigate
          </span>
          <span>
            <kbd className="rounded border bg-muted px-1 font-mono">↵</kbd> Open
          </span>
          <span className="ml-auto">
            <kbd className="rounded border bg-muted px-1 font-mono">⌘K</kbd>{" "}
            Toggle
          </span>
        </div>
      </div>
    </div>
  );
}
