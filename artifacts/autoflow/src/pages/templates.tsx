import { useState } from "react";
import { useLocation } from "wouter";
import { useListTemplates, getListTemplatesQueryKey, useUseTemplate } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, FileCode2, GitFork } from "lucide-react";

const complexityColors: Record<string, string> = {
  beginner: "bg-emerald-100 text-emerald-700 border-emerald-200",
  intermediate: "bg-amber-100 text-amber-700 border-amber-200",
  advanced: "bg-red-100 text-red-700 border-red-200",
};

const categoryLabels: Record<string, string> = {
  all: "All",
  crm: "CRM",
  ai: "AI & ML",
  payment: "Payment",
  reporting: "Reporting",
  support: "Support",
  data: "Data",
  marketing: "Marketing",
};

type Template = {
  id: number; name: string; description: string; category: string; triggerType: string;
  nodeCount: number; uses: number; complexity: string; tags: string[]; isCustom: boolean;
};

export default function TemplatesPage() {
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [usingId, setUsingId] = useState<number | null>(null);

  const templates = useListTemplates({ category: category !== "all" ? category : undefined, search: search || undefined });
  const useMut = useUseTemplate();

  function handleUse(id: number) {
    setUsingId(id);
    useMut.mutate({ id }, {
      onSuccess: (wf) => navigate(`/workflows/${wf.id}`),
      onSettled: () => setUsingId(null),
    });
  }

  const cats = Object.keys(categoryLabels);

  return (
    <div className="flex h-full">
      <aside className="w-44 shrink-0 border-r bg-muted/20 py-4">
        <p className="px-4 text-[0.7rem] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Category</p>
        {cats.map((key) => (
          <button
            key={key}
            onClick={() => setCategory(key)}
            className={`w-full text-left px-4 py-1.5 text-sm transition-colors ${
              category === key ? "bg-primary/10 text-primary font-medium" : "text-foreground/70 hover:bg-accent hover:text-foreground"
            }`}
          >
            {categoryLabels[key]}
          </button>
        ))}
      </aside>

      <div className="flex-1 p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-semibold">Templates</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Start from a pre-built workflow template</p>
          </div>
          <div className="relative w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-8 h-8 text-sm" placeholder="Search templates..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        {templates.isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48" />)}
          </div>
        ) : (templates.data ?? []).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FileCode2 className="w-10 h-10 text-muted-foreground/40 mb-3" />
            <p className="font-medium text-sm">No templates found</p>
            <p className="text-xs text-muted-foreground mt-1">Try a different category or search term.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {(templates.data ?? []).map((t: Template) => (
              <div key={t.id} className="border rounded-lg p-4 bg-card hover:border-primary/40 transition-colors flex flex-col gap-3">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="font-medium text-sm">{t.name}</span>
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[0.65rem] font-medium border shrink-0 ${complexityColors[t.complexity] ?? complexityColors.beginner}`}>
                      {t.complexity}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{t.description}</p>
                </div>

                <div className="flex flex-wrap gap-1">
                  {(t.tags ?? []).slice(0, 3).map((tag) => (
                    <span key={tag} className="text-[0.65rem] px-1.5 py-0.5 bg-muted rounded text-muted-foreground">{tag}</span>
                  ))}
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-auto">
                  <span>{t.nodeCount} nodes</span>
                  <span className="capitalize">{t.triggerType}</span>
                  <span className="ml-auto flex items-center gap-1">
                    <GitFork className="w-3 h-3" />
                    {(t.uses / 1000).toFixed(1)}k uses
                  </span>
                </div>

                <Button
                  size="sm"
                  className="w-full h-7 text-xs"
                  disabled={usingId === t.id}
                  onClick={() => handleUse(t.id)}
                >
                  {usingId === t.id ? "Creating..." : "Use Template"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
