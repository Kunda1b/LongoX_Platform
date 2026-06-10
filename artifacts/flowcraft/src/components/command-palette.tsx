import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { useGlobalSearch } from "@autoflow/api-client-react";
import { Workflow, LayoutDashboard, Package, Layers, Zap, FileText, Settings, BarChart3, Flag, Bell, Globe, Shield, Building2, CreditCard, MapPin } from "lucide-react";

const TYPE_ICONS: Record<string, typeof Workflow> = {
  workflow: Workflow,
  app: LayoutDashboard,
  template: Layers,
  connector: Package,
};

const NAV_SHORTCUTS = [
  { label: "Workflows", url: "/workflows", icon: Workflow, group: "Navigate" },
  { label: "Executions", url: "/executions", icon: Zap, group: "Navigate" },
  { label: "Templates", url: "/templates", icon: Layers, group: "Navigate" },
  { label: "Connectors", url: "/connectors", icon: Package, group: "Navigate" },
  { label: "Apps", url: "/apps", icon: LayoutDashboard, group: "Navigate" },
  { label: "Dashboards", url: "/dashboards", icon: BarChart3, group: "Navigate" },
  { label: "Analytics", url: "/analytics", icon: BarChart3, group: "Navigate" },
  { label: "AI Models", url: "/ai/models", icon: FileText, group: "AI Platform" },
  { label: "Prompt Registry", url: "/ai/prompts", icon: FileText, group: "AI Platform" },
  { label: "AI Analytics", url: "/ai/analytics", icon: BarChart3, group: "AI Platform" },
  { label: "Feature Flags", url: "/feature-flags", icon: Flag, group: "Platform" },
  { label: "Notifications", url: "/notifications", icon: Bell, group: "Platform" },
  { label: "Billing", url: "/billing", icon: CreditCard, group: "Distribution" },
  { label: "Environments", url: "/environments", icon: Globe, group: "Distribution" },
  { label: "Access Control", url: "/rbac", icon: Shield, group: "Settings" },
  { label: "Tenants", url: "/tenants", icon: Building2, group: "Settings" },
  { label: "Credentials", url: "/credentials", icon: Settings, group: "Settings" },
  { label: "Regions", url: "/settings/regions", icon: MapPin, group: "Settings" },
];

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [, setLocation] = useLocation();

  const debouncedQuery = useDebounce(query, 300);
  const { data: searchResults } = useGlobalSearch({ q: debouncedQuery }, { query: { enabled: debouncedQuery.length >= 2, queryKey: [] } });

  function navigate(url: string) {
    setLocation(url);
    onOpenChange(false);
    setQuery("");
  }

  const filteredNav = NAV_SHORTCUTS.filter((n) =>
    !query || n.label.toLowerCase().includes(query.toLowerCase())
  );

  const groups = Array.from(new Set(filteredNav.map((n) => n.group)));

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search workflows, apps, templates…" value={query} onValueChange={setQuery} />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* API search results */}
        {debouncedQuery.length >= 2 && searchResults && searchResults.results.length > 0 && (
          <CommandGroup heading="Search Results">
            {searchResults.results.map((r) => {
              const Icon = TYPE_ICONS[r.type] ?? Workflow;
              return (
                <CommandItem key={`${r.type}-${r.id}`} onSelect={() => navigate(r.url)}>
                  <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{r.title}</span>
                  {r.description && <span className="ml-2 text-xs text-muted-foreground truncate">{r.description}</span>}
                  <span className="ml-auto text-[10px] text-muted-foreground uppercase">{r.type}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        {/* Navigation shortcuts */}
        {groups.map((group) => (
          <CommandGroup key={group} heading={group}>
            {filteredNav.filter((n) => n.group === group).map(({ label, url, icon: Icon }) => (
              <CommandItem key={url} onSelect={() => navigate(url)}>
                <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                {label}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}

export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  const toggle = useCallback(() => setOpen((o) => !o), []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        toggle();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);

  return { open, setOpen };
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
