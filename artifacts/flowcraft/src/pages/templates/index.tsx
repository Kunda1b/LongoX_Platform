import { useState } from "react";
import { useLocation } from "wouter";
import {
  useListTemplates,
  useUseTemplate,
  useCreateTemplate,
  useDeleteTemplate,
  useForkTemplate,
  getListTemplatesQueryKey,
} from "@longox/api-client-react";
import type { Template } from "@longox/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Layers,
  Activity,
  Plus,
  Trash2,
  Eye,
  GitBranch,
  LayoutDashboard,
  Package,
  Code2,
  Sparkles,
  Copy,
  Check,
  Database,
  ShieldCheck,
  Workflow,
  GitFork,
} from "lucide-react";
import { TemplatePreviewDialog } from "@/components/template-preview-dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// ─── Constants ─────────────────────────────────────────────────────────────────

type TemplateTypeKey =
  | "workflow"
  | "dashboard"
  | "industry_bundle"
  | "developer"
  | "ai_powered";

const TEMPLATE_TYPES: {
  key: TemplateTypeKey;
  label: string;
  icon: React.ElementType;
  badge?: string;
}[] = [
  { key: "workflow", label: "Workflows", icon: GitBranch },
  { key: "dashboard", label: "Dashboards", icon: LayoutDashboard },
  { key: "industry_bundle", label: "Industry Bundles", icon: Package },
  { key: "developer", label: "Developer", icon: Code2 },
  { key: "ai_powered", label: "AI-Powered", icon: Sparkles, badge: "Premium" },
];

const CATEGORIES_BY_TYPE: Record<TemplateTypeKey, string[]> = {
  workflow: [
    "All",
    "CRM",
    "Communication",
    "Finance",
    "HR",
    "Sales",
    "Support",
    "Data",
    "Reporting",
    "Operations",
    "Developer",
    "Research",
  ],
  dashboard: ["All", "Sales", "Support", "Operations", "Real Estate"],
  industry_bundle: [
    "All",
    "Real Estate",
    "E-Commerce",
    "Healthcare",
    "Education",
  ],
  developer: ["All", "Connector", "Node", "Component"],
  ai_powered: ["All", "Real Estate", "SaaS", "Agency"],
};

const TRIGGER_TYPES = [
  "webhook",
  "schedule",
  "form",
  "email",
  "manual",
  "event",
];

type CreateFormState = {
  name: string;
  description: string;
  category: string;
  triggerType: string;
  complexity: "beginner" | "intermediate" | "advanced";
  tagsInput: string;
};

const EMPTY_FORM: CreateFormState = {
  name: "",
  description: "",
  category: "Operations",
  triggerType: "webhook",
  complexity: "beginner",
  tagsInput: "",
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function complexityColor(c: string) {
  if (c === "beginner")
    return "bg-green-500/10 text-green-600 hover:bg-green-500/20";
  if (c === "intermediate")
    return "bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20";
  if (c === "advanced") return "bg-red-500/10 text-red-600 hover:bg-red-500/20";
  return "bg-gray-500/10 text-gray-600";
}

function fmtUses(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

// ─── Card Components ───────────────────────────────────────────────────────────

function WorkflowCard({
  template,
  onPreview,
  onDelete,
  onUse,
  onFork,
  isUsing,
  isForking,
}: {
  template: Template;
  onPreview: () => void;
  onDelete?: () => void;
  onUse: () => void;
  onFork: () => void;
  isUsing: boolean;
  isForking: boolean;
}) {
  return (
    <Card className="flex flex-col h-full overflow-hidden hover:border-primary/50 transition-colors group">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className={complexityColor(template.complexity)}
            >
              {template.complexity}
            </Badge>
            {template.isCustom && (
              <Badge
                variant="outline"
                className="text-[10px] uppercase font-semibold border-primary/40 text-primary bg-primary/5"
              >
                Custom
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
              <Activity className="h-3 w-3" />
              {fmtUses(template.uses)} uses
            </span>
            <button
              className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation();
                onPreview();
              }}
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
              title="Fork template"
              onClick={(e) => {
                e.stopPropagation();
                onFork();
              }}
            >
              <GitFork className="h-4 w-4" />
            </button>
            {template.isCustom && onDelete && (
              <button
                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        <CardTitle className="text-lg">{template.name}</CardTitle>
        <p className="text-sm text-muted-foreground line-clamp-2 mt-1 min-h-[40px]">
          {template.description}
        </p>
      </CardHeader>
      <CardContent className="pb-4 flex-1">
        <div className="flex flex-wrap gap-2 mb-4">
          {template.tags?.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="text-[10px] uppercase font-semibold text-muted-foreground bg-muted/40"
            >
              {tag}
            </Badge>
          ))}
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Layers className="h-4 w-4" />
            <span>{template.nodeCount} nodes</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
            <span className="truncate max-w-[120px]">
              {template.triggerType}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0 mt-auto border-t bg-muted/20 p-4 gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={onFork}
          disabled={isForking}
          title="Fork into an editable copy"
        >
          <GitFork className="h-3.5 w-3.5" />
          {isForking ? "Forking…" : "Fork"}
        </Button>
        <Button
          className="flex-1 font-medium shadow-none hover:shadow-sm"
          onClick={onUse}
          disabled={isUsing}
        >
          {isUsing ? "Applying…" : "Use Template"}
        </Button>
      </CardFooter>
    </Card>
  );
}

function DashboardCard({
  template,
  onUse,
}: {
  template: Template;
  onUse: () => void;
}) {
  const meta = (template.metadata ?? {}) as Record<string, unknown>;
  const components = (meta.components as string[]) ?? [];
  const dataSources = (meta.dataSources as string[]) ?? [];

  return (
    <Card className="flex flex-col h-full overflow-hidden hover:border-primary/50 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start mb-2">
          <Badge variant="secondary" className="bg-blue-500/10 text-blue-600">
            {template.category}
          </Badge>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Activity className="h-3 w-3" />
            {fmtUses(template.uses)} installs
          </span>
        </div>
        <CardTitle className="text-lg">{template.name}</CardTitle>
        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
          {template.description}
        </p>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Components
          </p>
          <div className="flex flex-wrap gap-1.5">
            {components.map((c) => (
              <span
                key={c}
                className="text-xs px-2 py-1 bg-primary/8 border border-primary/20 text-primary rounded-md font-medium"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Data Sources
          </p>
          <div className="flex flex-wrap gap-1.5">
            {dataSources.map((ds) => (
              <span
                key={ds}
                className="text-xs px-2 py-1 bg-muted rounded text-muted-foreground"
              >
                {ds}
              </span>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0 mt-auto border-t bg-muted/20 p-4">
        <Button
          className="w-full font-medium shadow-none hover:shadow-sm"
          onClick={onUse}
        >
          Install Dashboard
        </Button>
      </CardFooter>
    </Card>
  );
}

function BundleCard({
  template,
  onInstall,
}: {
  template: Template;
  onInstall: () => void;
}) {
  const meta = (template.metadata ?? {}) as Record<string, unknown>;
  const workflows = (meta.workflows as string[]) ?? [];
  const dashboards = (meta.dashboards as string[]) ?? [];
  const hasDb = meta.includesDatabase as boolean;
  const hasPerms = meta.includesPermissions as boolean;

  return (
    <Card className="flex flex-col h-full overflow-hidden hover:border-primary/50 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start mb-2">
          <Badge
            variant="secondary"
            className="bg-violet-500/10 text-violet-600"
          >
            {template.category}
          </Badge>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Activity className="h-3 w-3" />
            {fmtUses(template.uses)} installs
          </span>
        </div>
        <CardTitle className="text-lg">{template.name}</CardTitle>
        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
          {template.description}
        </p>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Workflow className="h-3.5 w-3.5 text-blue-500" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Workflows
              </span>
            </div>
            <ul className="space-y-1">
              {workflows.map((w) => (
                <li key={w} className="text-xs text-foreground/80 truncate">
                  · {w}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <LayoutDashboard className="h-3.5 w-3.5 text-violet-500" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Dashboards
              </span>
            </div>
            <ul className="space-y-1">
              {dashboards.map((d) => (
                <li key={d} className="text-xs text-foreground/80 truncate">
                  · {d}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasDb && (
            <span className="flex items-center gap-1 text-xs px-2 py-1 bg-emerald-500/10 text-emerald-700 rounded border border-emerald-200">
              <Database className="h-3 w-3" /> DB Schema
            </span>
          )}
          {hasPerms && (
            <span className="flex items-center gap-1 text-xs px-2 py-1 bg-amber-500/10 text-amber-700 rounded border border-amber-200">
              <ShieldCheck className="h-3 w-3" /> Permissions
            </span>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-0 mt-auto border-t bg-muted/20 p-4">
        <Button
          className="w-full font-medium shadow-none hover:shadow-sm"
          variant="default"
          onClick={onInstall}
        >
          Install Bundle
        </Button>
      </CardFooter>
    </Card>
  );
}

function DeveloperCard({ template }: { template: Template }) {
  const [copied, setCopied] = useState(false);
  const meta = (template.metadata ?? {}) as Record<string, unknown>;
  const snippet = (meta.codeSnippet as string) ?? "";
  const starterType = (meta.starterType as string) ?? "";

  function copyCode() {
    navigator.clipboard.writeText(snippet).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const starterBadgeColor: Record<string, string> = {
    "oauth-connector": "bg-blue-500/10 text-blue-600",
    "api-key-connector": "bg-amber-500/10 text-amber-700",
    "webhook-connector": "bg-violet-500/10 text-violet-600",
    "action-node": "bg-green-500/10 text-green-700",
    "polling-node": "bg-cyan-500/10 text-cyan-700",
    "table-component": "bg-pink-500/10 text-pink-700",
    "chart-component": "bg-orange-500/10 text-orange-700",
    "metric-card": "bg-indigo-500/10 text-indigo-700",
  };

  return (
    <Card className="flex flex-col h-full overflow-hidden hover:border-primary/50 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start mb-2">
          <Badge
            variant="secondary"
            className={
              starterBadgeColor[starterType] ?? "bg-gray-500/10 text-gray-600"
            }
          >
            {starterType.replace(/-/g, " ")}
          </Badge>
          <Badge
            variant="outline"
            className="text-[10px] text-muted-foreground"
          >
            {template.category}
          </Badge>
        </div>
        <CardTitle className="text-base">{template.name}</CardTitle>
        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
          {template.description}
        </p>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="relative rounded-md overflow-hidden border bg-zinc-950">
          <pre className="text-[11px] leading-relaxed text-zinc-300 p-3 overflow-x-auto max-h-[140px]">
            <code>{snippet}</code>
          </pre>
        </div>
      </CardContent>
      <CardFooter className="pt-0 mt-auto border-t bg-muted/20 p-4">
        <Button
          className="w-full font-medium shadow-none hover:shadow-sm gap-2"
          variant="outline"
          onClick={copyCode}
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-green-500" /> Copied!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" /> Copy Starter Code
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

function AIPoweredCard({
  template,
  onUse,
  isUsing,
}: {
  template: Template;
  onUse: () => void;
  isUsing: boolean;
}) {
  const meta = (template.metadata ?? {}) as Record<string, unknown>;
  const prompt = (meta.prompt as string) ?? "";
  const gWorkflows = (meta.generatedWorkflows as string[]) ?? [];
  const gDashboards = (meta.generatedDashboards as string[]) ?? [];
  const roles = (meta.roles as string[]) ?? [];

  return (
    <Card className="flex flex-col h-full overflow-hidden hover:border-primary/50 transition-colors border-violet-200/50 bg-gradient-to-br from-violet-500/5 via-background to-background">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start mb-2">
          <Badge className="bg-violet-600 text-white gap-1">
            <Sparkles className="h-3 w-3" /> AI Generated
          </Badge>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Activity className="h-3 w-3" />
            {fmtUses(template.uses)} uses
          </span>
        </div>
        <CardTitle className="text-lg">{template.name}</CardTitle>
        <p className="text-xs text-muted-foreground mt-1 italic bg-muted/50 rounded px-2 py-1">
          Prompt: "{prompt}"
        </p>
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
            <Workflow className="h-3 w-3 inline mr-1" />
            Workflows ({gWorkflows.length})
          </p>
          <div className="flex flex-wrap gap-1">
            {gWorkflows.map((w) => (
              <span
                key={w}
                className="text-xs px-1.5 py-0.5 bg-blue-500/10 text-blue-700 rounded"
              >
                {w}
              </span>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
            <LayoutDashboard className="h-3 w-3 inline mr-1" />
            Dashboards ({gDashboards.length})
          </p>
          <div className="flex flex-wrap gap-1">
            {gDashboards.map((d) => (
              <span
                key={d}
                className="text-xs px-1.5 py-0.5 bg-violet-500/10 text-violet-700 rounded"
              >
                {d}
              </span>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
            Roles
          </p>
          <div className="flex flex-wrap gap-1">
            {roles.map((r) => (
              <span
                key={r}
                className="text-xs px-1.5 py-0.5 bg-emerald-500/10 text-emerald-700 rounded"
              >
                {r}
              </span>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0 mt-auto border-t bg-muted/20 p-4">
        <Button
          className="w-full font-medium shadow-none hover:shadow-sm bg-violet-600 hover:bg-violet-700 gap-2"
          onClick={onUse}
          disabled={isUsing}
        >
          <Sparkles className="h-4 w-4" />
          {isUsing ? "Applying…" : "Use This Setup"}
        </Button>
      </CardFooter>
    </Card>
  );
}

// ─── AI Generate Hero ──────────────────────────────────────────────────────────

function AIGenerateHero({
  onGenerate,
}: {
  onGenerate: (prompt: string) => void;
}) {
  const [prompt, setPrompt] = useState("");
  return (
    <div className="rounded-xl border border-violet-200 bg-gradient-to-br from-violet-500/10 via-background to-background p-6 mb-8">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="h-5 w-5 text-violet-600" />
        <h2 className="font-semibold text-lg">
          Generate a custom template with AI
        </h2>
        <Badge className="bg-violet-100 text-violet-700 border-violet-200 text-[10px]">
          Premium
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Describe your business and our AI will generate a complete set of
        workflows, dashboards, and role permissions tailored to you.
      </p>
      <div className="flex gap-3">
        <Input
          placeholder={`e.g. "I run a real estate agency in The Gambia"`}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="flex-1"
          onKeyDown={(e) =>
            e.key === "Enter" && prompt.trim() && onGenerate(prompt)
          }
        />
        <Button
          className="shrink-0 gap-2 bg-violet-600 hover:bg-violet-700"
          onClick={() => prompt.trim() && onGenerate(prompt)}
          disabled={!prompt.trim()}
        >
          <Sparkles className="h-4 w-4" /> Generate
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        Or explore AI-generated examples below ↓
      </p>
    </div>
  );
}

// ─── Empty State ───────────────────────────────────────────────────────────────

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="col-span-full flex min-w-0 flex-1 flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-12 text-center">
      <div className="bg-muted text-foreground flex size-12 shrink-0 items-center justify-center rounded-lg">
        <Layers className="size-6" />
      </div>
      <div className="flex max-w-sm flex-col items-center gap-1">
        <div className="text-lg font-medium tracking-tight">
          No templates found
        </div>
        <p className="text-muted-foreground text-sm/relaxed">
          Try a different category or search term.
        </p>
      </div>
      <Button variant="outline" onClick={onClear}>
        Clear filters
      </Button>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function Templates() {
  const [activeType, setActiveType] = useState<TemplateTypeKey>("workflow");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<CreateFormState>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [bundleTarget, setBundleTarget] = useState<Template | null>(null);

  const { data: allTemplates = [], isLoading } = useListTemplates();

  const useMutation = useUseTemplate({
    mutation: {
      onSuccess: (newWorkflow) => {
        setPreviewTemplate(null);
        toast({
          title: "Template applied!",
          description: "Opening workflow builder…",
        });
        setLocation(`/workflows/${newWorkflow.id}`);
      },
      onError: () =>
        toast({ title: "Failed to apply template", variant: "destructive" }),
    },
  });

  const createMutation = useCreateTemplate({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTemplatesQueryKey() });
        toast({ title: "Template created!" });
        setCreateOpen(false);
        setForm(EMPTY_FORM);
      },
      onError: () =>
        toast({ title: "Failed to create template", variant: "destructive" }),
    },
  });

  const deleteMutation = useDeleteTemplate({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTemplatesQueryKey() });
        toast({ title: "Template deleted" });
        setDeleteTarget(null);
      },
      onError: () =>
        toast({ title: "Failed to delete template", variant: "destructive" }),
    },
  });

  const forkMutation = useForkTemplate({
    mutation: {
      onSuccess: (forked) => {
        queryClient.invalidateQueries({ queryKey: getListTemplatesQueryKey() });
        toast({
          title: `Forked: "${forked.name}"`,
          description: "A new editable copy has been created.",
        });
      },
      onError: () => toast({ title: "Fork failed", variant: "destructive" }),
    },
  });

  function handleCreate() {
    const tags = form.tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    createMutation.mutate({
      data: {
        name: form.name,
        description: form.description,
        category: form.category,
        triggerType: form.triggerType,
        complexity: form.complexity,
        tags,
        nodes: [],
      },
    });
  }

  function handleTypeChange(type: TemplateTypeKey) {
    setActiveType(type);
    setCategory("All");
    setSearch("");
  }

  function handleDashboardUse(template: Template) {
    toast({
      title: "Dashboard template queued!",
      description: "Navigate to Apps to find your new dashboard.",
    });
    setTimeout(() => setLocation("/apps"), 1000);
  }

  function handleBundleInstall(template: Template) {
    setBundleTarget(template);
  }

  function handleAIUse(template: Template) {
    useMutation.mutate({ id: template.id });
  }

  function handleAIGenerate(prompt: string) {
    toast({
      title: "AI generation coming soon!",
      description: `We received your prompt: "${prompt}". This feature is in beta.`,
    });
  }

  const filtered = allTemplates.filter((t) => {
    const tType =
      (t as Template & { templateType?: string }).templateType ?? "workflow";
    if (tType !== activeType) return false;
    if (category !== "All" && t.category !== category) return false;
    if (
      search &&
      !t.name.toLowerCase().includes(search.toLowerCase()) &&
      !t.description.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  const currentCategories = CATEGORIES_BY_TYPE[activeType];

  return (
    <div className="space-y-6">
      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Template Marketplace
          </h1>
          <p className="text-muted-foreground mt-2">
            One-click starters for workflows, dashboards, industry bundles, and
            more.
          </p>
        </div>
        {activeType === "workflow" && (
          <Button
            className="gap-2 shrink-0"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-4 w-4" />
            New Template
          </Button>
        )}
      </div>

      {/* ─── Template Type Tabs ──────────────────────────────────────────────── */}
      <div className="flex gap-1 border-b pb-0 overflow-x-auto">
        {TEMPLATE_TYPES.map(({ key, label, icon: Icon, badge }) => (
          <button
            key={key}
            onClick={() => handleTypeChange(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 whitespace-nowrap -mb-px ${
              activeType === key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
            {badge && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 font-semibold">
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ─── Filter Row ──────────────────────────────────────────────────────── */}
      {activeType !== "ai_powered" && (
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <Tabs
            value={category}
            onValueChange={setCategory}
            className="w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0"
          >
            <TabsList className="inline-flex h-9 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
              {currentCategories.map((c) => (
                <TabsTrigger key={c} value={c} className="px-3 py-1 text-sm">
                  {c}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates…"
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* ─── AI-Powered Hero ─────────────────────────────────────────────────── */}
      {activeType === "ai_powered" && (
        <AIGenerateHero onGenerate={handleAIGenerate} />
      )}

      {/* ─── Cards Grid ──────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="text-muted-foreground text-sm">Loading templates…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((template) => {
            const t = template as Template & { templateType?: string };
            const type = t.templateType ?? "workflow";

            if (type === "dashboard") {
              return (
                <DashboardCard
                  key={t.id}
                  template={t}
                  onUse={() => handleDashboardUse(t)}
                />
              );
            }
            if (type === "industry_bundle") {
              return (
                <BundleCard
                  key={t.id}
                  template={t}
                  onInstall={() => handleBundleInstall(t)}
                />
              );
            }
            if (type === "developer") {
              return <DeveloperCard key={t.id} template={t} />;
            }
            if (type === "ai_powered") {
              return (
                <AIPoweredCard
                  key={t.id}
                  template={t}
                  onUse={() => handleAIUse(t)}
                  isUsing={useMutation.isPending}
                />
              );
            }
            return (
              <WorkflowCard
                key={t.id}
                template={t}
                onPreview={() => setPreviewTemplate(t)}
                onDelete={t.isCustom ? () => setDeleteTarget(t.id) : undefined}
                onUse={() => useMutation.mutate({ id: t.id })}
                onFork={() => forkMutation.mutate({ id: t.id })}
                isUsing={useMutation.isPending}
                isForking={
                  forkMutation.isPending && forkMutation.variables?.id === t.id
                }
              />
            );
          })}
          {filtered.length === 0 && (
            <EmptyState
              onClear={() => {
                setSearch("");
                setCategory("All");
              }}
            />
          )}
        </div>
      )}

      {/* ─── Bundle Install Dialog ───────────────────────────────────────────── */}
      <Dialog
        open={bundleTarget !== null}
        onOpenChange={(open) => !open && setBundleTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Install {bundleTarget?.name}</DialogTitle>
          </DialogHeader>
          {bundleTarget &&
            (() => {
              const meta = (bundleTarget.metadata ?? {}) as Record<
                string,
                unknown
              >;
              const wfs = (meta.workflows as string[]) ?? [];
              const dbs = (meta.dashboards as string[]) ?? [];
              return (
                <div className="space-y-4 py-2">
                  <p className="text-sm text-muted-foreground">
                    This bundle will create the following for your workspace:
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border p-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                        {wfs.length} Workflows
                      </p>
                      <ul className="space-y-1">
                        {wfs.map((w) => (
                          <li key={w} className="text-xs">
                            · {w}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                        {dbs.length} Dashboards
                      </p>
                      <ul className="space-y-1">
                        {dbs.map((d) => (
                          <li key={d} className="text-xs">
                            · {d}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  {(!!meta.includesDatabase || !!meta.includesPermissions) && (
                    <div className="flex gap-2">
                      {!!meta.includesDatabase && (
                        <Badge
                          variant="outline"
                          className="text-emerald-700 border-emerald-200 gap-1"
                        >
                          <Database className="h-3 w-3" />
                          DB Schema
                        </Badge>
                      )}
                      {!!meta.includesPermissions && (
                        <Badge
                          variant="outline"
                          className="text-amber-700 border-amber-200 gap-1"
                        >
                          <ShieldCheck className="h-3 w-3" />
                          Permissions
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              onClick={() => {
                toast({
                  title: "Bundle installed!",
                  description: "Your workflows and dashboards are ready.",
                });
                setBundleTarget(null);
                setLocation("/apps");
              }}
            >
              Install Bundle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Create Template Dialog ──────────────────────────────────────────── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Custom Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="e.g. Daily Digest Email"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                placeholder="What does this workflow do?"
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>
                  Category <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES_BY_TYPE.workflow
                      .filter((c) => c !== "All")
                      .map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>
                  Trigger Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.triggerType}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, triggerType: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRIGGER_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Complexity</Label>
              <Select
                value={form.complexity}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    complexity: v as CreateFormState["complexity"],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Tags</Label>
              <Input
                placeholder="email, crm, reporting (comma-separated)"
                value={form.tagsInput}
                onChange={(e) =>
                  setForm((f) => ({ ...f, tagsInput: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              onClick={handleCreate}
              disabled={!form.name.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? "Creating…" : "Create Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation ─────────────────────────────────────────────── */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this template?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() =>
                deleteTarget !== null &&
                deleteMutation.mutate({ id: deleteTarget })
              }
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Template Preview Dialog ─────────────────────────────────────────── */}
      <TemplatePreviewDialog
        template={previewTemplate}
        open={previewTemplate !== null}
        onClose={() => setPreviewTemplate(null)}
        onUse={(id) => useMutation.mutate({ id })}
        isUsing={useMutation.isPending}
      />
    </div>
  );
}
