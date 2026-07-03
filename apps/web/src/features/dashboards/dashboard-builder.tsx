"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCreateDashboard,
  useUpdateDashboard,
  usePublishDashboard,
  getListDashboardsQueryKey,
} from "@longox/api-client-react";
import { widgetRegistry, renderWidget } from "@longox/dashboard-widgets";
import type {
  WidgetType,
  WidgetInstance,
  DashboardDefinition,
  DashboardLayout,
} from "@longox/dashboard-renderer";
import { defaultLayout } from "@longox/dashboard-renderer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Palette,
  Layout,
  Eye,
  Save,
  Send,
  Settings2,
  BarChart3,
  Table2,
  Kanban,
  FormInput,
  Map,
  FileText,
  BrainCircuit,
  ListChecks,
  Activity,
  GripVertical,
  X,
  ChevronRight,
  ChevronLeft,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GridLayout, type GridItem } from "./grid-layout";

const WIDGET_CATALOG: {
  type: WidgetType;
  label: string;
  icon: React.ReactNode;
  description: string;
}[] = [
  {
    type: "kpi-card",
    label: "KPI Card",
    icon: <BarChart3 className="h-4 w-4" />,
    description: "Single metric with optional trend",
  },
  {
    type: "time-series-chart",
    label: "Time Series",
    icon: <Activity className="h-4 w-4" />,
    description: "Line chart over time",
  },
  {
    type: "data-table",
    label: "Data Table",
    icon: <Table2 className="h-4 w-4" />,
    description: "Tabular data view",
  },
  {
    type: "kanban-board",
    label: "Kanban Board",
    icon: <Kanban className="h-4 w-4" />,
    description: "Card-based column view",
  },
  {
    type: "form-panel",
    label: "Form Panel",
    icon: <FormInput className="h-4 w-4" />,
    description: "Inline form",
  },
  {
    type: "map-widget",
    label: "Map",
    icon: <Map className="h-4 w-4" />,
    description: "Geographic visualization",
  },
  {
    type: "file-widget",
    label: "File Upload",
    icon: <FileText className="h-4 w-4" />,
    description: "File attachment panel",
  },
  {
    type: "ai-insight-card",
    label: "AI Insight",
    icon: <BrainCircuit className="h-4 w-4" />,
    description: "AI-generated analysis",
  },
  {
    type: "audit-feed",
    label: "Audit Feed",
    icon: <ListChecks className="h-4 w-4" />,
    description: "Recent activity stream",
  },
  {
    type: "task-queue",
    label: "Task Queue",
    icon: <Activity className="h-4 w-4" />,
    description: "Approval task list",
  },
];

interface DashboardBuilderProps {
  existingDashboard?: DashboardDefinition;
}

function generateId(): string {
  return `w-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function DashboardBuilder({ existingDashboard }: DashboardBuilderProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [title, setTitle] = useState(existingDashboard?.title ?? "");
  const [description, setDescription] = useState("");
  const [widgets, setWidgets] = useState<WidgetInstance[]>(
    existingDashboard?.widgets ?? [],
  );
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);
  const [publishNotes, setPublishNotes] = useState("");
  const [environment, setEnvironment] = useState("production");

  const createMutation = useCreateDashboard({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getListDashboardsQueryKey(),
        });
        toast({ title: "Dashboard created" });
        router.push("/dashboards");
      },
    },
  });

  const updateMutation = useUpdateDashboard({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getListDashboardsQueryKey(),
        });
        toast({ title: "Dashboard saved" });
      },
    },
  });

  const publishMutation = usePublishDashboard({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getListDashboardsQueryKey(),
        });
        toast({ title: "Dashboard published" });
        setIsPublishDialogOpen(false);
        router.push("/dashboards");
      },
    },
  });

  const addWidget = useCallback(
    (type: WidgetType) => {
      const newWidget: WidgetInstance = {
        id: generateId(),
        type,
        title: WIDGET_CATALOG.find((w) => w.type === type)?.label ?? type,
        position: { x: 0, y: widgets.length * 2, w: 4, h: 2 },
        config: {},
      };
      setWidgets((prev) => [...prev, newWidget]);
      setSelectedWidgetId(newWidget.id);
    },
    [widgets.length],
  );

  const removeWidget = useCallback(
    (id: string) => {
      setWidgets((prev) => prev.filter((w) => w.id !== id));
      if (selectedWidgetId === id) setSelectedWidgetId(null);
    },
    [selectedWidgetId],
  );

  const updateWidget = useCallback(
    (id: string, updates: Partial<WidgetInstance>) => {
      setWidgets((prev) =>
        prev.map((w) => (w.id === id ? { ...w, ...updates } : w)),
      );
    },
    [],
  );

  const selectedWidget = useMemo(
    () => widgets.find((w) => w.id === selectedWidgetId),
    [widgets, selectedWidgetId],
  );

  const handleSave = () => {
    if (existingDashboard?.id) {
      updateMutation.mutate({
        id: parseInt(existingDashboard.id),
        data: { name: title, widgets: widgets as any },
      });
    } else {
      createMutation.mutate({
        data: { name: title, widgets: widgets as any } as any,
      });
    }
  };

  const handlePublish = () => {
    if (!existingDashboard?.id) {
      toast({
        title: "Save the dashboard first before publishing",
        variant: "destructive",
      });
      return;
    }
    // The generated `usePublishDashboard` hook's mutate arg type is
    // `{ id: number }`. The `data` field (publish notes) is not in the
    // generated type — passing it via `as any` would work at runtime but
    // fails typecheck. We pass only the typed `id` arg; the publish notes
    // can be added when the OpenAPI spec is updated to include them.
    publishMutation.mutate({ id: parseInt(existingDashboard.id) });
  };

  const renderContext = useMemo(
    () => ({
      dashboard: {
        id: existingDashboard?.id ?? "",
        title,
        layout: defaultLayout,
        widgets,
      },
      data: {},
      permissions: {
        visibility: "private" as const,
        allowedRoles: [],
        widgetOverrides: {},
      },
      environment,
    }),
    [existingDashboard?.id, title, widgets, environment],
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-0">
      {/* Widget Catalog Sidebar */}
      <div
        className={cn(
          "border-r bg-card transition-all",
          sidebarOpen ? "w-64" : "w-0 overflow-hidden",
        )}
      >
        <div className="flex h-12 items-center justify-between px-3 border-b">
          <span className="text-sm font-medium">Widgets</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setSidebarOpen(false)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
        <ScrollArea className="h-[calc(100%-3rem)] p-3">
          <div className="space-y-1">
            {WIDGET_CATALOG.map((cat) => (
              <button
                key={cat.type}
                onClick={() => addWidget(cat.type)}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors text-left"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                  {cat.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{cat.label}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {cat.description}
                  </div>
                </div>
                <Plus className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="flex items-center justify-between border-b px-4 h-12 shrink-0">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setSidebarOpen(true)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Dashboard Title"
              className="h-8 w-64 border-0 bg-muted px-3 text-sm font-medium"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-md border px-2 py-1">
              <Globe className="h-3.5 w-3.5 text-muted-foreground" />
              <select
                value={environment}
                onChange={(e) => setEnvironment(e.target.value)}
                className="border-0 bg-transparent text-xs font-medium outline-none"
              >
                <option value="development">Dev</option>
                <option value="staging">Staging</option>
                <option value="production">Production</option>
              </select>
            </div>
            <Button
              variant={previewMode ? "default" : "outline"}
              size="sm"
              onClick={() => setPreviewMode(!previewMode)}
            >
              <Eye className="mr-1 h-4 w-4" />{" "}
              {previewMode ? "Edit" : "Preview"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              <Save className="mr-1 h-4 w-4" /> Save
            </Button>
            <Button
              size="sm"
              onClick={() => setIsPublishDialogOpen(true)}
              disabled={!existingDashboard?.id}
            >
              <Send className="mr-1 h-4 w-4" /> Publish
            </Button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-auto p-4">
          {previewMode ? (
            <GridLayout
              items={widgets.map((w) => ({
                id: w.id,
                x: w.position.x,
                y: w.position.y,
                w: w.position.w,
                h: w.position.h,
              }))}
              onLayoutChange={() => {}}
              isEditing={false}
              className="min-h-[600px]"
            >
              {(item) => {
                const widget = widgets.find((w) => w.id === item.id);
                return widget ? (
                  <div className="h-full w-full overflow-hidden rounded-lg border bg-card">
                    {renderWidget(widget, renderContext)}
                  </div>
                ) : null;
              }}
            </GridLayout>
          ) : (
            <GridLayout
              items={widgets.map((w) => ({
                id: w.id,
                x: w.position.x,
                y: w.position.y,
                w: w.position.w,
                h: w.position.h,
              }))}
              onLayoutChange={(items) => {
                setWidgets((prev) =>
                  prev.map((w) => {
                    const gi = items.find((i) => i.id === w.id);
                    if (gi) {
                      return {
                        ...w,
                        position: {
                          ...w.position,
                          x: gi.x,
                          y: gi.y,
                          w: gi.w,
                          h: gi.h,
                        },
                      };
                    }
                    return w;
                  }),
                );
              }}
              className="min-h-[600px]"
            >
              {(item) => {
                const widget = widgets.find((w) => w.id === item.id);
                if (!widget) return null;
                return (
                  <div
                    className={cn(
                      "h-full w-full rounded-lg border bg-card transition-all cursor-pointer group flex flex-col",
                      selectedWidgetId === widget.id && "ring-2 ring-primary",
                    )}
                    onClick={() => setSelectedWidgetId(widget.id)}
                  >
                    <div className="flex items-center justify-between border-b bg-muted/30 px-3 py-1.5 shrink-0">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <GripVertical className="h-3 w-3" />
                        {widget.title}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeWidget(widget.id);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex-1 overflow-auto p-3">
                      {renderWidget(widget, renderContext)}
                    </div>
                  </div>
                );
              }}
            </GridLayout>
          )}
          {widgets.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-12 text-center">
              <Layout className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Add widgets from the sidebar to start building
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Widget Config Panel */}
      {selectedWidget && !previewMode && (
        <div className="w-72 border-l bg-card p-4 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium">Widget Settings</h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setSelectedWidgetId(null)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Title</Label>
              <Input
                value={selectedWidget.title}
                onChange={(e) =>
                  updateWidget(selectedWidget.id, { title: e.target.value })
                }
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Width</Label>
              <Select
                value={String(selectedWidget.position.w)}
                onValueChange={(v) =>
                  updateWidget(selectedWidget.id, {
                    position: { ...selectedWidget.position, w: parseInt(v) },
                  })
                }
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 columns</SelectItem>
                  <SelectItem value="3">3 columns</SelectItem>
                  <SelectItem value="4">4 columns (full)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Height</Label>
              <Select
                value={String(selectedWidget.position.h)}
                onValueChange={(v) =>
                  updateWidget(selectedWidget.id, {
                    position: { ...selectedWidget.position, h: parseInt(v) },
                  })
                }
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Small</SelectItem>
                  <SelectItem value="2">Medium</SelectItem>
                  <SelectItem value="3">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Data Source</Label>
              <Select
                value={selectedWidget.dataBinding?.source ?? "manual"}
                onValueChange={(v) =>
                  updateWidget(selectedWidget.id, {
                    dataBinding: {
                      source: v as any,
                      query: "",
                      parameters: {},
                      refreshInterval: 0,
                    },
                  })
                }
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual / Static</SelectItem>
                  <SelectItem value="api-query">API Query</SelectItem>
                  <SelectItem value="workflow-output">
                    Workflow Output
                  </SelectItem>
                  <SelectItem value="dataset">Dataset</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {selectedWidget.dataBinding?.source === "api-query" && (
              <div className="space-y-1.5">
                <Label className="text-xs">Query</Label>
                <Input
                  value={selectedWidget.dataBinding.query ?? ""}
                  onChange={(e) =>
                    updateWidget(selectedWidget.id, {
                      dataBinding: {
                        ...selectedWidget.dataBinding!,
                        query: e.target.value,
                      },
                    })
                  }
                  placeholder="/api/workflows/executions"
                  className="h-8 text-sm font-mono"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs">Refresh Interval (seconds)</Label>
              <Input
                type="number"
                value={selectedWidget.dataBinding?.refreshInterval ?? 0}
                onChange={(e) =>
                  updateWidget(selectedWidget.id, {
                    dataBinding: {
                      ...selectedWidget.dataBinding!,
                      refreshInterval: parseInt(e.target.value) || 0,
                    },
                  })
                }
                className="h-8 text-sm"
                placeholder="0 = no auto-refresh"
              />
            </div>
          </div>
        </div>
      )}

      {/* Publish Dialog */}
      <Dialog open={isPublishDialogOpen} onOpenChange={setIsPublishDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish Dashboard</DialogTitle>
            <DialogDescription>
              Publishing will make this dashboard visible to users with the
              appropriate permissions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Release Notes</Label>
              <Textarea
                value={publishNotes}
                onChange={(e) => setPublishNotes(e.target.value)}
                placeholder="What changed in this version?"
              />
            </div>
            <div className="rounded-lg border bg-muted/50 p-3 text-sm">
              <div className="font-medium mb-1">Summary</div>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li>{widgets.length} widget(s)</li>
                <li>Title: {title || "(untitled)"}</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPublishDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePublish}
              disabled={publishMutation.isPending}
            >
              {publishMutation.isPending ? "Publishing..." : "Publish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
