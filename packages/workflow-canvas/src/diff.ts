/**
 * Workflow graph diff — semantic and JSON Patch.
 *
 * Provides two complementary views of changes between graph versions:
 *
 *   1. SemanticDiff — human-readable changes (node moved, renamed, etc.)
 *      Used for the version history UI and audit log descriptions.
 *
 *   2. JsonPatch (RFC 6902) — machine-readable patch for exact replay.
 *      Persisted to workflow_diffs.patch in the database.
 *
 * Both outputs are computed together via computeFullDiff().
 */

import type { WorkflowGraph } from "./graph";
import { normalizeGraph, type NormalizedGraph } from "./normalizer";
import {
  computeGraphPatch,
  classifyPatch,
  hashPatch,
  type JsonPatch,
  type SemanticChange,
  type SemanticChangeType,
} from "./json-patch";

export type { JsonPatch, SemanticChange, SemanticChangeType };

// ─── Legacy GraphChange (kept for backward compat with normalizer.ts) ─────────

export type GraphChange =
  | { type: "node_added"; nodeId: string; label: string }
  | { type: "node_removed"; nodeId: string; label: string }
  | { type: "node_modified"; nodeId: string; label: string; detail: string }
  | { type: "edge_added"; edgeId: string; source: string; target: string }
  | { type: "edge_removed"; edgeId: string; source: string; target: string };

// ─── DiffResult ───────────────────────────────────────────────────────────────

export interface VersionSnapshot {
  id: string;
  versionNumber: number;
  graph: NormalizedGraph;
  checksum: string;
  createdAt: string;
  createdBy: string;
  message?: string;
}

export interface DiffSummary {
  nodesAdded: number;
  nodesRemoved: number;
  nodesRenamed: number;
  nodesMoved: number;
  nodesConfigChanged: number;
  nodesTypeChanged: number;
  edgesAdded: number;
  edgesRemoved: number;
  edgesRewired: number;
  totalChanges: number;
}

export interface DiffResult {
  fromVersion: number;
  toVersion: number;
  /** RFC 6902 patch — persisted to workflow_diffs.patch */
  patch: JsonPatch;
  /** Stable hash of the patch — stored in workflow_diffs.patch_hash */
  patchHash: string;
  /** Human-readable semantic changes */
  semanticChanges: SemanticChange[];
  /** Summary counts */
  summary: DiffSummary;
  /** Legacy simple changes (backward compat) */
  changes: GraphChange[];
}

// ─── computeFullDiff ─────────────────────────────────────────────────────────

/**
 * Compute both the RFC 6902 JSON Patch and semantic classification
 * between two workflow graph versions.
 */
export function computeFullDiff(
  fromGraph: WorkflowGraph,
  toGraph: WorkflowGraph,
  fromVersion: number,
  toVersion: number,
): DiffResult {
  const patch = computeGraphPatch(fromGraph, toGraph);
  const patchHash = hashPatch(patch);
  const semanticChanges = classifyPatch(fromGraph, toGraph, patch);

  const summary: DiffSummary = {
    nodesAdded: semanticChanges.filter((c) => c.type === "node_added").length,
    nodesRemoved: semanticChanges.filter((c) => c.type === "node_removed")
      .length,
    nodesRenamed: semanticChanges.filter((c) => c.type === "node_renamed")
      .length,
    nodesMoved: semanticChanges.filter((c) => c.type === "node_moved").length,
    nodesConfigChanged: semanticChanges.filter(
      (c) => c.type === "node_config_changed",
    ).length,
    nodesTypeChanged: semanticChanges.filter(
      (c) => c.type === "node_type_changed",
    ).length,
    edgesAdded: semanticChanges.filter((c) => c.type === "edge_added").length,
    edgesRemoved: semanticChanges.filter((c) => c.type === "edge_removed")
      .length,
    edgesRewired: semanticChanges.filter((c) => c.type === "edge_rewired")
      .length,
    totalChanges: semanticChanges.length,
  };

  // Build legacy GraphChange[] for backward compat
  const changes = buildLegacyChanges(semanticChanges, fromGraph, toGraph);

  return {
    fromVersion,
    toVersion,
    patch,
    patchHash,
    semanticChanges,
    summary,
    changes,
  };
}

/** Legacy entrypoint — kept for code that only needs the simple change list. */
export function computeDiff(
  fromGraph: WorkflowGraph,
  toGraph: WorkflowGraph,
  fromVersion: number,
  toVersion: number,
): {
  fromVersion: number;
  toVersion: number;
  changes: GraphChange[];
  summary: {
    nodesAdded: number;
    nodesRemoved: number;
    nodesModified: number;
    edgesAdded: number;
    edgesRemoved: number;
  };
} {
  const full = computeFullDiff(fromGraph, toGraph, fromVersion, toVersion);
  return {
    fromVersion: full.fromVersion,
    toVersion: full.toVersion,
    changes: full.changes,
    summary: {
      nodesAdded: full.summary.nodesAdded,
      nodesRemoved: full.summary.nodesRemoved,
      nodesModified:
        full.summary.nodesRenamed +
        full.summary.nodesMoved +
        full.summary.nodesConfigChanged +
        full.summary.nodesTypeChanged,
      edgesAdded: full.summary.edgesAdded,
      edgesRemoved: full.summary.edgesRemoved,
    },
  };
}

// ─── Utilities ────────────────────────────────────────────────────────────────

export function isGraphEqual(a: WorkflowGraph, b: WorkflowGraph): boolean {
  const normA = normalizeGraph(a);
  const normB = normalizeGraph(b);
  return normA.checksum === normB.checksum;
}

export function getChangeDescription(change: GraphChange): string {
  switch (change.type) {
    case "node_added":
      return `Added node "${change.label}"`;
    case "node_removed":
      return `Removed node "${change.label}"`;
    case "node_modified":
      return `Modified node "${change.label}" (${change.detail})`;
    case "edge_added":
      return `Connected ${change.source} → ${change.target}`;
    case "edge_removed":
      return `Disconnected ${change.source} → ${change.target}`;
  }
}

export function getSemanticChangeDescription(change: SemanticChange): string {
  return change.description;
}

// ─── Render helpers for UI ────────────────────────────────────────────────────

export interface RenderedDiff {
  groups: RenderedDiffGroup[];
  totalCount: number;
  hasBreakingChanges: boolean;
}

export interface RenderedDiffGroup {
  category: string;
  icon: string;
  changes: RenderedDiffLine[];
}

export interface RenderedDiffLine {
  type: SemanticChangeType;
  description: string;
  severity: "info" | "warning" | "error";
  nodeId?: string;
  edgeId?: string;
}

export function renderSemanticDiff(changes: SemanticChange[]): RenderedDiff {
  const groups: Record<string, RenderedDiffGroup> = {
    nodes: { category: "Nodes", icon: "●", changes: [] },
    edges: { category: "Connections", icon: "→", changes: [] },
    config: { category: "Configuration", icon: "⚙", changes: [] },
  };

  let hasBreakingChanges = false;

  for (const change of changes) {
    const line: RenderedDiffLine = {
      type: change.type,
      description: change.description,
      severity: "info",
      nodeId: change.nodeId,
      edgeId: change.edgeId,
    };

    switch (change.type) {
      case "node_added":
        line.severity = "info";
        groups.nodes.changes.push(line);
        break;
      case "node_removed":
        line.severity = "warning";
        hasBreakingChanges = true;
        groups.nodes.changes.push(line);
        break;
      case "node_renamed":
        line.severity = "info";
        groups.nodes.changes.push(line);
        break;
      case "node_moved":
        line.severity = "info";
        groups.nodes.changes.push(line);
        break;
      case "node_type_changed":
        line.severity = "warning";
        hasBreakingChanges = true;
        groups.nodes.changes.push(line);
        break;
      case "node_config_changed":
        line.severity = "info";
        groups.config.changes.push(line);
        break;
      case "edge_added":
        line.severity = "info";
        groups.edges.changes.push(line);
        break;
      case "edge_removed":
        line.severity = "warning";
        groups.edges.changes.push(line);
        break;
      case "edge_rewired":
        line.severity = "warning";
        hasBreakingChanges = true;
        groups.edges.changes.push(line);
        break;
    }
  }

  return {
    groups: Object.values(groups).filter((g) => g.changes.length > 0),
    totalCount: changes.length,
    hasBreakingChanges,
  };
}

// ─── Internal ─────────────────────────────────────────────────────────────────

function buildLegacyChanges(
  semantic: SemanticChange[],
  fromGraph: WorkflowGraph,
  toGraph: WorkflowGraph,
): GraphChange[] {
  const fromNodeMap = new Map(fromGraph.nodes.map((n) => [n.id, n]));
  const toNodeMap = new Map(toGraph.nodes.map((n) => [n.id, n]));
  const fromEdgeMap = new Map(fromGraph.edges.map((e) => [e.id, e]));
  const toEdgeMap = new Map(toGraph.edges.map((e) => [e.id, e]));

  const changes: GraphChange[] = [];

  for (const c of semantic) {
    switch (c.type) {
      case "node_added":
        changes.push({
          type: "node_added",
          nodeId: c.nodeId!,
          label: toNodeMap.get(c.nodeId!)?.name ?? c.nodeId!,
        });
        break;
      case "node_removed":
        changes.push({
          type: "node_removed",
          nodeId: c.nodeId!,
          label: fromNodeMap.get(c.nodeId!)?.name ?? c.nodeId!,
        });
        break;
      case "node_renamed":
      case "node_moved":
      case "node_type_changed":
      case "node_config_changed":
        changes.push({
          type: "node_modified",
          nodeId: c.nodeId!,
          label: toNodeMap.get(c.nodeId!)?.name ?? c.nodeId!,
          detail: c.type.replace("node_", ""),
        });
        break;
      case "edge_added": {
        const e = toEdgeMap.get(c.edgeId!);
        if (e)
          changes.push({
            type: "edge_added",
            edgeId: c.edgeId!,
            source: e.source,
            target: e.target,
          });
        break;
      }
      case "edge_removed": {
        const e = fromEdgeMap.get(c.edgeId!);
        if (e)
          changes.push({
            type: "edge_removed",
            edgeId: c.edgeId!,
            source: e.source,
            target: e.target,
          });
        break;
      }
      case "edge_rewired": {
        const fe = fromEdgeMap.get(c.edgeId!);
        if (fe)
          changes.push({
            type: "edge_removed",
            edgeId: c.edgeId!,
            source: fe.source,
            target: fe.target,
          });
        const te = toEdgeMap.get(c.edgeId!);
        if (te)
          changes.push({
            type: "edge_added",
            edgeId: c.edgeId!,
            source: te.source,
            target: te.target,
          });
        break;
      }
    }
  }

  return changes;
}
