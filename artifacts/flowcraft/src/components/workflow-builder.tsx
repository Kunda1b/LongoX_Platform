import { useCallback, useRef, useState, useMemo, DragEvent } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Connection,
  type NodeTypes,
  type Node,
  type Edge,
  Handle,
  Position,
  BackgroundVariant,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  Blocks,
  Cpu,
  Database,
  BrainCircuit,
  ChevronDown,
  ChevronRight,
  Save,
  Plus,
  Trash2,
} from "lucide-react";
import { useUpdateWorkflow } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { NodeType } from "@workspace/api-client-react";
import type { WorkflowNode } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

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

const HANDLE_STYLE = {
  width: 10,
  height: 10,
  borderRadius: "50%",
  border: "2px solid",
};

function FlowNode({ data, selected }: { data: any; selected: boolean }) {
  const meta = CATEGORY_META[data.category] ?? CATEGORY_META.action;
  const category = data.category ?? "action";

  const handleColor: Record<string, string> = {
    trigger: "#22d3ee",
    action: "#818cf8",
    logic: "#fbbf24",
    ai: "#c084fc",
    data: "#60a5fa",
  };
  const hc = handleColor[category] ?? "#818cf8";

  return (
    <div
      className={cn(
        "relative rounded-lg border bg-card shadow-md min-w-[220px] max-w-[240px] transition-all",
        selected ? "ring-2 ring-primary ring-offset-1 ring-offset-background" : "",
        meta.border,
        "border"
      )}
    >
      {data.inputs > 0 && (
        <Handle
          type="target"
          position={Position.Left}
          style={{ ...HANDLE_STYLE, borderColor: hc, backgroundColor: "#1e1e2e", left: -6 }}
        />
      )}
      <div className={cn("px-3 py-2 rounded-t-lg flex items-center gap-2", meta.bg)}>
        <span className={cn("p-1 rounded", meta.bg, meta.color)}>{meta.icon}</span>
        <span className="font-semibold text-xs truncate flex-1">{data.label}</span>
        <Badge
          variant="outline"
          className={cn("text-[9px] px-1.5 py-0 uppercase tracking-wide", meta.color, meta.border)}
        >
          {category}
        </Badge>
      </div>
      <div className="px-3 py-2">
        <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
          {data.description}
        </p>
        {data.nodeTypeName && (
          <p className="text-[10px] text-muted-foreground/60 mt-1 font-mono">{data.nodeTypeName}</p>
        )}
      </div>
      {data.outputs > 0 && (
        <Handle
          type="source"
          position={Position.Right}
          style={{ ...HANDLE_STYLE, borderColor: hc, backgroundColor: "#1e1e2e", right: -6 }}
        />
      )}
    </div>
  );
}

const nodeTypes: NodeTypes = {
  flowNode: FlowNode,
};

let nodeIdCounter = 1000;
function generateNodeId() {
  return `node_${Date.now()}_${nodeIdCounter++}`;
}

function workflowNodesToFlow(wfNodes: WorkflowNode[], nodeTypeMap: Map<string, NodeType>) {
  const nodes: Node[] = (wfNodes ?? []).map((wn) => {
    const nt = nodeTypeMap.get(wn.nodeTypeId ?? wn.type);
    return {
      id: wn.id,
      type: "flowNode",
      position: wn.position,
      data: {
        label: wn.name,
        nodeTypeId: wn.nodeTypeId ?? wn.type,
        category: nt?.category ?? "action",
        description: nt?.description ?? "",
        nodeTypeName: nt?.name ?? wn.type,
        inputs: nt?.inputs ?? 1,
        outputs: nt?.outputs ?? 1,
      },
    };
  });
  return nodes;
}

function flowNodesToWorkflow(flowNodes: Node[]): WorkflowNode[] {
  return flowNodes.map((n) => ({
    id: n.id,
    type: n.data.category as string,
    name: n.data.label as string,
    nodeTypeId: n.data.nodeTypeId as string,
    position: n.position,
    config: {},
  }));
}

interface CategoryGroup {
  label: string;
  items: NodeType[];
}

function NodeCatalog({ nodeTypes }: { nodeTypes: NodeType[] }) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const categories = ["trigger", "action", "logic", "ai", "data"];

  const groups: CategoryGroup[] = categories
    .map((cat) => ({
      label: cat.charAt(0).toUpperCase() + cat.slice(1),
      items: nodeTypes.filter((n) => n.category === cat),
    }))
    .filter((g) => g.items.length > 0);

  const onDragStart = (e: DragEvent, nodeType: NodeType) => {
    e.dataTransfer.setData("application/flowcraft-nodetype", JSON.stringify(nodeType));
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-3 border-b">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Node Catalog
        </h2>
        <p className="text-[10px] text-muted-foreground/60 mt-0.5">Drag onto canvas to add</p>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {groups.map(({ label, items }) => {
            const cat = label.toLowerCase();
            const meta = CATEGORY_META[cat] ?? CATEGORY_META.action;
            const open = !collapsed[cat];

            return (
              <div key={cat}>
                <button
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors"
                  onClick={() => setCollapsed((c) => ({ ...c, [cat]: !c[cat] }))}
                >
                  <span className={cn("p-0.5", meta.color)}>{meta.icon}</span>
                  <span className="text-xs font-medium flex-1 text-left">{label}</span>
                  <span className="text-muted-foreground/50">
                    {open ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                  </span>
                </button>
                {open && (
                  <div className="ml-2 space-y-0.5 mt-0.5">
                    {items.map((nt) => (
                      <div
                        key={nt.id}
                        draggable
                        onDragStart={(e) => onDragStart(e, nt)}
                        className={cn(
                          "flex items-center gap-2 px-2 py-2 rounded-md cursor-grab active:cursor-grabbing",
                          "border transition-colors text-xs",
                          "hover:bg-muted/70 select-none",
                          meta.bg,
                          meta.border
                        )}
                      >
                        <span className={cn("shrink-0", meta.color)}>{meta.icon}</span>
                        <span className="truncate font-medium text-[11px]">{nt.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

interface WorkflowBuilderInnerProps {
  workflowId: number;
  initialNodes: WorkflowNode[];
  nodeTypesList: NodeType[];
  onSaved?: () => void;
}

function WorkflowBuilderInner({
  workflowId,
  initialNodes,
  nodeTypesList,
  onSaved,
}: WorkflowBuilderInnerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  const nodeTypeMap = useMemo(() => {
    const m = new Map<string, NodeType>();
    nodeTypesList.forEach((nt) => m.set(nt.id, nt));
    return m;
  }, [nodeTypesList]);

  const [nodes, setNodes, onNodesChange] = useNodesState(
    workflowNodesToFlow(initialNodes, nodeTypeMap)
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const updateMutation = useUpdateWorkflow({
    mutation: {
      onSuccess: () => {
        setIsDirty(false);
        toast({ title: "Workflow saved" });
        onSaved?.();
      },
      onError: () => {
        toast({ title: "Failed to save workflow", variant: "destructive" });
      },
    },
  });

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge({ ...connection, animated: true }, eds));
      setIsDirty(true);
    },
    [setEdges]
  );

  const onDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const raw = e.dataTransfer.getData("application/flowcraft-nodetype");
      if (!raw) return;

      let nodeType: NodeType;
      try {
        nodeType = JSON.parse(raw);
      } catch {
        return;
      }

      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      const meta = CATEGORY_META[nodeType.category] ?? CATEGORY_META.action;

      const newNode: Node = {
        id: generateNodeId(),
        type: "flowNode",
        position,
        data: {
          label: nodeType.name,
          nodeTypeId: nodeType.id,
          category: nodeType.category,
          description: nodeType.description,
          nodeTypeName: nodeType.name,
          inputs: nodeType.inputs,
          outputs: nodeType.outputs,
        },
      };

      setNodes((nds) => [...nds, newNode]);
      setIsDirty(true);
    },
    [screenToFlowPosition, setNodes]
  );

  const onNodesChangeWrapped: typeof onNodesChange = useCallback(
    (changes) => {
      onNodesChange(changes);
      const isDragging = changes.some((c) => c.type === "position" && c.dragging);
      const isDone = changes.some((c) => c.type === "position" && c.dragging === false);
      if (isDone) setIsDirty(true);
    },
    [onNodesChange]
  );

  const deleteSelected = useCallback(() => {
    setNodes((nds) => nds.filter((n) => !n.selected));
    setEdges((eds) => eds.filter((e) => !e.selected));
    setIsDirty(true);
  }, [setNodes, setEdges]);

  const handleSave = useCallback(() => {
    const wfNodes = flowNodesToWorkflow(nodes);
    updateMutation.mutate({ id: workflowId, data: { nodes: wfNodes } });
  }, [nodes, workflowId, updateMutation]);

  return (
    <div className="flex h-full gap-0 overflow-hidden rounded-lg border">
      {/* Sidebar */}
      <div className="w-52 shrink-0 border-r bg-card/50 flex flex-col">
        <NodeCatalog nodeTypes={nodeTypesList} />
      </div>

      {/* Canvas */}
      <div className="flex-1 relative" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChangeWrapped}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          deleteKeyCode={["Backspace", "Delete"]}
          multiSelectionKeyCode="Shift"
          className="bg-zinc-950"
          defaultEdgeOptions={{ animated: true, style: { stroke: "#6366f1", strokeWidth: 2 } }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="#27272a"
          />
          <Controls className="!bg-card !border-border !shadow-md" />
          <MiniMap
            className="!bg-card !border-border"
            nodeColor={(n) => {
              const cat = n.data?.category as string;
              const colors: Record<string, string> = {
                trigger: "#22d3ee",
                action: "#818cf8",
                logic: "#fbbf24",
                ai: "#c084fc",
                data: "#60a5fa",
              };
              return colors[cat] ?? "#6b7280";
            }}
            maskColor="rgba(0,0,0,0.5)"
          />
          <Panel position="top-right" className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 h-8 text-xs bg-card"
              onClick={deleteSelected}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete Selected
            </Button>
            <Button
              size="sm"
              className="gap-1.5 h-8 text-xs"
              onClick={handleSave}
              disabled={updateMutation.isPending || !isDirty}
            >
              <Save className="h-3.5 w-3.5" />
              {updateMutation.isPending ? "Saving..." : isDirty ? "Save Changes" : "Saved"}
            </Button>
          </Panel>
          {nodes.length === 0 && (
            <Panel position="top-center">
              <div className="flex items-center gap-2 text-muted-foreground text-sm bg-card border rounded-lg px-4 py-3 shadow-sm mt-16">
                <Plus className="h-4 w-4" />
                Drag nodes from the catalog on the left to build your workflow
              </div>
            </Panel>
          )}
        </ReactFlow>
      </div>
    </div>
  );
}

interface WorkflowBuilderProps {
  workflowId: number;
  initialNodes: WorkflowNode[];
  nodeTypesList: NodeType[];
  onSaved?: () => void;
}

export function WorkflowBuilder(props: WorkflowBuilderProps) {
  return (
    <ReactFlowProvider>
      <WorkflowBuilderInner {...props} />
    </ReactFlowProvider>
  );
}
