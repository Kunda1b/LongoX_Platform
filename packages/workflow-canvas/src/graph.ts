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
export interface WorkflowGraph {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  viewport: CanvasViewport;
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
    viewport: { ...graph.viewport },
  };
}
export function detectCycles(edges: CanvasEdge[]): string[][] {
  const adj = new Map<string, string[]>();
  for (const e of edges) {
    if (!adj.has(e.sourceNodeId)) adj.set(e.sourceNodeId, []);
    adj.get(e.sourceNodeId)!.push(e.targetNodeId);
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

export function getDownstreamNodes(graph: WorkflowGraph, nodeId: string): string[] {
  const adj = new Map<string, string[]>();
  for (const e of graph.edges) {
    if (!adj.has(e.sourceNodeId)) adj.set(e.sourceNodeId, []);
    adj.get(e.sourceNodeId)!.push(e.targetNodeId);
  }
  const result: string[] = [];
  const visited = new Set<string>();
  function dfs(id: string) {
    for (const neighbor of adj.get(id) ?? []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        result.push(neighbor);
        dfs(neighbor);
      }
    }
  }
  dfs(nodeId);
  return result;
}

export function getUpstreamNodes(graph: WorkflowGraph, nodeId: string): string[] {
  const revAdj = new Map<string, string[]>();
  for (const e of graph.edges) {
    if (!revAdj.has(e.targetNodeId)) revAdj.set(e.targetNodeId, []);
    revAdj.get(e.targetNodeId)!.push(e.sourceNodeId);
  }
  const result: string[] = [];
  const visited = new Set<string>();
  function dfs(id: string) {
    for (const neighbor of revAdj.get(id) ?? []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        result.push(neighbor);
        dfs(neighbor);
      }
    }
  }
  dfs(nodeId);
  return result;
}
