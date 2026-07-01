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
});

describe("getEntryNodes", () => {
  it("returns nodes with no incoming edges", () => {
    const entries = getEntryNodes(makeGraph());
    expect(entries).toHaveLength(1);
    expect(entries[0].id).toBe("n1");
  });
});

describe("getExitNodes", () => {
  it("returns nodes with no outgoing edges", () => {
    const exits = getExitNodes(makeGraph());
    expect(exits).toHaveLength(1);
    expect(exits[0].id).toBe("n3");
  });
});

describe("getUpstreamNodes", () => {
  it("returns all ancestors of a node", () => {
    const upstream = getUpstreamNodes(makeGraph(), "n3");
    expect(upstream.map((n) => n.id).sort()).toEqual(["n1", "n2"]);
  });
});

describe("getDownstreamNodes", () => {
  it("returns all descendants of a node", () => {
    const downstream = getDownstreamNodes(makeGraph(), "n1");
    expect(downstream.map((n) => n.id).sort()).toEqual(["n2", "n3"]);
  });
});
