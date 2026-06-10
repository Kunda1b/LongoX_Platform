export interface SelectionState {
  nodeIds: string[];
  edgeIds: string[];
  type: "none" | "single" | "group" | "lasso";
}

export function createEmptySelection(): SelectionState {
  return { nodeIds: [], edgeIds: [], type: "none" };
}

export function selectNode(
  selection: SelectionState,
  nodeId: string,
  additive: boolean = false,
): SelectionState {
  if (additive) {
    const already = selection.nodeIds.includes(nodeId);
    return {
      ...selection,
      nodeIds: already
        ? selection.nodeIds.filter((id) => id !== nodeId)
        : [...selection.nodeIds, nodeId],
      type: "group",
    };
  }
  return {
    nodeIds: [nodeId],
    edgeIds: [],
    type: "single",
  };
}

export function selectEdge(
  selection: SelectionState,
  edgeId: string,
  additive: boolean = false,
): SelectionState {
  if (additive) {
    const already = selection.edgeIds.includes(edgeId);
    return {
      ...selection,
      edgeIds: already
        ? selection.edgeIds.filter((id) => id !== edgeId)
        : [...selection.edgeIds, edgeId],
      type: "single",
    };
  }
  return {
    nodeIds: [],
    edgeIds: [edgeId],
    type: "single",
  };
}

export function selectGroup(
  selection: SelectionState,
  nodeIds: string[],
  edgeIds: string[],
): SelectionState {
  return {
    nodeIds: [...new Set([...selection.nodeIds, ...nodeIds])],
    edgeIds: [...new Set([...selection.edgeIds, ...edgeIds])],
    type: "group",
  };
}

export function clearSelection(): SelectionState {
  return createEmptySelection();
}

export function isNodeSelected(selection: SelectionState, nodeId: string): boolean {
  return selection.nodeIds.includes(nodeId);
}

export function isEdgeSelected(selection: SelectionState, edgeId: string): boolean {
  return selection.edgeIds.includes(edgeId);
}

export function hasSelection(selection: SelectionState): boolean {
  return selection.nodeIds.length > 0 || selection.edgeIds.length > 0;
}

export function getSelectedCount(selection: SelectionState): number {
  return selection.nodeIds.length + selection.edgeIds.length;
}

export function selectAll(
  nodeIds: string[],
  edgeIds: string[],
): SelectionState {
  return {
    nodeIds: [...nodeIds],
    edgeIds: [...edgeIds],
    type: "group",
  };
}

export function selectInRect(
  allNodes: Array<{ id: string; position: { x: number; y: number }; width?: number; height?: number }>,
  allEdges: Array<{ id: string; source: string; target: string }>,
  rect: { x: number; y: number; width: number; height: number },
): { nodeIds: string[]; edgeIds: string[] } {
  const rx = Math.min(rect.x, rect.x + rect.width);
  const ry = Math.min(rect.y, rect.y + rect.height);
  const rw = Math.abs(rect.width);
  const rh = Math.abs(rect.height);

  const nodeIds = allNodes
    .filter((n) => {
      const nw = n.width ?? 150;
      const nh = n.height ?? 50;
      return (
        n.position.x + nw >= rx &&
        n.position.x <= rx + rw &&
        n.position.y + nh >= ry &&
        n.position.y <= ry + rh
      );
    })
    .map((n) => n.id);

  const connectedEdgeIds = allEdges
    .filter((e) => nodeIds.includes(e.source) && nodeIds.includes(e.target))
    .map((e) => e.id);

  return { nodeIds, edgeIds: connectedEdgeIds };
}
