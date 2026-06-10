import type { WorkflowGraph } from "./graph";
import { normalizeGraph, detectChanges, type GraphChange, type NormalizedGraph } from "./normalizer";

export interface VersionSnapshot {
  id: string;
  versionNumber: number;
  graph: NormalizedGraph;
  checksum: string;
  createdAt: string;
  createdBy: string;
  message?: string;
}

export interface DiffResult {
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
}

export function computeDiff(
  fromGraph: WorkflowGraph,
  toGraph: WorkflowGraph,
  fromVersion: number,
  toVersion: number,
): DiffResult {
  const normalizedFrom = normalizeGraph(fromGraph, fromVersion);
  const normalizedTo = normalizeGraph(toGraph, toVersion);

  const changes = detectChanges(normalizedFrom, normalizedTo);

  const summary = {
    nodesAdded: changes.filter((c) => c.type === "node_added").length,
    nodesRemoved: changes.filter((c) => c.type === "node_removed").length,
    nodesModified: changes.filter((c) => c.type === "node_modified").length,
    edgesAdded: changes.filter((c) => c.type === "edge_added").length,
    edgesRemoved: changes.filter((c) => c.type === "edge_removed").length,
  };

  return {
    fromVersion,
    toVersion,
    changes,
    summary,
  };
}

export function isGraphEqual(
  a: WorkflowGraph,
  b: WorkflowGraph,
): boolean {
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
