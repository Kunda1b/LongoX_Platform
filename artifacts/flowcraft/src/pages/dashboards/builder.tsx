import { useState, useCallback, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetDashboard,
  useUpdateDashboard,
  usePublishDashboard,
  getGetDashboardQueryKey,
  getListDashboardsQueryKey,
} from "@autoflow/api-client-react";
import type { DashboardWidget } from "@autoflow/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Save,
  Rocket,
  Plus,
  Trash2,
  BarChart2,
  Table2,
  Type,
  Image,
  Minus,
  TrendingUp,
  Globe,
  GripVertical,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

// ─── Widget type catalogue ─────────────────────────────────────────────────

const WIDGET_TYPES: {
  type: DashboardWidget["type"];
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  defaultConfig: Record<string, unknown>;
  defaultColSpan: number;
  defaultRowSpan: number;
}[] = [
  {
    type: "kpi",
    label: "KPI Card",
    description: "Metric, label, and trend",
    icon: <TrendingUp className="h-4 w-4" />,
    color: "bg-blue-500/10 text-blue-500",
    defaultConfig: { label: "Total Executions", value: "1,234", trend: "+12%", trendUp: true },
    defaultColSpan: 3,
    defaultRowSpan: 2,
  },
  {
    type: "chart",
    label: "Chart",
    description: "Bar, line, or area chart",
    icon: <BarChart2 className="h-4 w-4" />,
    color: "bg-violet-500/10 text-violet-500",
    defaultConfig: { title: "Executions over time", chartType: "bar" },
    defaultColSpan: 6,
    defaultRowSpan: 4,
  },
  {
    type: "table",
    label: "Data Table",
    description: "Tabular data view",
    icon: <Table2 className="h-4 w-4" />,
    color: "bg-emerald-500/10 text-emerald-500",
    defaultConfig: { title: "Recent Runs", columns: ["Name", "Status", "Duration"] },
    defaultColSpan: 8,
    defaultRowSpan: 4,
  },
  {
    type: "text",
    label: "Text Block",
    description: "Rich text or Markdown",
    icon: <Type className="h-4 w-4" />,
    color: "bg-amber-500/10 text-amber-500",
    defaultConfig: { content: "Enter your text here…" },
    defaultColSpan: 4,
    defaultRowSpan: 2,
  },
  {
    type: "image",
    label: "Image",
    description: "Embed an image or logo",
    icon: <Image className="h-4 w-4" />,
    color: "bg-pink-500/10 text-pink-500",
    defaultConfig: { url: "", alt: "Image" },
    defaultColSpan: 3,
    defaultRowSpan: 3,
  },
  {
    type: "separator",
    label: "Divider",
    description: "Visual section separator",
    icon: <Minus className="h-4 w-4" />,
    color: "bg-muted text-muted-foreground",
    defaultConfig: { label: "" },
    defaultColSpan: 12,
    defaultRowSpan: 1,
  },
];

// ─── Widget canvas preview ─────────────────────────────────────────────────

function WidgetPreview({ widget, selected }: { widget: DashboardWidget; selected: boolean }) {
  const meta = WIDGET_TYPES.find((w) => w.type === widget.type);
  const cfg = (widget.config ?? {}) as Record<string, unknown>;

  return (
    <div
      className={cn(
        "h-full rounded-lg border-2 transition-all p-3 flex flex-col overflow-hidden",
        selected
          ? "border-primary shadow-[0_0_0_2px_hsl(var(--primary)/0.25)]"
          : "border-transparent bg-card hover:border-muted-foreground/30"
      )}
    >
      <div className={cn("flex items-center gap-1.5 mb-2 text-xs font-medium rounded px-1.5 py-0.5 self-start", meta?.color)}>
        {meta?.icon}
        {meta?.label}
      </div>

      {widget.type === "kpi" && (
        <div className="flex-1 flex flex-col justify-center">
          <div className="text-2xl font-bold truncate">{String(cfg.value ?? "—")}</div>
          <div className="text-xs text-muted-foreground truncate">{String(cfg.label ?? "Metric")}</div>
          {!!cfg.trend && (
            <div className={cn("text-xs font-medium mt-1", cfg.trendUp ? "text-green-500" : "text-red-500")}>
              {String(cfg.trend)}
            </div>
          )}
        </div>
      )}

      {widget.type === "chart" && (
        <div className="flex-1 flex flex-col justify-between">
          <span className="text-xs font-medium text-muted-foreground truncate">{String(cfg.title ?? "Chart")}</span>
          <div className="flex items-end gap-0.5 h-12 mt-2">
            {[40, 65, 50, 80, 70, 90, 60].map((h, i) => (
              <div key={i} className="flex-1 bg-primary/30 rounded-t" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
      )}

      {widget.type === "table" && (
        <div className="flex-1 overflow-hidden">
          <p className="text-xs font-medium text-muted-foreground mb-1.5 truncate">{String(cfg.title ?? "Table")}</p>
          <div className="space-y-1">
            {[1, 2, 3].map((r) => (
              <div key={r} className="flex gap-1">
                {((cfg.columns as string[]) ?? ["Col"]).slice(0, 3).map((col, c) => (
                  <div key={c} className="flex-1 h-3 bg-muted rounded text-[8px] px-1 flex items-center text-muted-foreground truncate">
                    {r === 1 ? col : ""}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {widget.type === "text" && (
        <p className="text-xs text-muted-foreground line-clamp-4 flex-1">
          {String(cfg.content ?? "Text block")}
        </p>
      )}

      {widget.type === "image" && (
        <div className="flex-1 flex items-center justify-center bg-muted/50 rounded">
          <Image className="h-8 w-8 text-muted-foreground" />
        </div>
      )}

      {widget.type === "separator" && (
        <div className="flex-1 flex items-center gap-2">
          <div className="flex-1 h-px bg-border" />
          {!!cfg.label && <span className="text-xs text-muted-foreground">{String(cfg.label)}</span>}
          {!!cfg.label && <div className="flex-1 h-px bg-border" />}
        </div>
      )}
    </div>
  );
}

// ─── Config panel for a selected widget ────────────────────────────────────

function WidgetConfigPanel({
  widget,
  onUpdate,
  onDelete,
}: {
  widget: DashboardWidget;
  onUpdate: (updated: DashboardWidget) => void;
  onDelete: () => void;
}) {
  const cfg = (widget.config ?? {}) as Record<string, unknown>;

  const setConfig = (key: string, value: unknown) => {
    onUpdate({ ...widget, config: { ...cfg, [key]: value } });
  };

  const setSize = (field: "colSpan" | "rowSpan", delta: number) => {
    const limits = field === "colSpan" ? [1, 12] : [1, 8];
    const next = Math.min(limits[1], Math.max(limits[0], widget[field] + delta));
    onUpdate({ ...widget, [field]: next });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b">
        <p className="text-sm font-semibold">Widget Config</p>
        <p className="text-xs text-muted-foreground capitalize">{widget.type}</p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Size controls */}
          <div className="space-y-3">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Size</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Width (cols)</Label>
                <div className="flex items-center border rounded-md">
                  <button
                    className="px-2 py-1.5 hover:bg-muted transition-colors rounded-l-md"
                    onClick={() => setSize("colSpan", -1)}
                  >
                    <ChevronLeft className="h-3 w-3" />
                  </button>
                  <span className="flex-1 text-center text-sm font-medium">{widget.colSpan}</span>
                  <button
                    className="px-2 py-1.5 hover:bg-muted transition-colors rounded-r-md"
                    onClick={() => setSize("colSpan", 1)}
                  >
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Height (rows)</Label>
                <div className="flex items-center border rounded-md">
                  <button
                    className="px-2 py-1.5 hover:bg-muted transition-colors rounded-l-md"
                    onClick={() => setSize("rowSpan", -1)}
                  >
                    <ChevronDown className="h-3 w-3" />
                  </button>
                  <span className="flex-1 text-center text-sm font-medium">{widget.rowSpan}</span>
                  <button
                    className="px-2 py-1.5 hover:bg-muted transition-colors rounded-r-md"
                    onClick={() => setSize("rowSpan", 1)}
                  >
                    <ChevronUp className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Type-specific config */}
          <div className="space-y-3">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Content</Label>

            {widget.type === "kpi" && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs">Label</Label>
                  <Input
                    value={String(cfg.label ?? "")}
                    onChange={(e) => setConfig("label", e.target.value)}
                    placeholder="e.g. Total Executions"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Value</Label>
                  <Input
                    value={String(cfg.value ?? "")}
                    onChange={(e) => setConfig("value", e.target.value)}
                    placeholder="e.g. 1,234"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Trend</Label>
                  <Input
                    value={String(cfg.trend ?? "")}
                    onChange={(e) => setConfig("trend", e.target.value)}
                    placeholder="e.g. +12%"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Trend direction</Label>
                  <Select
                    value={cfg.trendUp ? "up" : "down"}
                    onValueChange={(v) => setConfig("trendUp", v === "up")}
                  >
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="up">↑ Up (green)</SelectItem>
                      <SelectItem value="down">↓ Down (red)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {widget.type === "chart" && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs">Title</Label>
                  <Input
                    value={String(cfg.title ?? "")}
                    onChange={(e) => setConfig("title", e.target.value)}
                    placeholder="Chart title"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Chart type</Label>
                  <Select
                    value={String(cfg.chartType ?? "bar")}
                    onValueChange={(v) => setConfig("chartType", v)}
                  >
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bar">Bar chart</SelectItem>
                      <SelectItem value="line">Line chart</SelectItem>
                      <SelectItem value="area">Area chart</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {widget.type === "table" && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs">Title</Label>
                  <Input
                    value={String(cfg.title ?? "")}
                    onChange={(e) => setConfig("title", e.target.value)}
                    placeholder="Table title"
                    className="h-8 text-sm"
                  />
                </div>
              </>
            )}

            {widget.type === "text" && (
              <div className="space-y-1.5">
                <Label className="text-xs">Content</Label>
                <textarea
                  className="w-full text-sm rounded-md border bg-background px-3 py-2 min-h-[80px] resize-y focus:outline-none focus:ring-1 focus:ring-ring"
                  value={String(cfg.content ?? "")}
                  onChange={(e) => setConfig("content", e.target.value)}
                  placeholder="Enter text content…"
                />
              </div>
            )}

            {widget.type === "image" && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs">Image URL</Label>
                  <Input
                    value={String(cfg.url ?? "")}
                    onChange={(e) => setConfig("url", e.target.value)}
                    placeholder="https://example.com/image.png"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Alt text</Label>
                  <Input
                    value={String(cfg.alt ?? "")}
                    onChange={(e) => setConfig("alt", e.target.value)}
                    placeholder="Image description"
                    className="h-8 text-sm"
                  />
                </div>
              </>
            )}

            {widget.type === "separator" && (
              <div className="space-y-1.5">
                <Label className="text-xs">Section label (optional)</Label>
                <Input
                  value={String(cfg.label ?? "")}
                  onChange={(e) => setConfig("label", e.target.value)}
                  placeholder="e.g. Performance"
                  className="h-8 text-sm"
                />
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <Button
          variant="destructive"
          size="sm"
          className="w-full gap-2"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
          Remove Widget
        </Button>
      </div>
    </div>
  );
}

// ─── Main builder page ─────────────────────────────────────────────────────

export default function DashboardBuilder() {
  const { id } = useParams<{ id: string }>();
  const dashboardId = parseInt(id || "0", 10);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const { data: dashboard, isLoading } = useGetDashboard(dashboardId, {
    query: {
      enabled: !!dashboardId,
      queryKey: getGetDashboardQueryKey(dashboardId),
    },
  });

  // Sync from server on load
  useEffect(() => {
    if (dashboard && !initialized) {
      setWidgets((dashboard.widgets as DashboardWidget[]) ?? []);
      setInitialized(true);
    }
  }, [dashboard, initialized]);

  const updateMutation = useUpdateDashboard({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey(dashboardId) });
        queryClient.invalidateQueries({ queryKey: getListDashboardsQueryKey() });
        setIsDirty(false);
        toast({ title: "Dashboard saved" });
      },
      onError: () => toast({ title: "Failed to save dashboard", variant: "destructive" }),
    },
  });

  const publishMutation = usePublishDashboard({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey(dashboardId) });
        queryClient.invalidateQueries({ queryKey: getListDashboardsQueryKey() });
        toast({ title: "Dashboard published", description: "It's now live." });
      },
      onError: () => toast({ title: "Failed to publish", variant: "destructive" }),
    },
  });

  const handleSave = useCallback(() => {
    updateMutation.mutate({ id: dashboardId, data: { widgets: widgets as Parameters<typeof updateMutation.mutate>[0]["data"]["widgets"] } });
  }, [dashboardId, widgets, updateMutation]);

  const handlePublish = () => {
    if (isDirty) {
      updateMutation.mutate(
        { id: dashboardId, data: { widgets: widgets as Parameters<typeof updateMutation.mutate>[0]["data"]["widgets"] } },
        { onSuccess: () => publishMutation.mutate({ id: dashboardId }) }
      );
    } else {
      publishMutation.mutate({ id: dashboardId });
    }
  };

  const addWidget = (type: DashboardWidget["type"]) => {
    const meta = WIDGET_TYPES.find((w) => w.type === type)!;
    // Place widget on next available row
    const maxRow = widgets.reduce((max, w) => Math.max(max, w.gridRow + w.rowSpan - 1), 0);
    const newWidget: DashboardWidget = {
      id: uid(),
      type,
      gridCol: 1,
      gridRow: maxRow + 1,
      colSpan: meta.defaultColSpan,
      rowSpan: meta.defaultRowSpan,
      config: meta.defaultConfig,
    };
    setWidgets((prev) => [...prev, newWidget]);
    setSelectedId(newWidget.id);
    setIsDirty(true);
  };

  const updateWidget = (updated: DashboardWidget) => {
    setWidgets((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
    setIsDirty(true);
  };

  const deleteWidget = (widgetId: string) => {
    setWidgets((prev) => prev.filter((w) => w.id !== widgetId));
    setSelectedId(null);
    setIsDirty(true);
  };

  const selectedWidget = widgets.find((w) => w.id === selectedId) ?? null;

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="h-14 border-b bg-card animate-pulse" />
        <div className="flex-1 bg-muted animate-pulse m-4 rounded-lg" />
      </div>
    );
  }

  if (!dashboard) return <div className="p-8">Dashboard not found</div>;

  return (
    <div className="h-full flex flex-col -m-6 md:-m-8">
      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <div className="h-14 shrink-0 flex items-center justify-between px-4 border-b bg-card gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link href="/dashboards"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <span className="font-semibold text-sm">{dashboard.name}</span>
          </div>
          <Badge
            variant={dashboard.status === "published" ? "default" : "secondary"}
            className="text-xs"
          >
            {dashboard.status === "published" ? (
              <><Globe className="h-3 w-3 mr-1" />Live</>
            ) : (
              "Draft"
            )}
          </Badge>
          {isDirty && (
            <span className="text-xs text-muted-foreground">Unsaved changes</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={handleSave}
            disabled={updateMutation.isPending || !isDirty}
          >
            <Save className="h-3.5 w-3.5" />
            {updateMutation.isPending ? "Saving…" : "Save"}
          </Button>
          <Button
            size="sm"
            className="gap-1.5"
            onClick={handlePublish}
            disabled={publishMutation.isPending}
          >
            <Rocket className="h-3.5 w-3.5" />
            {publishMutation.isPending ? "Publishing…" : "Publish"}
          </Button>
        </div>
      </div>

      {/* ── Three-panel layout ────────────────────────────────────────────── */}
      <div className="flex-1 flex min-h-0">
        {/* Left: Widget palette */}
        <div className="w-56 shrink-0 border-r bg-sidebar flex flex-col">
          <div className="px-3 py-2.5 border-b">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Widgets</p>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {WIDGET_TYPES.map((wt) => (
                <button
                  key={wt.type}
                  className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left hover:bg-accent transition-colors group"
                  onClick={() => addWidget(wt.type)}
                >
                  <div className={cn("rounded-md p-1.5 shrink-0", wt.color)}>
                    {wt.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium leading-tight">{wt.label}</p>
                    <p className="text-[10px] text-muted-foreground leading-tight truncate">{wt.description}</p>
                  </div>
                  <Plus className="h-3 w-3 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Center: Canvas */}
        <div className="flex-1 bg-muted/30 overflow-auto" onClick={() => setSelectedId(null)}>
          {widgets.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="bg-background rounded-xl border-2 border-dashed p-10 max-w-sm">
                <GripVertical className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-semibold mb-1">Start building</h3>
                <p className="text-sm text-muted-foreground">
                  Click any widget type from the panel on the left to add it to your dashboard
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 min-w-0">
              <div
                className="grid gap-3"
                style={{
                  gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
                  gridAutoRows: "56px",
                }}
              >
                {widgets.map((widget) => (
                  <div
                    key={widget.id}
                    style={{
                      gridColumn: `${widget.gridCol} / span ${widget.colSpan}`,
                      gridRow: `span ${widget.rowSpan}`,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedId(widget.id === selectedId ? null : widget.id);
                    }}
                    className="cursor-pointer min-h-0"
                  >
                    <WidgetPreview widget={widget} selected={widget.id === selectedId} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Config panel */}
        <div className="w-64 shrink-0 border-l bg-background flex flex-col">
          {selectedWidget ? (
            <WidgetConfigPanel
              widget={selectedWidget}
              onUpdate={updateWidget}
              onDelete={() => deleteWidget(selectedWidget.id)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <div className="bg-muted rounded-lg p-3 mb-3">
                <GripVertical className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No widget selected</p>
              <p className="text-xs text-muted-foreground mt-1">
                Click a widget on the canvas to configure it
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
