"use client";

import type { SemanticChange, RenderedDiff } from "@longox/workflow-canvas";
import { renderSemanticDiff } from "@longox/workflow-canvas";
import { cn } from "@/lib/utils";

interface SemanticDiffProps {
  workflowDiff: {
    semanticChanges: SemanticChange[];
    summary: {
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
    };
    fromVersion: number;
    toVersion: number;
  };
}

const TYPE_STYLES: Record<string, string> = {
  node_added: "bg-green-50 border-green-300 text-green-800",
  node_removed: "bg-red-50 border-red-300 text-red-800",
  node_renamed: "bg-blue-50 border-blue-300 text-blue-800",
  node_moved: "bg-yellow-50 border-yellow-300 text-yellow-800",
  node_type_changed: "bg-orange-50 border-orange-300 text-orange-800",
  node_config_changed: "bg-purple-50 border-purple-300 text-purple-800",
  edge_added: "bg-green-50 border-green-300 text-green-800",
  edge_removed: "bg-red-50 border-red-300 text-red-800",
  edge_rewired: "bg-amber-50 border-amber-300 text-amber-800",
};

const TYPE_LABELS: Record<string, string> = {
  node_added: "Added",
  node_removed: "Removed",
  node_renamed: "Renamed",
  node_moved: "Moved",
  node_type_changed: "Type Changed",
  node_config_changed: "Config Changed",
  edge_added: "Connected",
  edge_removed: "Disconnected",
  edge_rewired: "Rewired",
};

export function SemanticDiff({ workflowDiff }: SemanticDiffProps) {
  const rendered: RenderedDiff = renderSemanticDiff(
    workflowDiff.semanticChanges,
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 text-sm">
        <span className="text-muted-foreground">
          v{workflowDiff.fromVersion} → v{workflowDiff.toVersion}
        </span>
        <span className="text-muted-foreground">
          {workflowDiff.semanticChanges.length} change
          {workflowDiff.semanticChanges.length !== 1 ? "s" : ""}
        </span>
        {rendered.hasBreakingChanges && (
          <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
            Breaking changes
          </span>
        )}
      </div>

      {rendered.groups.length === 0 ? (
        <p className="py-4 text-sm text-muted-foreground">
          No changes detected between versions.
        </p>
      ) : (
        <div className="space-y-3">
          {rendered.groups.map((group) => (
            <div key={group.category}>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {group.icon} {group.category}
              </h4>
              <div className="space-y-1">
                {group.changes.map((change, i) => {
                  const styles =
                    TYPE_STYLES[change.type] ??
                    "bg-gray-50 border-gray-300 text-gray-800";
                  const label = TYPE_LABELS[change.type] ?? change.type;
                  return (
                    <div
                      key={`${change.type}-${change.nodeId ?? change.edgeId ?? i}`}
                      className={cn(
                        "flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs",
                        styles,
                      )}
                    >
                      <span className="shrink-0 rounded bg-white/50 px-1 py-0.5 font-medium">
                        {label}
                      </span>
                      <span className="truncate">{change.description}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
