import { useMemo, useCallback } from "react";
import {
  normalizeWorkflowGraph,
  getDownstreamNodes,
  getUpstreamNodes,
  snapToGrid,
  clampZoom,
  selectNode,
  selectEdge,
  clearSelection,
  type WorkflowGraph,
  type CanvasNode,
  type CanvasEdge,
  type SelectionState,
  type ViewportState,
} from "@longox/workflow-canvas";

export interface NormalizedGraphState {
  normalizedGraph: ReturnType<typeof normalizeWorkflowGraph>;
  downstreamNodes: string[];
  upstreamNodes: string[];
}

export function useNormalizedGraph(
  graph: WorkflowGraph,
  selectedNodeId?: string,
): NormalizedGraphState {
  const normalizedGraph = useMemo(() => normalizeWorkflowGraph(graph), [graph]);

  const downstreamNodes = useMemo(
    () => (selectedNodeId ? getDownstreamNodes(graph, selectedNodeId) : []),
    [graph, selectedNodeId],
  );

  const upstreamNodes = useMemo(
    () => (selectedNodeId ? getUpstreamNodes(graph, selectedNodeId) : []),
    [graph, selectedNodeId],
  );

  return { normalizedGraph, downstreamNodes, upstreamNodes };
}

export function useCanvasSelection() {
  const handleNodesChange = useCallback(
    (
      changes: Array<{ type: string; id: string; selected?: boolean }>,
      currentSelection: SelectionState,
    ): SelectionState => {
      let selection = currentSelection;
      for (const change of changes) {
        if (change.type === "select" && change.selected !== undefined) {
          selection = selectNode(selection, change.id, !change.selected);
        }
      }
      return selection;
    },
    [],
  );

  const handleEdgesChange = useCallback(
    (
      changes: Array<{ type: string; id: string; selected?: boolean }>,
      currentSelection: SelectionState,
    ): SelectionState => {
      let selection = currentSelection;
      for (const change of changes) {
        if (change.type === "select" && change.selected !== undefined) {
          selection = selectEdge(selection, change.id, !change.selected);
        }
      }
      return selection;
    },
    [],
  );

  return { handleNodesChange, handleEdgesChange, clearSelection };
}

export function useCanvasViewport() {
  const handleViewportChange = useCallback(
    (viewport: ViewportState): ViewportState => ({
      x: viewport.x,
      y: viewport.y,
      zoom: clampZoom(viewport.zoom),
    }),
    [],
  );

  const handleNodeDragStop = useCallback(
    (
      position: { x: number; y: number },
      gridSize: number = 20,
    ): { x: number; y: number } => snapToGrid(position, gridSize),
    [],
  );

  return { handleViewportChange, handleNodeDragStop };
}
