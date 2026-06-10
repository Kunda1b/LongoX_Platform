import type { WorkflowNode, WorkflowEdge, WorkflowGraph } from "./types";

export function topologicalSort(graph: WorkflowGraph): WorkflowNode[] {
  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  for (const node of graph.nodes) {
    inDegree.set(node.id, 0);
    adjacency.set(node.id, []);
  }

  for (const edge of graph.edges) {
    adjacency.get(edge.source)?.push(edge.target);
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
  }

  const queue: string[] = [];
  for (const [nodeId, degree] of inDegree) {
    if (degree === 0) queue.push(nodeId);
  }

  const sorted: WorkflowNode[] = [];
  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    const node = nodeMap.get(nodeId);
    if (node) sorted.push(node);

    for (const neighbor of adjacency.get(nodeId) ?? []) {
      const newDegree = (inDegree.get(neighbor) ?? 1) - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) queue.push(neighbor);
    }
  }

  return sorted;
}

export function getUpstreamNodes(
  graph: WorkflowGraph,
  nodeId: string,
): WorkflowNode[] {
  const result: WorkflowNode[] = [];
  const visited = new Set<string>();
  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));

  function walk(currentId: string) {
    if (visited.has(currentId)) return;
    visited.add(currentId);

    const incoming = graph.edges.filter((e) => e.target === currentId);
    for (const edge of incoming) {
      const node = nodeMap.get(edge.source);
      if (node) {
        result.push(node);
        walk(edge.source);
      }
    }
  }

  walk(nodeId);
  return result;
}

export function getDownstreamNodes(
  graph: WorkflowGraph,
  nodeId: string,
): WorkflowNode[] {
  const result: WorkflowNode[] = [];
  const visited = new Set<string>();
  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));

  function walk(currentId: string) {
    if (visited.has(currentId)) return;
    visited.add(currentId);

    const outgoing = graph.edges.filter((e) => e.source === currentId);
    for (const edge of outgoing) {
      const node = nodeMap.get(edge.target);
      if (node) {
        result.push(node);
        walk(edge.target);
      }
    }
  }

  walk(nodeId);
  return result;
}

export function getEntryNodes(graph: WorkflowGraph): WorkflowNode[] {
  const hasIncoming = new Set(graph.edges.map((e) => e.target));
  return graph.nodes.filter((n) => !hasIncoming.has(n.id));
}

export function getExitNodes(graph: WorkflowGraph): WorkflowNode[] {
  const hasOutgoing = new Set(graph.edges.map((e) => e.source));
  return graph.nodes.filter((n) => !hasOutgoing.has(n.id));
}
