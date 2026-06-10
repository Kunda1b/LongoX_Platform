import { useMemo } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  MiniMap,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Zap,
  Blocks,
  Cpu,
  Database,
  BrainCircuit,
  Layers,
  Activity,
  Tag,
  GitBranch,
  BarChart2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Template } from "@autoflow/api-client-react";

// ─── Category meta (mirrors workflow-builder) ─────────────────────────────────

const CATEGORY_META: Record<
  string,
  { color: string; bg: string; border: string; icon: React.ReactNode }
> = {
  trigger: {
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/40",
    icon: <Zap className="h-3.5 w-3.5" />,
  },
  action: {
    color: "text-indigo-400",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/40",
    icon: <Blocks className="h-3.5 w-3.5" />,
  },
  logic: {
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/40",
    icon: <Cpu className="h-3.5 w-3.5" />,
  },
  ai: {
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/40",
    icon: <BrainCircuit className="h-3.5 w-3.5" />,
  },
  data: {
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/40",
    icon: <Database className="h-3.5 w-3.5" />,
  },
};

const HANDLE_COLORS: Record<string, string> = {
  trigger: "#22d3ee",
  action: "#818cf8",
  logic: "#fbbf24",
  ai: "#c084fc",
  data: "#60a5fa",
};

const HANDLE_STYLE = { width: 10, height: 10, borderRadius: "50%", border: "2px solid" };

// ─── Preview node (read-only, no config shown) ────────────────────────────────

function PreviewNode({ data }: { data: any }) {
  const category = data.category ?? deriveCategory(data.nodeTypeId ?? "");
  const meta = CATEGORY_META[category] ?? CATEGORY_META.action;
  const hc = HANDLE_COLORS[category] ?? "#818cf8";

  return (
    <div
      className={cn(
        "relative rounded-lg border bg-card shadow-md min-w-[180px] max-w-[200px]",
        meta.border
      )}
    >
      {data.inputs !== 0 && (
        <Handle
          type="target"
          position={Position.Left}
          style={{ ...HANDLE_STYLE, borderColor: hc, backgroundColor: "#1e1e2e", left: -6 }}
        />
      )}
      <div className={cn("px-3 py-2 rounded-t-lg flex items-center gap-2", meta.bg)}>
        <span className={cn("p-1 rounded shrink-0", meta.bg, meta.color)}>{meta.icon}</span>
        <span className="font-semibold text-xs truncate flex-1">{data.label}</span>
        <Badge
          variant="outline"
          className={cn("text-[9px] px-1.5 py-0 uppercase tracking-wide shrink-0", meta.color, meta.border)}
        >
          {category}
        </Badge>
      </div>
      <div className="px-3 py-2">
        <p className="text-[10px] text-muted-foreground/70 font-mono leading-relaxed truncate">
          {data.nodeTypeId ?? category}
        </p>
      </div>
      {data.outputs !== 0 && (
        <Handle
          type="source"
          position={Position.Right}
          style={{ ...HANDLE_STYLE, borderColor: hc, backgroundColor: "#1e1e2e", right: -6 }}
        />
      )}
    </div>
  );
}

const nodeTypes: NodeTypes = { previewNode: PreviewNode };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function deriveCategory(nodeTypeId: string): string {
  const prefix = nodeTypeId.split(".")[0] ?? "action";
  if (["trigger", "action", "logic", "ai", "data"].includes(prefix)) return prefix;
  return "action";
}

type RawNode = {
  id: string;
  name?: string;
  type?: string;
  nodeTypeId?: string;
  position?: { x: number; y: number };
  config?: Record<string, unknown>;
};

function buildFlowNodes(rawNodes: RawNode[]): Node[] {
  if (!rawNodes.length) return [];

  const sorted = [...rawNodes].sort((a, b) => (a.position?.x ?? 0) - (b.position?.x ?? 0));

  return sorted.map((n, i) => {
    const category = deriveCategory(n.nodeTypeId ?? n.type ?? "");
    const isFirst = i === 0;
    return {
      id: n.id,
      type: "previewNode",
      position: n.position ?? { x: i * 280, y: 100 },
      data: {
        label: n.name ?? n.type ?? "Node",
        nodeTypeId: n.nodeTypeId ?? n.type ?? "",
        category,
        inputs: isFirst ? 0 : 1,
        outputs: i === sorted.length - 1 ? 0 : 1,
      },
    };
  });
}

function buildFlowEdges(rawNodes: RawNode[]): Edge[] {
  if (!rawNodes.length) return [];
  const sorted = [...rawNodes].sort((a, b) => (a.position?.x ?? 0) - (b.position?.x ?? 0));
  return sorted.slice(0, -1).map((n, i) => ({
    id: `e_${n.id}_${sorted[i + 1].id}`,
    source: n.id,
    target: sorted[i + 1].id,
    type: "smoothstep",
    style: { strokeWidth: 2, stroke: "#6b7280" },
  }));
}

function getComplexityColor(c: string) {
  if (c === "beginner") return "bg-green-500/10 text-green-600";
  if (c === "intermediate") return "bg-yellow-500/10 text-yellow-600";
  if (c === "advanced") return "bg-red-500/10 text-red-600";
  return "bg-gray-500/10 text-gray-600";
}

function formatUses(uses: number) {
  if (uses >= 1000) return `${(uses / 1000).toFixed(1)}k`;
  return `${uses}`;
}

// ─── Inner content (needs ReactFlow context) ──────────────────────────────────

function PreviewContent({ template, onUse, isUsing }: {
  template: Template;
  onUse: () => void;
  isUsing: boolean;
}) {
  const rawNodes = (template.nodes ?? []) as RawNode[];
  const nodes = useMemo(() => buildFlowNodes(rawNodes), [template.id]);
  const edges = useMemo(() => buildFlowEdges(rawNodes), [template.id]);

  const categories = useMemo(() => {
    const counts: Record<string, number> = {};
    rawNodes.forEach((n) => {
      const cat = deriveCategory(n.nodeTypeId ?? n.type ?? "");
      counts[cat] = (counts[cat] ?? 0) + 1;
    });
    return counts;
  }, [template.id]);

  return (
    <div className="flex flex-1 min-h-0 gap-0">
      {/* ─── Graph canvas ──────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 border-r bg-muted/20 rounded-bl-lg" style={{ height: 520 }}>
        {nodes.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
            No nodes in this template yet.
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.25 }}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            panOnScroll
            zoomOnScroll
            minZoom={0.3}
            maxZoom={1.5}
            proOptions={{ hideAttribution: true }}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="hsl(var(--muted-foreground)/0.15)" />
            <MiniMap
              nodeColor={(n) => HANDLE_COLORS[(n.data?.category as string) ?? "action"] ?? "#6b7280"}
              maskColor="hsl(var(--background)/0.8)"
              className="!bg-background !border !border-border !rounded-lg"
            />
          </ReactFlow>
        )}
      </div>

      {/* ─── Sidebar ───────────────────────────────────────────────────────── */}
      <div className="w-64 shrink-0 flex flex-col">
        <ScrollArea className="flex-1 px-5 py-4">
          <div className="space-y-5">

            {/* badges */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className={getComplexityColor(template.complexity)}>
                {template.complexity}
              </Badge>
              {template.isCustom && (
                <Badge variant="outline" className="text-[10px] uppercase font-semibold border-primary/40 text-primary bg-primary/5">
                  Custom
                </Badge>
              )}
            </div>

            {/* description */}
            <div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {template.description || "No description provided."}
              </p>
            </div>

            {/* stats */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Activity className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Uses</span>
                <span className="ml-auto font-semibold">{formatUses(template.uses)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Layers className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Nodes</span>
                <span className="ml-auto font-semibold">{template.nodeCount}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <GitBranch className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Trigger</span>
                <span className="ml-auto font-semibold capitalize">{template.triggerType}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <BarChart2 className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Category</span>
                <span className="ml-auto font-semibold">{template.category}</span>
              </div>
            </div>

            {/* node breakdown */}
            {Object.keys(categories).length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Node breakdown
                </p>
                <div className="space-y-1.5">
                  {Object.entries(categories).map(([cat, count]) => {
                    const meta = CATEGORY_META[cat] ?? CATEGORY_META.action;
                    return (
                      <div key={cat} className="flex items-center gap-2">
                        <span className={cn("p-1 rounded text-[11px]", meta.bg, meta.color)}>
                          {meta.icon}
                        </span>
                        <span className="text-sm capitalize flex-1">{cat}</span>
                        <span className={cn(
                          "text-xs font-semibold px-1.5 py-0.5 rounded",
                          meta.bg, meta.color
                        )}>
                          ×{count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* tags */}
            {template.tags && template.tags.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                  <Tag className="h-3 w-3" /> Tags
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {template.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="text-[10px] uppercase font-semibold text-muted-foreground bg-muted/40"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* CTA */}
        <div className="p-4 border-t shrink-0">
          <Button className="w-full" onClick={onUse} disabled={isUsing}>
            {isUsing ? "Applying…" : "Use This Template"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Public dialog ────────────────────────────────────────────────────────────

interface TemplatePreviewDialogProps {
  template: Template | null;
  open: boolean;
  onClose: () => void;
  onUse: (id: number) => void;
  isUsing: boolean;
}

export function TemplatePreviewDialog({
  template,
  open,
  onClose,
  onUse,
  isUsing,
}: TemplatePreviewDialogProps) {
  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl p-0 gap-0 overflow-hidden flex flex-col" style={{ height: 620 }}>
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle className="text-lg">{template.name}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0 flex flex-col">
          <ReactFlowProvider>
            <PreviewContent template={template} onUse={() => onUse(template.id)} isUsing={isUsing} />
          </ReactFlowProvider>
        </div>
      </DialogContent>
    </Dialog>
  );
}
