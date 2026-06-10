import type { WorkflowGraph, WorkflowNode, WorkflowEdge } from "./graph";

export interface CanonicalNode {
  id: string;
  type: string;
  label: string;
  category: string;
  position: { x: number; y: number };
  config: Record<string, unknown>;
  inputs: string[];
  outputs: string[];
}

export interface CanonicalEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
}

export interface NormalizedGraph {
  nodes: CanonicalNode[];
  edges: CanonicalEdge[];
  checksum: string;
  version: number;
  nodeOrder: string[];
}

export function generateStableId(prefix: string = "n"): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function normalizeGraph(
  graph: WorkflowGraph,
  version: number = 1,
): NormalizedGraph {
  const nodes: CanonicalNode[] = graph.nodes.map((n) => ({
    id: n.id,
    type: n.type,
    label: n.label,
    category: (n as any).category ?? "action",
    position: { ...n.position },
    config: { ...(n.config ?? {}) },
    inputs: [...(n.inputs ?? [])],
    outputs: [...(n.outputs ?? [])],
  }));

  const edges: CanonicalEdge[] = graph.edges.map((e) => ({
    id: e.id,
    source: e.sourceNodeId,
    target: e.targetNodeId,
    sourceHandle: (e as any).sourceHandle,
    targetHandle: (e as any).targetHandle,
    label: e.label,
  }));

  const sortedNodes = [...nodes].sort((a, b) => a.id.localeCompare(b.id));
  const sortedEdges = [...edges].sort((a, b) => a.id.localeCompare(b.id));

  const checksum = computeChecksum(sortedNodes, sortedEdges);
  const nodeOrder = topologicalSort(nodes, edges);

  return {
    nodes: sortedNodes,
    edges: sortedEdges,
    checksum,
    version,
    nodeOrder,
  };
}

export function computeChecksum(
  nodes: CanonicalNode[],
  edges: CanonicalEdge[],
): string {
  const content = JSON.stringify({ nodes, edges });
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, "0");
}

export function topologicalSort(
  nodes: CanonicalNode[],
  edges: CanonicalEdge[],
): string[] {
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();

  for (const node of nodes) {
    inDegree.set(node.id, 0);
    adj.set(node.id, []);
  }

  for (const edge of edges) {
    adj.get(edge.source)?.push(edge.target);
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
  }

  const queue: string[] = [];
  for (const [id, deg] of inDegree) {
    if (deg === 0) queue.push(id);
  }

  const sorted: string[] = [];
  while (queue.length > 0) {
    const id = queue.shift()!;
    sorted.push(id);
    for (const neighbor of adj.get(id) ?? []) {
      const newDeg = (inDegree.get(neighbor) ?? 1) - 1;
      inDegree.set(neighbor, newDeg);
      if (newDeg === 0) queue.push(neighbor);
    }
  }

  return sorted;
}

export function detectChanges(
  oldGraph: NormalizedGraph,
  newGraph: NormalizedGraph,
): GraphChange[] {
  const changes: GraphChange[] = [];

  const oldNodeMap = new Map(oldGraph.nodes.map((n) => [n.id, n]));
  const newNodeMap = new Map(newGraph.nodes.map((n) => [n.id, n]));

  for (const node of newGraph.nodes) {
    const old = oldNodeMap.get(node.id);
    if (!old) {
      changes.push({ type: "node_added", nodeId: node.id, label: node.label });
    } else if (
      old.label !== node.label ||
      old.type !== node.type ||
      old.position.x !== node.position.x ||
      old.position.y !== node.position.y
    ) {
      const detail: string[] = [];
      if (old.label !== node.label) detail.push("label");
      if (old.type !== node.type) detail.push("type");
      if (
        old.position.x !== node.position.x ||
        old.position.y !== node.position.y
      )
        detail.push("position");
      changes.push({
        type: "node_modified",
        nodeId: node.id,
        label: node.label,
        detail: detail.join(", "),
      });
    }
  }

  for (const node of oldGraph.nodes) {
    if (!newNodeMap.has(node.id)) {
      changes.push({
        type: "node_removed",
        nodeId: node.id,
        label: node.label,
      });
    }
  }

  const oldEdgeSet = new Set(
    oldGraph.edges.map((e) => `${e.source}->${e.target}`),
  );
  const newEdgeSet = new Set(
    newGraph.edges.map((e) => `${e.source}->${e.target}`),
  );

  for (const edge of newGraph.edges) {
    const key = `${edge.source}->${edge.target}`;
    if (!oldEdgeSet.has(key)) {
      changes.push({
        type: "edge_added",
        edgeId: edge.id,
        source: edge.source,
        target: edge.target,
      });
    }
  }

  for (const edge of oldGraph.edges) {
    const key = `${edge.source}->${edge.target}`;
    if (!newEdgeSet.has(key)) {
      changes.push({
        type: "edge_removed",
        edgeId: edge.id,
        source: edge.source,
        target: edge.target,
      });
    }
  }

  return changes;
}

export type GraphChange =
  | { type: "node_added"; nodeId: string; label: string }
  | { type: "node_removed"; nodeId: string; label: string }
  | { type: "node_modified"; nodeId: string; label: string; detail: string }
  | { type: "edge_added"; edgeId: string; source: string; target: string }
  | { type: "edge_removed"; edgeId: string; source: string; target: string };
