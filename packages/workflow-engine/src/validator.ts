import type { WorkflowNode, WorkflowEdge, WorkflowGraph } from "./types";

export interface ValidationError {
  type: "error" | "warning";
  message: string;
  nodeId?: string;
  edgeId?: string;
  code: string;
}

export function validateWorkflow(graph: WorkflowGraph): ValidationError[] {
  const errors: ValidationError[] = [];
  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));
  const edgeMap = new Map(graph.edges.map((e) => [e.id, e]));

  // Check for disconnected nodes
  const connectedNodes = new Set<string>();
  for (const edge of graph.edges) {
    connectedNodes.add(edge.source);
    connectedNodes.add(edge.target);
  }

  for (const node of graph.nodes) {
    if (!connectedNodes.has(node.id) && graph.nodes.length > 1) {
      errors.push({
        type: "warning",
        message: `Node "${node.name}" is disconnected`,
        nodeId: node.id,
        code: "DISCONNECTED_NODE",
      });
    }

    if (!node.nodeTypeId && !node.type) {
      errors.push({
        type: "error",
        message: `Node "${node.name}" has no type defined`,
        nodeId: node.id,
        code: "MISSING_NODE_TYPE",
      });
    }
  }

  // Check edges reference valid nodes
  for (const edge of graph.edges) {
    if (!nodeMap.has(edge.source)) {
      errors.push({
        type: "error",
        message: `Edge references non-existent source node "${edge.source}"`,
        edgeId: edge.id,
        code: "INVALID_SOURCE",
      });
    }
    if (!nodeMap.has(edge.target)) {
      errors.push({
        type: "error",
        message: `Edge references non-existent target node "${edge.target}"`,
        edgeId: edge.id,
        code: "INVALID_TARGET",
      });
    }
  }

  // Cycle detection using DFS
  const visited = new Set<string>();
  const inStack = new Set<string>();

  function hasCycle(nodeId: string): boolean {
    if (inStack.has(nodeId)) return true;
    if (visited.has(nodeId)) return false;

    visited.add(nodeId);
    inStack.add(nodeId);

    const outgoing = graph.edges.filter((e) => e.source === nodeId);
    for (const edge of outgoing) {
      if (hasCycle(edge.target)) return true;
    }

    inStack.delete(nodeId);
    return false;
  }

  for (const node of graph.nodes) {
    if (!visited.has(node.id) && hasCycle(node.id)) {
      errors.push({
        type: "error",
        message: "Workflow contains a cycle",
        nodeId: node.id,
        code: "CYCLE_DETECTED",
      });
      break;
    }
  }

  return errors;
}

export function validateNodeConfig(
  node: WorkflowNode,
  configSchema: Record<string, unknown>,
): ValidationError[] {
  const errors: ValidationError[] = [];
  const config = node.config ?? {};

  for (const [key, type] of Object.entries(configSchema)) {
    const value = config[key];
    if (value === undefined || value === null) {
      errors.push({
        type: "error",
        message: `Node "${node.name}" missing required config: "${key}"`,
        nodeId: node.id,
        code: "MISSING_CONFIG",
      });
    } else if (typeof value !== type) {
      errors.push({
        type: "error",
        message: `Node "${node.name}": config "${key}" expected "${type}" but got "${typeof value}"`,
        nodeId: node.id,
        code: "INVALID_CONFIG_TYPE",
      });
    }
  }

  return errors;
}
