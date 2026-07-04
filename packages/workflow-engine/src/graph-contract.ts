import { createHash } from "node:crypto";

export interface GraphChecksum {
  algorithm: "sha-256";
  value: string;
  computedAt: string;
}

export interface JsonPatchOperation {
  op: "add" | "remove" | "replace" | "move" | "copy" | "test";
  path: string;
  value?: unknown;
  from?: string;
}

export interface WorkflowDiff {
  fromVersion: number;
  toVersion: number;
  checksum: GraphChecksum;
  patches: JsonPatchOperation[];
  nodeChanges: {
    added: string[];
    removed: string[];
    modified: string[];
    edgesChanged: boolean;
  };
  metadata: {
    author: string;
    changeNote: string;
    timestamp: string;
  };
}

export interface NodeRetryPolicy {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableErrors: string[];
  jitter: boolean;
  timeoutMs?: number;
}

export interface CompensationHandler {
  compensationNodeId: string;
  compensationType: "rollback" | "cleanup" | "notify" | "custom";
  timeoutMs: number;
  inputMapping: Record<string, string>;
}

export interface ApprovalGateMetadata {
  requiredApprovers: number;
  approverRoles: string[];
  approverUserIds?: number[];
  timeoutMs: number;
  message: string;
  escalationRole?: string;
  escalationDelayMs?: number;
}

export interface ChildWorkflowReference {
  workflowId: string;
  versionId?: string;
  executionMode: "sync" | "async";
  inputMapping: Record<string, string>;
  outputMapping: Record<string, string>;
  waitForCompletion: boolean;
  maxWaitMs?: number;
}

export interface EnvironmentPromotionMetadata {
  sourceEnvironment: string;
  targetEnvironment: string;
  promotedAt: string;
  promotedBy: string;
  approvalRequired: boolean;
  approvedBy?: string;
  approvedAt?: string;
  diffChecksum?: GraphChecksum;
  releaseId?: string;
}

export interface WorkflowNodeContract {
  id: string;
  type: string;
  label: string;
  category: string;
  description: string;
  position: { x: number; y: number };
  config: Record<string, unknown>;
  inputs: Array<{ key: string; type: string; required: boolean; defaultValue?: unknown }>;
  outputs: Array<{ key: string; type: string; description?: string }>;
  retryPolicy?: NodeRetryPolicy;
  timeoutMs?: number;
  compensation?: CompensationHandler;
  approvalGate?: ApprovalGateMetadata;
  childWorkflow?: ChildWorkflowReference;
  tags?: string[];
  notes?: string;
}

export interface WorkflowGraph {
  workflowId: string;
  version: number;
  checksum: GraphChecksum;
  nodes: WorkflowNodeContract[];
  edges: Array<{ source: string; target: string; sourceHandle?: string; targetHandle?: string; condition?: string }>;
  metadata: {
    name: string;
    description?: string;
    triggerType: string;
    versionChecksum: GraphChecksum;
    createdAt: string;
    updatedAt: string;
  };
  promotion?: EnvironmentPromotionMetadata;
}

function canonicalJson(obj: unknown): string {
  const seen = new WeakSet<object>();
  return JSON.stringify(obj, (_key: string, value: unknown) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value as object)) return;
      seen.add(value as object);
    }
    if (Array.isArray(value)) {
      return [...value].sort((a, b) => {
        const aId = (a as Record<string, unknown>).id ?? (a as Record<string, unknown>).key ?? "";
        const bId = (b as Record<string, unknown>).id ?? (b as Record<string, unknown>).key ?? "";
        return String(aId).localeCompare(String(bId));
      });
    }
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      const keys = Object.keys(value as Record<string, unknown>).sort();
      const sorted: Record<string, unknown> = {};
      for (const k of keys) {
        sorted[k] = (value as Record<string, unknown>)[k];
      }
      return sorted;
    }
    return value;
  }, 2);
}

export function computeGraphChecksum(graph: Partial<WorkflowGraph>): GraphChecksum {
  const canonical = canonicalJson(graph);
  const hash = createHash("sha-256");
  hash.update(canonical, "utf-8");
  return {
    algorithm: "sha-256",
    value: hash.digest("hex"),
    computedAt: new Date().toISOString(),
  };
}

export function validateGraphContract(graph: WorkflowGraph): string[] {
  const errors: string[] = [];
  if (!graph.workflowId) errors.push("workflowId is required");
  if (!graph.version || graph.version <= 0) errors.push("version must be a positive integer");
  if (!graph.checksum || !graph.checksum.value) errors.push("checksum is required");
  if (!graph.metadata?.name) errors.push("metadata.name is required");
  if (!graph.metadata?.triggerType) errors.push("metadata.triggerType is required");
  if (!Array.isArray(graph.nodes)) {
    errors.push("nodes must be an array");
    return errors;
  }
  if (!Array.isArray(graph.edges)) {
    errors.push("edges must be an array");
    return errors;
  }

  const nodeIds = new Set<string>();
  for (let i = 0; i < graph.nodes.length; i++) {
    const node = graph.nodes[i];
    if (!node.id) errors.push(`nodes[${i}].id is required`);
    else if (nodeIds.has(node.id)) errors.push(`nodes[${i}].id "${node.id}" is duplicate`);
    else nodeIds.add(node.id);
    if (!node.type) errors.push(`nodes[${i}].type is required`);
    if (!node.label) errors.push(`nodes[${i}].label is required`);
    if (!node.category) errors.push(`nodes[${i}].category is required`);
    if (!node.position || typeof node.position.x !== "number" || typeof node.position.y !== "number") {
      errors.push(`nodes[${i}].position must have x and y coordinates`);
    }
    if (!Array.isArray(node.inputs)) errors.push(`nodes[${i}].inputs must be an array`);
    if (!Array.isArray(node.outputs)) errors.push(`nodes[${i}].outputs must be an array`);
    if (node.retryPolicy) {
      const rp = node.retryPolicy;
      if (rp.maxAttempts < 1) errors.push(`nodes[${i}].retryPolicy.maxAttempts must be >= 1`);
      if (rp.initialDelayMs < 0) errors.push(`nodes[${i}].retryPolicy.initialDelayMs must be >= 0`);
      if (rp.maxDelayMs < rp.initialDelayMs) errors.push(`nodes[${i}].retryPolicy.maxDelayMs must be >= initialDelayMs`);
      if (rp.backoffMultiplier < 1) errors.push(`nodes[${i}].retryPolicy.backoffMultiplier must be >= 1`);
    }
    if (node.approvalGate) {
      const ag = node.approvalGate;
      if (ag.requiredApprovers < 1) errors.push(`nodes[${i}].approvalGate.requiredApprovers must be >= 1`);
      if (ag.timeoutMs < 0) errors.push(`nodes[${i}].approvalGate.timeoutMs must be >= 0`);
    }
  }

  for (let i = 0; i < graph.edges.length; i++) {
    const edge = graph.edges[i];
    if (!edge.source) errors.push(`edges[${i}].source is required`);
    if (!edge.target) errors.push(`edges[${i}].target is required`);
    if (!nodeIds.has(edge.source)) errors.push(`edges[${i}].source "${edge.source}" not found in nodes`);
    if (!nodeIds.has(edge.target)) errors.push(`edges[${i}].target "${edge.target}" not found in nodes`);
  }

  return errors;
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return a === b;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((v, i) => deepEqual(v, b[i]));
  }
  if (typeof a === "object" && typeof b === "object") {
    const aKeys = Object.keys(a as Record<string, unknown>).sort();
    const bKeys = Object.keys(b as Record<string, unknown>).sort();
    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every((k) => deepEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]));
  }
  return a === b;
}

function resolveJsonPointer(root: unknown, pointer: string): unknown {
  const segments = pointer.split("/").filter(Boolean);
  let current: unknown = root;
  for (const seg of segments) {
    if (current === null || current === undefined) return undefined;
    if (Array.isArray(current)) {
      const idx = seg === "-" ? (current as unknown[]).length : Number(seg);
      if (isNaN(idx)) return undefined;
      current = (current as unknown[])[idx];
    } else if (typeof current === "object") {
      current = (current as Record<string, unknown>)[seg];
    } else {
      return undefined;
    }
  }
  return current;
}

function setJsonPointer(root: unknown, pointer: string, value: unknown): void {
  const segments = pointer.split("/").filter(Boolean);
  let current: unknown = root;
  for (let i = 0; i < segments.length - 1; i++) {
    const seg = segments[i];
    if (current && typeof current === "object") {
      current = (current as Record<string, unknown>)[seg];
    }
  }
  const lastKey = segments[segments.length - 1];
  if (current && typeof current === "object") {
    if (Array.isArray(current) && lastKey === "-") {
      (current as unknown[]).push(value);
    } else {
      (current as Record<string, unknown>)[lastKey] = value;
    }
  }
}

function removeJsonPointer(root: unknown, pointer: string): void {
  const segments = pointer.split("/").filter(Boolean);
  let current: unknown = root;
  for (let i = 0; i < segments.length - 1; i++) {
    const seg = segments[i];
    if (current && typeof current === "object") {
      current = (current as Record<string, unknown>)[seg];
    }
  }
  const lastKey = segments[segments.length - 1];
  if (current && typeof current === "object") {
    if (Array.isArray(current)) {
      (current as unknown[]).splice(Number(lastKey), 1);
    } else {
      delete (current as Record<string, unknown>)[lastKey];
    }
  }
}

function findPatchOperations(from: unknown, to: unknown, basePath: string): JsonPatchOperation[] {
  const patches: JsonPatchOperation[] = [];
  if (deepEqual(from, to)) return patches;

  if (from === undefined && to !== undefined) {
    patches.push({ op: "add", path: basePath, value: to });
    return patches;
  }
  if (from !== undefined && to === undefined) {
    patches.push({ op: "remove", path: basePath });
    return patches;
  }

  if (typeof from !== typeof to || from === null || to === null || typeof from !== "object" || typeof to !== "object") {
    patches.push({ op: "replace", path: basePath, value: to });
    return patches;
  }

  if (Array.isArray(from) && Array.isArray(to)) {
    if (deepEqual(from, to)) return patches;
    patches.push({ op: "replace", path: basePath, value: to });
    return patches;
  }

  const fromObj = from as Record<string, unknown>;
  const toObj = to as Record<string, unknown>;
  const allKeys = new Set([...Object.keys(fromObj), ...Object.keys(toObj)]);

  for (const key of allKeys) {
    const subPath = `${basePath}/${key}`;
    if (!(key in fromObj)) {
      patches.push({ op: "add", path: subPath, value: toObj[key] });
    } else if (!(key in toObj)) {
      patches.push({ op: "remove", path: subPath });
    } else {
      patches.push(...findPatchOperations(fromObj[key], toObj[key], subPath));
    }
  }

  return patches;
}

export function computeDiff(from: WorkflowGraph, to: WorkflowGraph): WorkflowDiff {
  const fromIds = new Set(from.nodes.map((n) => n.id));
  const toIds = new Set(to.nodes.map((n) => n.id));

  const added = to.nodes.filter((n) => !fromIds.has(n.id)).map((n) => n.id);
  const removed = from.nodes.filter((n) => !toIds.has(n.id)).map((n) => n.id);
  const modified = to.nodes
    .filter((n) => fromIds.has(n.id))
    .filter((n) => {
      const orig = from.nodes.find((o) => o.id === n.id)!;
      return !deepEqual(orig, n);
    })
    .map((n) => n.id);

  const edgesChanged = !deepEqual(
    [...from.edges].sort((a, b) => `${a.source}->${a.target}`.localeCompare(`${b.source}->${b.target}`)),
    [...to.edges].sort((a, b) => `${a.source}->${a.target}`.localeCompare(`${b.source}->${b.target}`)),
  );

  const fromNodes = [...from.nodes].sort((a, b) => a.id.localeCompare(b.id));
  const toNodes = [...to.nodes].sort((a, b) => a.id.localeCompare(b.id));
  const patches: JsonPatchOperation[] = [
    ...findPatchOperations(fromNodes, toNodes, "/nodes"),
    ...findPatchOperations(from.edges, to.edges, "/edges"),
    ...findPatchOperations(from.metadata, to.metadata, "/metadata"),
  ];

  const checksum = computeGraphChecksum(to);

  return {
    fromVersion: from.version,
    toVersion: to.version,
    checksum,
    patches,
    nodeChanges: { added, removed, modified, edgesChanged },
    metadata: {
      author: "system",
      changeNote: `Diff from v${from.version} to v${to.version}`,
      timestamp: new Date().toISOString(),
    },
  };
}

export function applyDiff(graph: WorkflowGraph, diff: WorkflowDiff): WorkflowGraph {
  const result: WorkflowGraph = JSON.parse(JSON.stringify(graph));

  for (const patch of diff.patches) {
    const segments = patch.path.split("/").filter(Boolean);
    let current: unknown = result;

    for (let i = 0; i < segments.length - 1; i++) {
      const seg = segments[i];
      if (current && typeof current === "object") {
        current = (current as Record<string, unknown>)[seg];
      }
    }

    const lastKey = segments[segments.length - 1];

    if (patch.op === "replace" && current && typeof current === "object") {
      (current as Record<string, unknown>)[lastKey] = patch.value;
    } else if (patch.op === "add" && current && typeof current === "object") {
      if (Array.isArray(current) && lastKey === "-") {
        (current as unknown[]).push(patch.value);
      } else {
        (current as Record<string, unknown>)[lastKey] = patch.value;
      }
    } else if (patch.op === "remove" && current && typeof current === "object") {
      if (Array.isArray(current)) {
        (current as unknown[]).splice(Number(lastKey), 1);
      } else {
        delete (current as Record<string, unknown>)[lastKey];
      }
    } else if (patch.op === "move" && patch.from) {
      const resolved = resolveJsonPointer(result, patch.from);
      if (resolved !== undefined) {
        setJsonPointer(result, patch.path, resolved);
        removeJsonPointer(result, patch.from);
      }
    } else if (patch.op === "copy" && patch.from) {
      const resolved = resolveJsonPointer(result, patch.from);
      if (resolved !== undefined) {
        setJsonPointer(result, patch.path, JSON.parse(JSON.stringify(resolved)));
      }
    } else if (patch.op === "test" && current && typeof current === "object") {
      const actual = (current as Record<string, unknown>)[lastKey];
      if (!deepEqual(actual, patch.value)) {
        throw new Error(`Test failed at ${patch.path}: expected ${JSON.stringify(patch.value)}, got ${JSON.stringify(actual)}`);
      }
    }
  }

  const checksum = computeGraphChecksum(result);
  result.checksum = checksum;
  result.metadata.versionChecksum = checksum;
  result.metadata.updatedAt = new Date().toISOString();
  result.version = diff.toVersion;

  return result;
}

export function getChangedNodes(diff: WorkflowDiff): string[] {
  const changed = new Set<string>();
  for (const id of diff.nodeChanges.added) changed.add(id);
  for (const id of diff.nodeChanges.removed) changed.add(id);
  for (const id of diff.nodeChanges.modified) changed.add(id);
  return [...changed];
}
