import { useCallback, useEffect, useState } from "react";
import { useRoute, useLocation, Link } from "wouter";
import {
  ReactFlow, Background, Controls, MiniMap,
  addEdge, useNodesState, useEdgesState,
  type Connection, type Edge, type Node,
  Panel, Handle, Position, NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  useGetWorkflow, getGetWorkflowQueryKey, useUpdateWorkflow, useRunWorkflow,
  useListNodeTypes, getListWorkflowsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft, Save, Play, Zap, GitBranch, Cpu, Database,
  Bot, ChevronRight, X, Settings2, Plus,
} from "lucide-react";

const categoryColors: Record<string, { bg: string; border: string; text: string }> = {
  trigger: { bg: "bg-violet-50", border: "border-violet-300", text: "text-violet-700" },
  action: { bg: "bg-blue-50", border: "border-blue-300", text: "text-blue-700" },
  logic: { bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-700" },
  ai: { bg: "bg-emerald-50", border: "border-emerald-300", text: "text-emerald-700" },
  data: { bg: "bg-pink-50", border: "border-pink-300", text: "text-pink-700" },
  core: { bg: "bg-gray-50", border: "border-gray-300", text: "text-gray-700" },
};

const categoryIcons: Record<string, React.ElementType> = {
  trigger: Zap,
  action: GitBranch,
  logic: ChevronRight,
  ai: Bot,
  data: Database,
  core: Cpu,
};

type NodeTypeData = {
  id: string; name: string; category: string; description: string; icon: string; color: string;
  isTrigger: boolean; isAi: boolean; inputs: number; outputs: number;
};

type FlowNodeData = { label: string; category: string; nodeTypeId: string; config: Record<string, unknown> };

function WorkflowNode({ data, selected }: NodeProps) {
  const d = data as FlowNodeData;
  const colors = categoryColors[d.category] ?? categoryColors.action;
  return (
    <div className={`rounded-lg border-2 bg-white shadow-sm min-w-[140px] ${colors.border} ${selected ? "ring-2 ring-primary ring-offset-1" : ""}`}>
      {d.category !== "trigger" && (
        <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-gray-400 !border-white !border-2" />
      )}
      <div className={`px-3 py-2.5 rounded-md ${colors.bg}`}>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold uppercase tracking-wide ${colors.text}`}>{d.category}</span>
        </div>
        <p className="text-sm font-medium text-gray-900 mt-0.5 leading-tight">{String(d.label)}</p>
      </div>
      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-gray-400 !border-white !border-2" />
    </div>
  );
}

const nodeTypes = { workflowNode: WorkflowNode };

function NodePalette({ nodeTypesData, onAdd }: { nodeTypesData: NodeTypeData[]; onAdd: (nt: NodeTypeData) => void }) {
  const grouped = nodeTypesData.reduce<Record<string, NodeTypeData[]>>((acc, nt) => {
    (acc[nt.category] ??= []).push(nt);
    return acc;
  }, {});

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-4">
        {Object.entries(grouped).map(([cat, types]) => {
          const Icon = categoryIcons[cat] ?? Zap;
          const colors = categoryColors[cat] ?? categoryColors.action;
          return (
            <div key={cat}>
              <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-semibold uppercase tracking-wide ${colors.text} ${colors.bg} mb-1.5`}>
                <Icon className="w-3 h-3" />
                {cat}
              </div>
              <div className="space-y-1">
                {types.map((nt) => (
                  <button
                    key={nt.id}
                    onClick={() => onAdd(nt)}
                    className={`w-full text-left px-3 py-2 rounded border ${colors.border} ${colors.bg} hover:brightness-95 transition-all`}
                  >
                    <p className="text-xs font-medium text-gray-800">{nt.name}</p>
                    {nt.description && <p className="text-[0.65rem] text-gray-500 truncate mt-0.5">{nt.description}</p>}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
        {nodeTypesData.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-8">No node types available</p>
        )}
      </div>
    </ScrollArea>
  );
}

export default function WorkflowBuilderPage() {
  const [, params] = useRoute("/workflows/:id");
  const [, navigate] = useLocation();
  const id = Number(params?.id);
  const qc = useQueryClient();

  const workflow = useGetWorkflow(id, { query: { enabled: !!id, queryKey: getGetWorkflowQueryKey(id) } });
  const nodeTypesQuery = useListNodeTypes();
  const updateMut = useUpdateWorkflow();
  const runMut = useRunWorkflow();

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [saved, setSaved] = useState(false);

  // Load saved nodes from workflow
  useEffect(() => {
    if (!workflow.data) return;
    const saved = (workflow.data.nodes as { id: string; name: string; type: string; nodeTypeId: string; position: { x: number; y: number }; config: Record<string, unknown> }[] | null) ?? [];
    if (saved.length > 0) {
      setNodes(saved.map((n) => ({
        id: n.id,
        type: "workflowNode",
        position: n.position,
        data: { label: n.name, category: n.type, nodeTypeId: n.nodeTypeId, config: n.config ?? {} },
      })));
    }
  }, [workflow.data?.id]);

  const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge(params, eds)), []);

  function addNodeFromType(nt: NodeTypeData) {
    const newNode: Node = {
      id: `${nt.id}-${Date.now()}`,
      type: "workflowNode",
      position: { x: 200 + Math.random() * 100, y: 100 + nodes.length * 80 },
      data: { label: nt.name, category: nt.category, nodeTypeId: nt.id, config: {} },
    };
    setNodes((ns) => [...ns, newNode]);
  }

  function handleSave() {
    const serialized = nodes.map((n) => ({
      id: n.id,
      name: String((n.data as FlowNodeData).label),
      type: (n.data as FlowNodeData).category,
      nodeTypeId: (n.data as FlowNodeData).nodeTypeId,
      position: n.position,
      config: (n.data as FlowNodeData).config ?? {},
    }));
    updateMut.mutate(
      { id, data: { nodes: serialized } },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getGetWorkflowQueryKey(id) });
          qc.invalidateQueries({ queryKey: getListWorkflowsQueryKey() });
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        },
      }
    );
  }

  function handleRun() {
    handleSave();
    runMut.mutate({ id }, { onSuccess: (ex) => navigate(`/executions/${ex.id}`) });
  }

  function updateNodeConfig(nodeId: string, key: string, value: string) {
    setNodes((ns) => ns.map((n) => {
      if (n.id !== nodeId) return n;
      return { ...n, data: { ...n.data, config: { ...(n.data as FlowNodeData).config, [key]: value } } };
    }));
  }

  if (workflow.isLoading) {
    return (
      <div className="p-6 space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[calc(100vh-160px)]" />
      </div>
    );
  }

  const wf = workflow.data;
  if (!wf) return <div className="p-6 text-sm text-muted-foreground">Workflow not found.</div>;

  const nodeTypesData: NodeTypeData[] = (nodeTypesQuery.data as NodeTypeData[] | undefined) ?? [];

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b bg-card shrink-0">
        <Link href="/workflows">
          <a className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </a>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">{wf.name}</span>
            <Badge variant="secondary" className="text-xs">{wf.status}</Badge>
            <Badge variant="outline" className="text-xs capitalize">{wf.triggerType}</Badge>
          </div>
        </div>
        {saved && <span className="text-xs text-emerald-600 font-medium">Saved</span>}
        <Button size="sm" variant="outline" onClick={handleSave} disabled={updateMut.isPending}>
          <Save className="w-3.5 h-3.5 mr-1.5" /> {updateMut.isPending ? "Saving..." : "Save"}
        </Button>
        <Button size="sm" onClick={handleRun} disabled={runMut.isPending}>
          <Play className="w-3.5 h-3.5 mr-1.5" /> {runMut.isPending ? "Running..." : "Run"}
        </Button>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Node palette */}
        <aside className="w-52 shrink-0 border-r bg-muted/10 flex flex-col">
          <div className="px-3 py-2 border-b flex items-center gap-2">
            <Plus className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Add Node</span>
          </div>
          {nodeTypesQuery.isLoading ? (
            <div className="p-3 space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
          ) : (
            <NodePalette nodeTypesData={nodeTypesData} onAdd={addNodeFromType} />
          )}
        </aside>

        {/* Canvas */}
        <div className="flex-1 min-w-0">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, node) => setSelectedNode(node)}
            onPaneClick={() => setSelectedNode(null)}
            fitView
            attributionPosition="bottom-right"
          >
            <Background color="#e2e8f0" gap={20} />
            <Controls />
            <MiniMap nodeColor="#6366f1" maskColor="rgba(0,0,0,0.05)" />
            {nodes.length === 0 && (
              <Panel position="top-center">
                <div className="mt-16 text-center">
                  <GitBranch className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm font-medium text-muted-foreground">Add nodes from the palette to build your workflow</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Connect nodes by dragging from the right handle to the left handle of another node</p>
                </div>
              </Panel>
            )}
          </ReactFlow>
        </div>

        {/* Config panel */}
        {selectedNode && (
          <aside className="w-64 shrink-0 border-l bg-card flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Node Config</span>
              </div>
              <button onClick={() => setSelectedNode(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Node ID</p>
                  <p className="text-xs font-mono bg-muted/60 rounded px-2 py-1 truncate">{selectedNode.id}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Type</p>
                  <Badge variant="secondary" className="text-xs capitalize">{(selectedNode.data as FlowNodeData).category}</Badge>
                </div>
                <div className="space-y-3">
                  <p className="text-xs font-medium text-muted-foreground">Configuration</p>
                  {["endpoint", "method", "timeout", "retries"].map((field) => (
                    <div key={field} className="space-y-1">
                      <Label className="text-xs capitalize">{field}</Label>
                      <Input
                        className="h-7 text-xs"
                        placeholder={`Enter ${field}...`}
                        value={String(((selectedNode.data as FlowNodeData).config ?? {})[field] ?? "")}
                        onChange={(e) => updateNodeConfig(selectedNode.id, field, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full h-7 text-xs"
                  onClick={() => {
                    setNodes((ns) => ns.filter((n) => n.id !== selectedNode.id));
                    setSelectedNode(null);
                  }}
                >
                  Remove Node
                </Button>
              </div>
            </ScrollArea>
          </aside>
        )}
      </div>
    </div>
  );
}
