import { useState } from "react";
import { useLocation } from "wouter";
import { useListTemplates, useUseTemplate } from "@workspace/api-client-react";
import type { Template } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search, FileCode2, GitFork, GitBranch, LayoutDashboard,
  Package, Code2, Sparkles, Copy, Check, Database, ShieldCheck,
  Workflow,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ─── Types & constants ────────────────────────────────────────────────────────

type TemplateTypeKey = "workflow" | "dashboard" | "industry_bundle" | "developer" | "ai_powered";

const TYPES: { key: TemplateTypeKey; label: string; icon: React.ElementType }[] = [
  { key: "workflow", label: "Workflows", icon: GitBranch },
  { key: "dashboard", label: "Dashboards", icon: LayoutDashboard },
  { key: "industry_bundle", label: "Bundles", icon: Package },
  { key: "developer", label: "Developer", icon: Code2 },
  { key: "ai_powered", label: "AI-Powered", icon: Sparkles },
];

const CATEGORIES: Record<TemplateTypeKey, { key: string; label: string }[]> = {
  workflow: [
    { key: "all", label: "All" },
    { key: "CRM", label: "CRM" },
    { key: "Communication", label: "Communication" },
    { key: "Finance", label: "Finance" },
    { key: "HR", label: "HR" },
    { key: "Sales", label: "Sales" },
    { key: "Support", label: "Support" },
    { key: "Data", label: "Data" },
    { key: "Reporting", label: "Reporting" },
    { key: "Operations", label: "Operations" },
    { key: "Developer", label: "Developer" },
    { key: "Research", label: "Research" },
  ],
  dashboard: [
    { key: "all", label: "All" },
    { key: "Sales", label: "Sales" },
    { key: "Support", label: "Support" },
    { key: "Operations", label: "Operations" },
    { key: "Real Estate", label: "Real Estate" },
  ],
  industry_bundle: [
    { key: "all", label: "All" },
    { key: "Real Estate", label: "Real Estate" },
    { key: "E-Commerce", label: "E-Commerce" },
    { key: "Healthcare", label: "Healthcare" },
    { key: "Education", label: "Education" },
  ],
  developer: [
    { key: "all", label: "All" },
    { key: "Connector", label: "Connector" },
    { key: "Node", label: "Node" },
    { key: "Component", label: "Component" },
  ],
  ai_powered: [
    { key: "all", label: "All" },
    { key: "Real Estate", label: "Real Estate" },
    { key: "SaaS", label: "SaaS" },
    { key: "Agency", label: "Agency" },
  ],
};

const complexityColors: Record<string, string> = {
  beginner: "bg-emerald-100 text-emerald-700 border-emerald-200",
  intermediate: "bg-amber-100 text-amber-700 border-amber-200",
  advanced: "bg-red-100 text-red-700 border-red-200",
};

// ─── Card Variants ─────────────────────────────────────────────────────────────

function WorkflowCardContent({
  t, usingId, onUse,
}: { t: Template & { templateType?: string }; usingId: number | null; onUse: (id: number) => void }) {
  return (
    <div className="border rounded-lg p-4 bg-card hover:border-primary/40 transition-colors flex flex-col gap-3">
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
          <GitFork className="w-3 h-3" />{(t.uses / 1000).toFixed(1)}k
        </span>
      </div>
      <Button size="sm" className="w-full h-7 text-xs" disabled={usingId === t.id} onClick={() => onUse(t.id)}>
        {usingId === t.id ? "Creating…" : "Use Template"}
      </Button>
    </div>
  );
}

function DashboardCardContent({
  t, onUse,
}: { t: Template & { templateType?: string }; onUse: () => void }) {
  const meta = (t.metadata ?? {}) as Record<string, unknown>;
  const components = (meta.components as string[]) ?? [];
  const dataSources = (meta.dataSources as string[]) ?? [];
  return (
    <div className="border rounded-lg p-4 bg-card hover:border-primary/40 transition-colors flex flex-col gap-3">
      <div>
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <span className="font-medium text-sm">{t.name}</span>
          <span className="text-[0.65rem] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded border border-blue-200 shrink-0">{t.category}</span>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">{t.description}</p>
      </div>
      <div>
        <p className="text-[0.6rem] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Components</p>
        <div className="flex flex-wrap gap-1">
          {components.map((c) => <span key={c} className="text-[0.6rem] px-1.5 py-0.5 bg-primary/8 text-primary border border-primary/20 rounded">{c}</span>)}
        </div>
      </div>
      <div className="flex flex-wrap gap-1 mt-auto">
        {dataSources.map((ds) => <span key={ds} className="text-[0.6rem] px-1.5 py-0.5 bg-muted rounded text-muted-foreground">{ds}</span>)}
      </div>
      <Button size="sm" className="w-full h-7 text-xs" onClick={onUse}>Install Dashboard</Button>
    </div>
  );
}

function BundleCardContent({ t, onInstall }: { t: Template & { templateType?: string }; onInstall: () => void }) {
  const meta = (t.metadata ?? {}) as Record<string, unknown>;
  const wfs = (meta.workflows as string[]) ?? [];
  const dbs = (meta.dashboards as string[]) ?? [];
  return (
    <div className="border rounded-lg p-4 bg-card hover:border-primary/40 transition-colors flex flex-col gap-3 border-violet-100">
      <div>
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <span className="font-medium text-sm">{t.name}</span>
          <span className="text-[0.65rem] px-1.5 py-0.5 bg-violet-100 text-violet-700 border border-violet-200 rounded shrink-0">{t.category}</span>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">{t.description}</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded border p-2 bg-muted/30">
          <p className="text-[0.6rem] font-semibold text-muted-foreground uppercase mb-1 flex items-center gap-1"><Workflow className="w-2.5 h-2.5" />Workflows</p>
          {wfs.slice(0, 3).map((w) => <p key={w} className="text-[0.65rem] truncate">· {w}</p>)}
          {wfs.length > 3 && <p className="text-[0.6rem] text-muted-foreground">+{wfs.length - 3} more</p>}
        </div>
        <div className="rounded border p-2 bg-muted/30">
          <p className="text-[0.6rem] font-semibold text-muted-foreground uppercase mb-1 flex items-center gap-1"><LayoutDashboard className="w-2.5 h-2.5" />Dashboards</p>
          {dbs.slice(0, 3).map((d) => <p key={d} className="text-[0.65rem] truncate">· {d}</p>)}
          {dbs.length > 3 && <p className="text-[0.6rem] text-muted-foreground">+{dbs.length - 3} more</p>}
        </div>
      </div>
      <div className="flex gap-1.5">
        {meta.includesDatabase && <span className="flex items-center gap-1 text-[0.6rem] px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-200"><Database className="w-2.5 h-2.5" />DB Schema</span>}
        {meta.includesPermissions && <span className="flex items-center gap-1 text-[0.6rem] px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded border border-amber-200"><ShieldCheck className="w-2.5 h-2.5" />Permissions</span>}
      </div>
      <Button size="sm" className="w-full h-7 text-xs" onClick={onInstall}>Install Bundle</Button>
    </div>
  );
}

function DeveloperCardContent({ t }: { t: Template & { templateType?: string } }) {
  const [copied, setCopied] = useState(false);
  const meta = (t.metadata ?? {}) as Record<string, unknown>;
  const snippet = (meta.codeSnippet as string) ?? "";

  function copyCode() {
    navigator.clipboard.writeText(snippet).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="border rounded-lg p-4 bg-card hover:border-primary/40 transition-colors flex flex-col gap-3">
      <div>
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <span className="font-medium text-sm">{t.name}</span>
          <span className="text-[0.65rem] px-1.5 py-0.5 bg-zinc-100 text-zinc-700 border border-zinc-200 rounded shrink-0">{t.category}</span>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">{t.description}</p>
      </div>
      <div className="rounded bg-zinc-950 overflow-hidden">
        <pre className="text-[10px] leading-relaxed text-zinc-300 p-3 overflow-x-auto max-h-[100px]"><code>{snippet}</code></pre>
      </div>
      <Button size="sm" variant="outline" className="w-full h-7 text-xs gap-1.5" onClick={copyCode}>
        {copied ? <><Check className="w-3 h-3 text-green-500" />Copied!</> : <><Copy className="w-3 h-3" />Copy Starter</>}
      </Button>
    </div>
  );
}

function AIPoweredCardContent({ t, usingId, onUse }: { t: Template & { templateType?: string }; usingId: number | null; onUse: (id: number) => void }) {
  const meta = (t.metadata ?? {}) as Record<string, unknown>;
  const prompt = (meta.prompt as string) ?? "";
  const gWorkflows = (meta.generatedWorkflows as string[]) ?? [];
  const gDashboards = (meta.generatedDashboards as string[]) ?? [];

  return (
    <div className="border rounded-lg p-4 bg-gradient-to-br from-violet-500/5 via-card to-card hover:border-violet-300 transition-colors flex flex-col gap-3 border-violet-200/50">
      <div>
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <span className="font-medium text-sm">{t.name}</span>
          <Badge className="text-[0.6rem] bg-violet-600 text-white shrink-0 gap-0.5 px-1.5 py-0.5"><Sparkles className="w-2.5 h-2.5" />AI</Badge>
        </div>
        <p className="text-[0.65rem] italic bg-muted/50 rounded px-1.5 py-1 text-muted-foreground">"{prompt}"</p>
      </div>
      <div className="space-y-1.5">
        <div className="flex flex-wrap gap-1">
          <span className="text-[0.6rem] text-muted-foreground mr-0.5">Workflows:</span>
          {gWorkflows.map((w) => <span key={w} className="text-[0.6rem] px-1 py-0.5 bg-blue-100 text-blue-700 rounded">{w}</span>)}
        </div>
        <div className="flex flex-wrap gap-1">
          <span className="text-[0.6rem] text-muted-foreground mr-0.5">Dashboards:</span>
          {gDashboards.map((d) => <span key={d} className="text-[0.6rem] px-1 py-0.5 bg-violet-100 text-violet-700 rounded">{d}</span>)}
        </div>
      </div>
      <Button size="sm" className="w-full h-7 text-xs gap-1 bg-violet-600 hover:bg-violet-700" disabled={usingId === t.id} onClick={() => onUse(t.id)}>
        <Sparkles className="w-3 h-3" />{usingId === t.id ? "Applying…" : "Use Setup"}
      </Button>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function TemplatesPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeType, setActiveType] = useState<TemplateTypeKey>("workflow");
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [usingId, setUsingId] = useState<number | null>(null);
  const [aiPrompt, setAiPrompt] = useState("");

  const templates = useListTemplates();
  const useMut = useUseTemplate();

  function handleTypeChange(type: TemplateTypeKey) {
    setActiveType(type);
    setCategory("all");
    setSearch("");
  }

  function handleUse(id: number) {
    setUsingId(id);
    useMut.mutate({ id }, {
      onSuccess: (wf) => navigate(`/workflows/${wf.id}`),
      onSettled: () => setUsingId(null),
    });
  }

  function handleDashboardUse() {
    toast({ title: "Dashboard installed!", description: "Navigating to Apps…" });
    setTimeout(() => navigate("/apps"), 800);
  }

  function handleBundleInstall(t: Template & { templateType?: string }) {
    const meta = (t.metadata ?? {}) as Record<string, unknown>;
    const wfs = ((meta.workflows as string[]) ?? []).length;
    const dbs = ((meta.dashboards as string[]) ?? []).length;
    toast({ title: `Bundle installed: ${t.name}`, description: `Created ${wfs} workflows and ${dbs} dashboards.` });
    setTimeout(() => navigate("/apps"), 800);
  }

  function handleAIGenerate() {
    if (!aiPrompt.trim()) return;
    toast({ title: "AI generation coming soon!", description: `Received: "${aiPrompt}"` });
  }

  const allTemplates = (templates.data ?? []) as (Template & { templateType?: string })[];

  const filtered = allTemplates.filter((t) => {
    const tType = t.templateType ?? "workflow";
    if (tType !== activeType) return false;
    if (category !== "all" && t.category !== category) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase()) && !t.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const cats = CATEGORIES[activeType];

  return (
    <div className="flex h-full">
      {/* ─── Sidebar ──────────────────────────────────────────────────────── */}
      <aside className="w-48 shrink-0 border-r bg-muted/20 py-4 overflow-y-auto">
        <p className="px-4 text-[0.7rem] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Type</p>
        {TYPES.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => handleTypeChange(key)}
            className={`w-full text-left px-4 py-1.5 text-sm transition-colors flex items-center gap-2 ${
              activeType === key ? "bg-primary/10 text-primary font-medium" : "text-foreground/70 hover:bg-accent hover:text-foreground"
            }`}
          >
            <Icon className="w-3.5 h-3.5 shrink-0" />
            {label}
            {key === "ai_powered" && <span className="ml-auto text-[0.55rem] px-1 py-0.5 bg-violet-100 text-violet-700 rounded font-semibold">AI</span>}
          </button>
        ))}

        <div className="mt-4 pt-4 border-t">
          <p className="px-4 text-[0.7rem] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Category</p>
          {cats.map(({ key, label }) => (
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
        </div>
      </aside>

      {/* ─── Main Content ─────────────────────────────────────────────────── */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-semibold">
              {TYPES.find((t) => t.key === activeType)?.label ?? "Templates"}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {activeType === "workflow" && "One-click automation starters"}
              {activeType === "dashboard" && "Pre-built internal app dashboards"}
              {activeType === "industry_bundle" && "Full-stack bundles for your industry"}
              {activeType === "developer" && "Starter kits for connector and node developers"}
              {activeType === "ai_powered" && "AI-generated setups from a business description"}
            </p>
          </div>
          {activeType !== "ai_powered" && (
            <div className="relative w-52">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input className="pl-8 h-8 text-sm" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          )}
        </div>

        {/* AI Generate Hero */}
        {activeType === "ai_powered" && (
          <div className="rounded-xl border border-violet-200 bg-gradient-to-br from-violet-500/10 via-background to-background p-5 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-violet-600" />
              <span className="font-semibold text-sm">Generate a custom setup with AI</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">Describe your business and get a complete set of workflows, dashboards, and role permissions.</p>
            <div className="flex gap-2">
              <Input
                className="flex-1 h-8 text-sm"
                placeholder={`"I run a real estate agency in The Gambia"`}
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAIGenerate()}
              />
              <Button size="sm" className="bg-violet-600 hover:bg-violet-700 gap-1 shrink-0" onClick={handleAIGenerate} disabled={!aiPrompt.trim()}>
                <Sparkles className="w-3.5 h-3.5" /> Generate
              </Button>
            </div>
          </div>
        )}

        {/* Cards */}
        {templates.isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-52" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileCode2 className="w-8 h-8 text-muted-foreground/40 mb-3" />
            <p className="font-medium text-sm">No templates found</p>
            <p className="text-xs text-muted-foreground mt-1">Try a different category or search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map((t) => {
              const type = t.templateType ?? "workflow";
              if (type === "dashboard") return <DashboardCardContent key={t.id} t={t} onUse={handleDashboardUse} />;
              if (type === "industry_bundle") return <BundleCardContent key={t.id} t={t} onInstall={() => handleBundleInstall(t)} />;
              if (type === "developer") return <DeveloperCardContent key={t.id} t={t} />;
              if (type === "ai_powered") return <AIPoweredCardContent key={t.id} t={t} usingId={usingId} onUse={handleUse} />;
              return <WorkflowCardContent key={t.id} t={t} usingId={usingId} onUse={handleUse} />;
            })}
          </div>
        )}
      </div>
    </div>
  );
}
