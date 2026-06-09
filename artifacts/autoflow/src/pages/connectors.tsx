import { useState } from "react";
import { useListConnectors, getListConnectorsQueryKey, useInstallConnector, useListConnectorCategories } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, CheckCircle2, Star } from "lucide-react";

const categoryLabels: Record<string, string> = {
  all: "All",
  communication: "Communication",
  crm: "CRM",
  ai: "AI & ML",
  data: "Data",
  database: "Database",
  payment: "Payment",
  development: "Development",
  other: "Other",
};

function ConnectorCard({ c, onInstall, installing }: {
  c: {
    id: number; name: string; icon: string; color: string | null; category: string;
    description: string; isInstalled: boolean; isFeatured: boolean; actionCount: number;
    triggerCount: number; installCount: number; rating: number | null;
  };
  onInstall: (id: number) => void;
  installing: boolean;
}) {
  const initials = c.name.slice(0, 2).toUpperCase();
  const bg = c.color ?? "#6366f1";

  return (
    <div className="border rounded-lg p-4 bg-card hover:border-primary/40 transition-colors flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: bg }}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-medium text-sm">{c.name}</span>
            {c.isFeatured && <Badge className="text-[0.65rem] px-1 py-0 bg-violet-100 text-violet-700 border-violet-200">Featured</Badge>}
            {c.isInstalled && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{c.description}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>{c.actionCount} actions</span>
        <span>{c.triggerCount} triggers</span>
        {c.rating && (
          <span className="flex items-center gap-0.5">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            {c.rating.toFixed(1)}
          </span>
        )}
        <span className="ml-auto">{(c.installCount / 1000).toFixed(1)}k installs</span>
      </div>

      <Button
        size="sm"
        variant={c.isInstalled ? "secondary" : "default"}
        className="w-full h-7 text-xs"
        disabled={c.isInstalled || installing}
        onClick={() => !c.isInstalled && onInstall(c.id)}
      >
        {c.isInstalled ? "Installed" : installing ? "Installing..." : "Install"}
      </Button>
    </div>
  );
}

export default function ConnectorsPage() {
  const qc = useQueryClient();
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [installingId, setInstallingId] = useState<number | null>(null);

  const connectors = useListConnectors({ category: category !== "all" ? category : undefined, search: search || undefined });
  const categories = useListConnectorCategories();
  const installMut = useInstallConnector();

  function handleInstall(id: number) {
    setInstallingId(id);
    installMut.mutate({ id }, {
      onSuccess: () => qc.invalidateQueries({ queryKey: getListConnectorsQueryKey() }),
      onSettled: () => setInstallingId(null),
    });
  }

  const categoryList = [
    { key: "all", label: "All" },
    ...(categories.data ?? []).map((c: { name: string; count: number }) => ({
      key: c.name,
      label: `${categoryLabels[c.name] ?? c.name} (${c.count})`,
    })),
  ];

  return (
    <div className="flex h-full">
      <aside className="w-44 shrink-0 border-r bg-muted/20 py-4">
        <p className="px-4 text-[0.7rem] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Categories</p>
        {categoryList.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setCategory(key)}
            className={`w-full text-left px-4 py-1.5 text-sm transition-colors ${
              category === key ? "bg-primary/10 text-primary font-medium" : "text-foreground/70 hover:bg-accent hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </aside>

      <div className="flex-1 p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-semibold">Connectors</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Integrate third-party services into your workflows</p>
          </div>
          <div className="relative w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-8 h-8 text-sm" placeholder="Search connectors..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        {connectors.isLoading ? (
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
            {Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} className="h-36" />)}
          </div>
        ) : (connectors.data ?? []).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-sm text-muted-foreground">
            No connectors found matching your search.
          </div>
        ) : (
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
            {(connectors.data ?? []).map((c: Parameters<typeof ConnectorCard>[0]["c"]) => (
              <ConnectorCard key={c.id} c={c} onInstall={handleInstall} installing={installingId === c.id} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
