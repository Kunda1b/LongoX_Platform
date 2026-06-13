"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Terminal,
  Workflow,
  PlayCircle,
  Cable,
  FileText,
  Settings,
  Users,
  Globe,
  Shield,
  BarChart3,
  Bell,
  Search,
  Plus,
  Download,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Command {
  id: string;
  label: string;
  description: string;
  icon: typeof Terminal;
  action: () => void;
  keywords: string[];
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const commands: Command[] = [
    { id: "go-dashboard", label: "Go to Dashboard", description: "Navigate to dashboard", icon: BarChart3, action: () => router.push("/dashboard"), keywords: ["dashboard", "home", "main"] },
    { id: "go-workflows", label: "Go to Workflows", description: "Navigate to workflows", icon: Workflow, action: () => router.push("/workflows"), keywords: ["workflow", "automation"] },
    { id: "go-executions", label: "Go to Executions", description: "View execution history", icon: PlayCircle, action: () => router.push("/executions"), keywords: ["execution", "run", "history"] },
    { id: "go-connectors", label: "Go to Connectors", description: "Manage connectors", icon: Cable, action: () => router.push("/connectors"), keywords: ["connector", "integration"] },
    { id: "go-environments", label: "Go to Environments", description: "Manage environments", icon: Globe, action: () => router.push("/environments"), keywords: ["env", "deploy", "promote"] },
    { id: "promote-workflow", label: "Promote Workflow", description: "Promote a workflow between environments", icon: Plus, action: () => router.push("/environments/promote"), keywords: ["promote", "deploy", "release"] },
    { id: "go-settings", label: "Go to Settings", description: "Open settings", icon: Settings, action: () => router.push("/settings"), keywords: ["settings", "preferences", "config"] },
    { id: "go-tenants", label: "Go to Tenants", description: "Manage tenants", icon: Users, action: () => router.push("/tenants"), keywords: ["tenant", "organization"] },
    { id: "go-rbac", label: "Go to RBAC", description: "Manage roles and permissions", icon: Shield, action: () => router.push("/rbac"), keywords: ["role", "permission", "access", "rbac"] },
    { id: "go-audit", label: "Go to Audit Log", description: "View audit log", icon: FileText, action: () => router.push("/audit-log"), keywords: ["audit", "log", "event"] },
    { id: "go-notifications", label: "Go to Notifications", description: "View notifications", icon: Bell, action: () => router.push("/notifications"), keywords: ["notification", "alert"] },
    { id: "go-search", label: "Global Search", description: "Search across the platform", icon: Search, action: () => router.push("/search"), keywords: ["search", "find"] },
    { id: "export-audit", label: "Export Audit Log", description: "Export audit log to CSV/JSON", icon: Download, action: () => router.push("/compliance/audit-export"), keywords: ["export", "audit", "csv", "json"] },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "p") {
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
    ? commands.filter(
        (c) =>
          c.label.toLowerCase().includes(query.toLowerCase()) ||
          c.description.toLowerCase().includes(query.toLowerCase()) ||
          c.keywords.some((k) => k.includes(query.toLowerCase())),
      )
    : commands;

  const handleSelect = (cmd: Command) => {
    setOpen(false);
    cmd.action();
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
        handleSelect(filtered[selectedIndex]);
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
          <Terminal className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="flex h-12 w-full bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="max-h-72 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No matching commands
            </div>
          ) : (
            filtered.map((cmd, i) => {
              const Icon = cmd.icon;
              return (
                <button
                  key={cmd.id}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                    i === selectedIndex
                      ? "bg-accent text-accent-foreground"
                      : "text-foreground hover:bg-accent/50",
                  )}
                  onClick={() => handleSelect(cmd)}
                  onMouseEnter={() => setSelectedIndex(i)}
                >
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 text-left">
                    <div className="font-medium">{cmd.label}</div>
                    <div className="text-xs text-muted-foreground">{cmd.description}</div>
                  </div>
                </button>
              );
            })
          )}
        </div>
        <div className="border-t px-3 py-2 text-xs text-muted-foreground flex items-center gap-4">
          <span><kbd className="rounded border bg-muted px-1 font-mono">↑↓</kbd> Navigate</span>
          <span><kbd className="rounded border bg-muted px-1 font-mono">↵</kbd> Run</span>
          <span className="ml-auto"><kbd className="rounded border bg-muted px-1 font-mono">⌘⇧P</kbd> Toggle</span>
        </div>
      </div>
    </div>
  );
}
