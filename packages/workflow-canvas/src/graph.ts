export interface CanvasNode {
  id: string;
  type: string;
  label: string;
  position: { x: number; y: number };
  config: Record<string, unknown>;
  inputs: string[];
  outputs: string[];
}
export interface CanvasEdge {
  id: string;
  sourceNodeId: string;
  sourcePort: string;
  targetNodeId: string;
  targetPort: string;
  label?: string;
}
export interface CanvasViewport {
  x: number;
  y: number;
  zoom: number;
}
export interface CanvasSelection {
  nodeIds: string[];
  edgeIds: string[];
}

// ─── Workflow (DAG-engine-compatible) node/edge shapes ────────────────────────
// These mirror @longox/workflow-engine's persisted node/edge shape (as stored
// in workflow_versions.nodes / .edges jsonb columns) and are used by the
// diffing/normalization pipeline (json-patch.ts, normalizer.ts, diff.ts).
// They intentionally differ from CanvasNode/CanvasEdge above, which describe
// the canvas rendering model (label-only, sourceNodeId/targetNodeId ports).

export interface WorkflowNode {
  id: string;
  name: string;
  type?: string;
  nodeTypeId?: string;
  category?: string;
  position: { x: number; y: number };
  config: Record<string, unknown>;
  inputHandles?: string[];
  outputHandles?: string[];
  retryPolicy?: Record<string, unknown>;
  compensation?: Record<string, unknown>;
  approvalGate?: Record<string, unknown>;
  loop?: Record<string, unknown>;
  childWorkflow?: Record<string, unknown>;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type?: string;
  label?: string;
  condition?: string;
}

export interface WorkflowGraph {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  viewport?: CanvasViewport;
}

export interface CanvasState {
  graph: WorkflowGraph;
  selection: CanvasSelection;
  isDragging: boolean;
  isConnecting: boolean;
  history: WorkflowGraph[];
  historyIndex: number;
}

export function createEmptyGraph(): WorkflowGraph {
  return { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } };
}

export function normalizeGraph(graph: WorkflowGraph): WorkflowGraph {
  return {
    nodes: [...graph.nodes].sort((a, b) => a.id.localeCompare(b.id)),
    edges: [...graph.edges].sort((a, b) => a.id.localeCompare(b.id)),
    viewport: graph.viewport ? { ...graph.viewport } : undefined,
  };
}

export function detectCycles(edges: WorkflowEdge[]): string[][] {
  const adj = new Map<string, string[]>();
  for (const e of edges) {
    if (!adj.has(e.source)) adj.set(e.source, []);
    adj.get(e.source)!.push(e.target);
  }
  const visited = new Set<string>();
  const recStack = new Set<string>();
  const cycles: string[][] = [];
  const path: string[] = [];
  function dfs(node: string) {
    if (recStack.has(node)) {
      const cycleStart = path.indexOf(node);
      if (cycleStart >= 0) cycles.push([...path.slice(cycleStart), node]);
      return;
    }
    if (visited.has(node)) return;
    visited.add(node);
    recStack.add(node);
    path.push(node);
    for (const neighbor of adj.get(node) ?? []) dfs(neighbor);
    path.pop();
    recStack.delete(node);
  }
  for (const node of adj.keys()) dfs(node);
  return cycles;
}
