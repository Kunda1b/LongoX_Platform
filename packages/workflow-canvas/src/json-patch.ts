/**
 * RFC 6902 JSON Patch computation for workflow graphs.
 *
 * Computes a minimal JSON Patch between two graph snapshots.
 * The patch is persisted to workflow_diffs.patch and can be replayed
 * to reconstruct any intermediate graph version.
 *
 * Patch operations used:
 *   add     — node/edge added
 *   remove  — node/edge removed
 *   replace — field value changed
 *   move    — node position moved (encoded as remove + add)
 *
 * Usage:
 *   const patch = computeGraphPatch(fromGraph, toGraph);
 *   const semantic = classifyPatch(fromGraph, toGraph, patch);
 *   const restored = applyPatch(fromGraph, patch);
 */

import type { WorkflowGraph, WorkflowNode, WorkflowEdge } from "./graph";

// ─── RFC 6902 operation types ─────────────────────────────────────────────────

export type PatchOp =
  | { op: "add"; path: string; value: unknown }
  | { op: "remove"; path: string }
  | { op: "replace"; path: string; value: unknown }
  | { op: "move"; from: string; path: string }
  | { op: "copy"; from: string; path: string }
  | { op: "test"; path: string; value: unknown };

export type JsonPatch = PatchOp[];

// ─── Semantic change classification ───────────────────────────────────────────

export type SemanticChangeType =
  | "node_added"
  | "node_removed"
  | "node_renamed"
  | "node_moved"
  | "node_type_changed"
  | "node_config_changed"
  | "edge_added"
  | "edge_removed"
  | "edge_rewired";

export interface SemanticChange {
  type: SemanticChangeType;
  nodeId?: string;
  edgeId?: string;
  /** Human-readable description */
  description: string;
  /** The path(s) in the RFC 6902 patch that triggered this semantic change */
  patchPaths: string[];
  /** Old value (for rename/move/config changes) */
  from?: unknown;
  /** New value */
  to?: unknown;
}

// ─── Main: compute patch ──────────────────────────────────────────────────────

/**
 * Compute a minimal RFC 6902 JSON Patch from fromGraph → toGraph.
 */
export function computeGraphPatch(
  fromGraph: WorkflowGraph,
  toGraph: WorkflowGraph,
): JsonPatch {
  const ops: PatchOp[] = [];

  const fromNodeMap = new Map(fromGraph.nodes.map((n) => [n.id, n]));
  const toNodeMap = new Map(toGraph.nodes.map((n) => [n.id, n]));
  const fromEdgeMap = new Map(fromGraph.edges.map((e) => [e.id, e]));
  const toEdgeMap = new Map(toGraph.edges.map((e) => [e.id, e]));

  // ── Nodes ─────────────────────────────────────────────────────────────────

  // Removed nodes
  for (const [id] of fromNodeMap) {
    if (!toNodeMap.has(id)) {
      ops.push({ op: "remove", path: `/nodes/${id}` });
    }
  }

  // Added nodes
  for (const [id, node] of toNodeMap) {
    if (!fromNodeMap.has(id)) {
      ops.push({ op: "add", path: `/nodes/${id}`, value: deepClone(node) });
    }
  }

  // Modified nodes
  for (const [id, toNode] of toNodeMap) {
    const fromNode = fromNodeMap.get(id);
    if (!fromNode) continue;

    const fieldOps = diffNodeFields(id, fromNode, toNode);
    ops.push(...fieldOps);
  }

  // ── Edges ─────────────────────────────────────────────────────────────────

  // Removed edges
  for (const [id] of fromEdgeMap) {
    if (!toEdgeMap.has(id)) {
      ops.push({ op: "remove", path: `/edges/${id}` });
    }
  }

  // Added edges
  for (const [id, edge] of toEdgeMap) {
    if (!fromEdgeMap.has(id)) {
      ops.push({ op: "add", path: `/edges/${id}`, value: deepClone(edge) });
    }
  }

  // Modified edges
  for (const [id, toEdge] of toEdgeMap) {
    const fromEdge = fromEdgeMap.get(id);
    if (!fromEdge) continue;

    const fieldOps = diffEdgeFields(id, fromEdge, toEdge);
    ops.push(...fieldOps);
  }

  return ops;
}

// ─── Patch application ────────────────────────────────────────────────────────

/**
 * Apply an RFC 6902 patch to a graph snapshot to produce the next version.
 *
 * This is a simplified applicator for workflow graphs (not a full RFC 6902
 * implementation). It handles the paths emitted by computeGraphPatch().
 */
export function applyPatch(
  graph: WorkflowGraph,
  patch: JsonPatch,
): WorkflowGraph {
  let result = deepClone(graph);

  for (const op of patch) {
    result = applyOp(result, op);
  }

  return result;
}

function applyOp(graph: WorkflowGraph, op: PatchOp): WorkflowGraph {
  const nodeMatch = op.path.match(/^\/nodes\/(.+)(?:\/(.+))?$/);
  const edgeMatch = op.path.match(/^\/edges\/(.+)(?:\/(.+))?$/);

  if (nodeMatch) {
    const [, nodeId, field] = nodeMatch;
    const nodes = graph.nodes.map((n) => ({ ...n }));

    if (op.op === "add" && !field) {
      nodes.push(op.value as WorkflowNode);
      return { ...graph, nodes };
    }
    if (op.op === "remove" && !field) {
      return { ...graph, nodes: nodes.filter((n) => n.id !== nodeId) };
    }
    if ((op.op === "replace" || op.op === "add") && field) {
      return {
        ...graph,
        nodes: nodes.map((n) => {
          if (n.id !== nodeId) return n;
          return applyFieldOp(
            n,
            field,
            op.op === "replace" || op.op === "add"
              ? (op as any).value
              : undefined,
          ) as unknown as WorkflowNode;
        }),
      };
    }
    if (op.op === "remove" && field) {
      return {
        ...graph,
        nodes: nodes.map((n) => {
          if (n.id !== nodeId) return n;
          const copy = { ...n } as Record<string, unknown>;
          delete copy[field];
          return copy as unknown as WorkflowNode;
        }),
      };
    }
  }

  if (edgeMatch) {
    const [, edgeId, field] = edgeMatch;
    const edges = graph.edges.map((e) => ({ ...e }));

    if (op.op === "add" && !field) {
      edges.push(op.value as WorkflowEdge);
      return { ...graph, edges };
    }
    if (op.op === "remove" && !field) {
      return { ...graph, edges: edges.filter((e) => e.id !== edgeId) };
    }
    if ((op.op === "replace" || op.op === "add") && field) {
      return {
        ...graph,
        edges: edges.map((e) => {
          if (e.id !== edgeId) return e;
          return applyFieldOp(
            e,
            field,
            (op as any).value,
          ) as unknown as WorkflowEdge;
        }),
      };
    }
  }

  return graph;
}

function applyFieldOp(
  obj: Record<string, unknown>,
  field: string,
  value: unknown,
): Record<string, unknown> {
  const parts = field.split("/");
  if (parts.length === 1) {
    return { ...obj, [field]: value };
  }
  // Nested field (e.g., position/x)
  const [head, ...rest] = parts;
  return {
    ...obj,
    [head]: applyFieldOp(
      (obj[head] ?? {}) as Record<string, unknown>,
      rest.join("/"),
      value,
    ),
  };
}

// ─── Semantic classification ──────────────────────────────────────────────────

/**
 * Classify patch operations into human-readable semantic changes.
 */
export function classifyPatch(
  fromGraph: WorkflowGraph,
  toGraph: WorkflowGraph,
  patch: JsonPatch,
): SemanticChange[] {
  const changes: SemanticChange[] = [];
  const fromNodeMap = new Map(fromGraph.nodes.map((n) => [n.id, n]));
  const toNodeMap = new Map(toGraph.nodes.map((n) => [n.id, n]));
  const fromEdgeMap = new Map(fromGraph.edges.map((e) => [e.id, e]));
  const toEdgeMap = new Map(toGraph.edges.map((e) => [e.id, e]));

  // Group patch ops by entity
  const nodeOps = new Map<string, PatchOp[]>();
  const edgeOps = new Map<string, PatchOp[]>();

  for (const op of patch) {
    const nm = op.path.match(/^\/nodes\/([^/]+)/);
    const em = op.path.match(/^\/edges\/([^/]+)/);
    if (nm) {
      const id = nm[1];
      if (!nodeOps.has(id)) nodeOps.set(id, []);
      nodeOps.get(id)!.push(op);
    } else if (em) {
      const id = em[1];
      if (!edgeOps.has(id)) edgeOps.set(id, []);
      edgeOps.get(id)!.push(op);
    }
  }

  // ── Node changes ─────────────────────────────────────────────────────────

  for (const [nodeId, ops] of nodeOps) {
    const isAdd = ops.some(
      (o) => o.op === "add" && o.path === `/nodes/${nodeId}`,
    );
    const isRemove = ops.some(
      (o) => o.op === "remove" && o.path === `/nodes/${nodeId}`,
    );

    if (isAdd) {
      const node = toNodeMap.get(nodeId);
      changes.push({
        type: "node_added",
        nodeId,
        description: `Added node "${node?.name ?? nodeId}"`,
        patchPaths: ops.map((o) => o.path),
      });
      continue;
    }

    if (isRemove) {
      const node = fromNodeMap.get(nodeId);
      changes.push({
        type: "node_removed",
        nodeId,
        description: `Removed node "${node?.name ?? nodeId}"`,
        patchPaths: ops.map((o) => o.path),
      });
      continue;
    }

    // Modifications
    const fromNode = fromNodeMap.get(nodeId);
    const toNode = toNodeMap.get(nodeId);
    if (!fromNode || !toNode) continue;

    for (const op of ops) {
      const field = op.path.replace(`/nodes/${nodeId}/`, "");

      if (field === "name" || field === "label") {
        changes.push({
          type: "node_renamed",
          nodeId,
          description: `Renamed node "${fromNode.name}" → "${toNode.name}"`,
          patchPaths: [op.path],
          from: (op as any).from_value ?? fromNode.name,
          to: toNode.name,
        });
      } else if (field.startsWith("position")) {
        changes.push({
          type: "node_moved",
          nodeId,
          description: `Moved node "${fromNode.name}"`,
          patchPaths: [op.path],
          from: fromNode.position,
          to: toNode.position,
        });
      } else if (field === "type" || field === "nodeTypeId") {
        changes.push({
          type: "node_type_changed",
          nodeId,
          description: `Changed node "${fromNode.name}" type: ${fromNode.nodeTypeId ?? fromNode.type} → ${toNode.nodeTypeId ?? toNode.type}`,
          patchPaths: [op.path],
          from: fromNode.nodeTypeId ?? fromNode.type,
          to: toNode.nodeTypeId ?? toNode.type,
        });
      } else if (field.startsWith("config")) {
        const existing = changes.find(
          (c) => c.type === "node_config_changed" && c.nodeId === nodeId,
        );
        if (existing) {
          existing.patchPaths.push(op.path);
        } else {
          changes.push({
            type: "node_config_changed",
            nodeId,
            description: `Updated config of node "${fromNode.name}"`,
            patchPaths: [op.path],
            from: fromNode.config,
            to: toNode.config,
          });
        }
      }
    }
  }

  // ── Edge changes ─────────────────────────────────────────────────────────

  for (const [edgeId, ops] of edgeOps) {
    const isAdd = ops.some(
      (o) => o.op === "add" && o.path === `/edges/${edgeId}`,
    );
    const isRemove = ops.some(
      (o) => o.op === "remove" && o.path === `/edges/${edgeId}`,
    );
    const fromEdge = fromEdgeMap.get(edgeId);
    const toEdge = toEdgeMap.get(edgeId);

    if (isAdd) {
      const edge = toEdge ?? (ops.find((o) => o.op === "add") as any)?.value;
      changes.push({
        type: "edge_added",
        edgeId,
        description: `Connected ${edge?.source ?? "?"} → ${edge?.target ?? "?"}`,
        patchPaths: ops.map((o) => o.path),
      });
      continue;
    }

    if (isRemove) {
      changes.push({
        type: "edge_removed",
        edgeId,
        description: `Disconnected ${fromEdge?.source ?? "?"} → ${fromEdge?.target ?? "?"}`,
        patchPaths: ops.map((o) => o.path),
      });
      continue;
    }

    // Source or target changed = rewired
    const rewired = ops.some(
      (o) =>
        o.path.endsWith("/source") ||
        o.path.endsWith("/target") ||
        o.path.endsWith("/sourceHandle") ||
        o.path.endsWith("/targetHandle"),
    );
    if (rewired && fromEdge && toEdge) {
      changes.push({
        type: "edge_rewired",
        edgeId,
        description: `Rewired edge: ${fromEdge.source}→${fromEdge.target} became ${toEdge.source}→${toEdge.target}`,
        patchPaths: ops.map((o) => o.path),
        from: { source: fromEdge.source, target: fromEdge.target },
        to: { source: toEdge.source, target: toEdge.target },
      });
    }
  }

  return changes;
}

// ─── Patch hash ───────────────────────────────────────────────────────────────

/** Stable SHA-256-like hash of the patch for deduplication. */
export function hashPatch(patch: JsonPatch): string {
  const content = JSON.stringify(patch, Object.keys(patch[0] ?? {}).sort());
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const c = content.charCodeAt(i);
    hash = (hash << 5) - hash + c;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(16, "0");
}

// ─── Internal diff helpers ────────────────────────────────────────────────────

function diffNodeFields(
  nodeId: string,
  from: WorkflowNode,
  to: WorkflowNode,
): PatchOp[] {
  const ops: PatchOp[] = [];
  const fields: (keyof WorkflowNode)[] = [
    "name",
    "type",
    "nodeTypeId",
    "position",
    "config",
    "inputHandles",
    "outputHandles",
    "retryPolicy",
    "compensation",
    "approvalGate",
    "loop",
    "childWorkflow",
  ];

  for (const field of fields) {
    const fromVal = from[field];
    const toVal = to[field];

    if (field === "position") {
      const fp = fromVal as { x: number; y: number } | undefined;
      const tp = toVal as { x: number; y: number } | undefined;
      if (fp && tp) {
        if (fp.x !== tp.x) {
          ops.push({
            op: "replace",
            path: `/nodes/${nodeId}/position/x`,
            value: tp.x,
          });
        }
        if (fp.y !== tp.y) {
          ops.push({
            op: "replace",
            path: `/nodes/${nodeId}/position/y`,
            value: tp.y,
          });
        }
      } else if (!fp && tp) {
        ops.push({ op: "add", path: `/nodes/${nodeId}/position`, value: tp });
      } else if (fp && !tp) {
        ops.push({ op: "remove", path: `/nodes/${nodeId}/position` });
      }
      continue;
    }

    if (field === "config") {
      const fc = (fromVal ?? {}) as Record<string, unknown>;
      const tc = (toVal ?? {}) as Record<string, unknown>;
      const configOps = diffObject(`/nodes/${nodeId}/config`, fc, tc);
      ops.push(...configOps);
      continue;
    }

    const fromJson = JSON.stringify(fromVal ?? null);
    const toJson = JSON.stringify(toVal ?? null);
    if (fromJson !== toJson) {
      if (fromVal === undefined) {
        ops.push({
          op: "add",
          path: `/nodes/${nodeId}/${field}`,
          value: toVal,
        });
      } else if (toVal === undefined) {
        ops.push({ op: "remove", path: `/nodes/${nodeId}/${field}` });
      } else {
        ops.push({
          op: "replace",
          path: `/nodes/${nodeId}/${field}`,
          value: toVal,
        });
      }
    }
  }

  return ops;
}

function diffEdgeFields(
  edgeId: string,
  from: WorkflowEdge,
  to: WorkflowEdge,
): PatchOp[] {
  const ops: PatchOp[] = [];
  const fields: (keyof WorkflowEdge)[] = [
    "source",
    "target",
    "sourceHandle",
    "targetHandle",
    "type",
    "label",
    "condition",
  ];

  for (const field of fields) {
    const fromVal = from[field];
    const toVal = to[field];
    const fromJson = JSON.stringify(fromVal ?? null);
    const toJson = JSON.stringify(toVal ?? null);
    if (fromJson !== toJson) {
      if (fromVal === undefined) {
        ops.push({
          op: "add",
          path: `/edges/${edgeId}/${field}`,
          value: toVal,
        });
      } else if (toVal === undefined) {
        ops.push({ op: "remove", path: `/edges/${edgeId}/${field}` });
      } else {
        ops.push({
          op: "replace",
          path: `/edges/${edgeId}/${field}`,
          value: toVal,
        });
      }
    }
  }

  return ops;
}

function diffObject(
  basePath: string,
  from: Record<string, unknown>,
  to: Record<string, unknown>,
): PatchOp[] {
  const ops: PatchOp[] = [];
  const allKeys = new Set([...Object.keys(from), ...Object.keys(to)]);

  for (const key of allKeys) {
    const fromVal = from[key];
    const toVal = to[key];
    const fromJson = JSON.stringify(fromVal ?? null);
    const toJson = JSON.stringify(toVal ?? null);
    if (fromJson === toJson) continue;

    if (fromVal === undefined) {
      ops.push({ op: "add", path: `${basePath}/${key}`, value: toVal });
    } else if (toVal === undefined) {
      ops.push({ op: "remove", path: `${basePath}/${key}` });
    } else {
      ops.push({ op: "replace", path: `${basePath}/${key}`, value: toVal });
    }
  }

  return ops;
}

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}
