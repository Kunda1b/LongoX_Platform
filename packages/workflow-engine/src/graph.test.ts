import { describe, it, expect } from "vitest";
import {
  topologicalSort,
  getEntryNodes,
  getExitNodes,
  getUpstreamNodes,
  getDownstreamNodes,
} from "./graph";
import type { WorkflowGraph } from "./types";

function makeGraph(overrides?: Partial<WorkflowGraph>): WorkflowGraph {
  return {
    nodes: [
      { id: "n1", name: "Start" },
      { id: "n2", name: "Process" },
      { id: "n3", name: "End" },
    ],
    edges: [
      { id: "e1", source: "n1", target: "n2" },
      { id: "e2", source: "n2", target: "n3" },
    ],
    ...overrides,
  };
}

describe("topologicalSort", () => {
  it("returns nodes in dependency order", () => {
    const sorted = topologicalSort(makeGraph());
    expect(sorted.map((n) => n.id)).toEqual(["n1", "n2", "n3"]);
  });

  it("handles a single node", () => {
    const sorted = topologicalSort(makeGraph({ nodes: [{ id: "n1", name: "Solo" }], edges: [] }));
    expect(sorted).toHaveLength(1);
    expect(sorted[0].id).toBe("n1");
  });

  it("handles branching graph", () => {
    const graph: WorkflowGraph = {
      nodes: [
        { id: "a", name: "A" },
        { id: "b", name: "B" },
        { id: "c", name: "C" },
        { id: "d", name: "D" },
      ],
      edges: [
        { id: "e1", source: "a", target: "b" },
        { id: "e2", source: "a", target: "c" },
        { id: "e3", source: "b", target: "d" },
        { id: "e4", source: "c", target: "d" },
      ],
    };
    const sorted = topologicalSort(graph);
    expect(sorted[0].id).toBe("a");
    expect(sorted[sorted.length - 1].id).toBe("d");
    expect(sorted.map((n) => n.id)).toContain("b");
    expect(sorted.map((n) => n.id)).toContain("c");
  });

  it("handles diamond graph", () => {
    const graph: WorkflowGraph = {
      nodes: [
        { id: "start", name: "Start" },
        { id: "fork", name: "Fork" },
        { id: "join", name: "Join" },
        { id: "end", name: "End" },
      ],
      edges: [
        { id: "e1", source: "start", target: "fork" },
        { id: "e2", source: "fork", target: "join" },
        { id: "e3", source: "fork", target: "join" },
        { id: "e4", source: "join", target: "end" },
      ],
    };
    const sorted = topologicalSort(graph);
    expect(sorted[0].id).toBe("start");
    expect(sorted[sorted.length - 1].id).toBe("end");
  });

  it("handles disconnected components", () => {
    const graph: WorkflowGraph = {
      nodes: [
        { id: "a", name: "A" },
        { id: "b", name: "B" },
        { id: "x", name: "X" },
        { id: "y", name: "Y" },
      ],
      edges: [
        { id: "e1", source: "a", target: "b" },
        { id: "e2", source: "x", target: "y" },
      ],
    };
    const sorted = topologicalSort(graph);
    expect(sorted).toHaveLength(4);
    expect(sorted.map((n) => n.id)).toContain("a");
    expect(sorted.map((n) => n.id)).toContain("x");
  });

  it("handles empty graph", () => {
    const sorted = topologicalSort({ nodes: [], edges: [] });
    expect(sorted).toEqual([]);
  });

  it("handles graph with no edges", () => {
    const graph = makeGraph({ edges: [] });
    const sorted = topologicalSort(graph);
    expect(sorted).toHaveLength(3);
  });
});

describe("getEntryNodes", () => {
  it("returns nodes with no incoming edges", () => {
    const entries = getEntryNodes(makeGraph());
    expect(entries).toHaveLength(1);
    expect(entries[0].id).toBe("n1");
  });

  it("returns multiple entry nodes for disconnected graph", () => {
    const graph: WorkflowGraph = {
      nodes: [
        { id: "a", name: "A" },
        { id: "b", name: "B" },
      ],
      edges: [],
    };
    expect(getEntryNodes(graph)).toHaveLength(2);
  });

  it("returns empty for cyclic graph with no entry", () => {
    const graph: WorkflowGraph = {
      nodes: [{ id: "a", name: "A" }, { id: "b", name: "B" }],
      edges: [
        { id: "e1", source: "a", target: "b" },
        { id: "e2", source: "b", target: "a" },
      ],
    };
    expect(getEntryNodes(graph)).toHaveLength(0);
  });

  it("returns empty for empty graph", () => {
    expect(getEntryNodes({ nodes: [], edges: [] })).toEqual([]);
  });
});

describe("getExitNodes", () => {
  it("returns nodes with no outgoing edges", () => {
    const exits = getExitNodes(makeGraph());
    expect(exits).toHaveLength(1);
    expect(exits[0].id).toBe("n3");
  });

  it("returns multiple exit nodes", () => {
    const graph: WorkflowGraph = {
      nodes: [
        { id: "a", name: "A" },
        { id: "b", name: "B" },
        { id: "c", name: "C" },
      ],
      edges: [
        { id: "e1", source: "a", target: "b" },
        { id: "e2", source: "a", target: "c" },
      ],
    };
    const exits = getExitNodes(graph);
    expect(exits).toHaveLength(2);
    expect(exits.map((n) => n.id).sort()).toEqual(["b", "c"]);
  });

  it("returns empty for empty graph", () => {
    expect(getExitNodes({ nodes: [], edges: [] })).toEqual([]);
  });
});

describe("getUpstreamNodes", () => {
  it("returns all ancestors of a node", () => {
    const upstream = getUpstreamNodes(makeGraph(), "n3");
    expect(upstream.map((n) => n.id).sort()).toEqual(["n1", "n2"]);
  });

  it("returns empty for entry node", () => {
    expect(getUpstreamNodes(makeGraph(), "n1")).toEqual([]);
  });

  it("handles missing node id gracefully", () => {
    expect(getUpstreamNodes(makeGraph(), "nonexistent")).toEqual([]);
  });
});

describe("getDownstreamNodes", () => {
  it("returns all descendants of a node", () => {
    const downstream = getDownstreamNodes(makeGraph(), "n1");
    expect(downstream.map((n) => n.id).sort()).toEqual(["n2", "n3"]);
  });

  it("returns empty for exit node", () => {
    expect(getDownstreamNodes(makeGraph(), "n3")).toEqual([]);
  });

  it("handles missing node id gracefully", () => {
    expect(getDownstreamNodes(makeGraph(), "nonexistent")).toEqual([]);
  });
});
