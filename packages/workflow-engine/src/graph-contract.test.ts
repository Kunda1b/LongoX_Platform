import { describe, it, expect } from "vitest";
import {
  validateGraphContract,
  computeGraphChecksum,
  computeDiff,
  applyDiff,
  getChangedNodes,
} from "./graph-contract";
import type { WorkflowGraph, WorkflowNodeContract } from "./graph-contract";

function makeValidGraph(overrides?: Partial<WorkflowGraph>): WorkflowGraph {
  return {
    workflowId: 1,
    version: 1,
    checksum: { algorithm: "sha-256", value: "abc", computedAt: new Date().toISOString() },
    nodes: [
      {
        id: "n1", type: "trigger", label: "Start", category: "trigger",
        position: { x: 0, y: 0 }, config: {}, inputs: [], outputs: [],
      },
      {
        id: "n2", type: "action", label: "Process", category: "action",
        position: { x: 100, y: 0 }, config: {}, inputs: [], outputs: [],
      },
    ],
    edges: [
      { source: "n1", target: "n2" },
    ],
    metadata: {
      name: "Test Workflow",
      description: "A test",
      triggerType: "webhook",
      versionChecksum: { algorithm: "sha-256", value: "abc", computedAt: new Date().toISOString() },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    ...overrides,
  };
}

describe("validateGraphContract", () => {
  it("returns no errors for a valid graph", () => {
    const errors = validateGraphContract(makeValidGraph());
    expect(errors).toEqual([]);
  });

  it("rejects missing workflowId", () => {
    const errors = validateGraphContract(makeValidGraph({ workflowId: 0 }));
    expect(errors).toContain("workflowId must be a positive integer");
  });

  it("rejects missing version", () => {
    const errors = validateGraphContract(makeValidGraph({ version: 0 }));
    expect(errors).toContain("version must be a positive integer");
  });

  it("rejects missing checksum", () => {
    const errors = validateGraphContract(makeValidGraph({ checksum: { algorithm: "sha-256", value: "", computedAt: "" } }));
    expect(errors).toContain("checksum is required");
  });

  it("rejects missing metadata.name", () => {
    const errors = validateGraphContract(makeValidGraph({ metadata: { ...makeValidGraph().metadata, name: "" } }));
    expect(errors).toContain("metadata.name is required");
  });

  it("rejects missing metadata.triggerType", () => {
    const errors = validateGraphContract(makeValidGraph({ metadata: { ...makeValidGraph().metadata, triggerType: "" } }));
    expect(errors).toContain("metadata.triggerType is required");
  });

  it("rejects non-array nodes", () => {
    const errors = validateGraphContract(makeValidGraph({ nodes: undefined as unknown as WorkflowNodeContract[] }));
    expect(errors).toContain("nodes must be an array");
  });

  it("rejects duplicate node ids", () => {
    const errors = validateGraphContract(makeValidGraph({
      nodes: [
        { id: "n1", type: "trigger", label: "A", category: "trigger", position: { x: 0, y: 0 }, config: {}, inputs: [], outputs: [] },
        { id: "n1", type: "action", label: "B", category: "action", position: { x: 100, y: 0 }, config: {}, inputs: [], outputs: [] },
      ],
    }));
    expect(errors).toContain('nodes[1].id "n1" is duplicate');
  });

  it("rejects node without type", () => {
    const errors = validateGraphContract(makeValidGraph({
      nodes: [
        { id: "n1", label: "A", category: "trigger", position: { x: 0, y: 0 }, config: {}, inputs: [], outputs: [] },
      ] as WorkflowNodeContract[],
      edges: [],
    }));
    expect(errors).toContain("nodes[0].type is required");
  });

  it("rejects node without label", () => {
    const errors = validateGraphContract(makeValidGraph({
      nodes: [
        { id: "n1", type: "trigger", label: "", category: "trigger", position: { x: 0, y: 0 }, config: {}, inputs: [], outputs: [] },
      ],
      edges: [],
    }));
    expect(errors).toContain("nodes[0].label is required");
  });

  it("rejects node without position", () => {
    const errors = validateGraphContract(makeValidGraph({
      nodes: [
        { id: "n1", type: "trigger", label: "A", category: "trigger", position: undefined as unknown as { x: number; y: number }, config: {}, inputs: [], outputs: [] },
      ],
      edges: [],
    }));
    expect(errors).toContain("nodes[0].position must have x and y coordinates");
  });

  it("validates retryPolicy", () => {
    const errors = validateGraphContract(makeValidGraph({
      nodes: [
        {
          id: "n1", type: "action", label: "Retry", category: "action",
          position: { x: 0, y: 0 }, config: {}, inputs: [], outputs: [],
          retryPolicy: { maxAttempts: 0, initialDelayMs: -1, maxDelayMs: 100, backoffMultiplier: 0.5, retryableErrors: [], jitter: false },
        },
      ],
      edges: [],
    }));
    expect(errors).toContain("nodes[0].retryPolicy.maxAttempts must be >= 1");
    expect(errors).toContain("nodes[0].retryPolicy.initialDelayMs must be >= 0");
    expect(errors).toContain("nodes[0].retryPolicy.backoffMultiplier must be >= 1");
  });

  it("rejects retryPolicy maxDelayMs < initialDelayMs", () => {
    const errors = validateGraphContract(makeValidGraph({
      nodes: [
        {
          id: "n1", type: "action", label: "Retry", category: "action",
          position: { x: 0, y: 0 }, config: {}, inputs: [], outputs: [],
          retryPolicy: { maxAttempts: 3, initialDelayMs: 5000, maxDelayMs: 1000, backoffMultiplier: 2, retryableErrors: [], jitter: true },
        },
      ],
      edges: [],
    }));
    expect(errors).toContain("nodes[0].retryPolicy.maxDelayMs must be >= initialDelayMs");
  });

  it("validates approvalGate", () => {
    const errors = validateGraphContract(makeValidGraph({
      nodes: [
        {
          id: "n1", type: "approval", label: "Approve", category: "approval",
          position: { x: 0, y: 0 }, config: {}, inputs: [], outputs: [],
          approvalGate: { requiredApprovers: 0, approverRoles: [], timeoutMs: -1, message: "" },
        },
      ],
      edges: [],
    }));
    expect(errors).toContain("nodes[0].approvalGate.requiredApprovers must be >= 1");
    expect(errors).toContain("nodes[0].approvalGate.timeoutMs must be >= 0");
  });

  it("rejects edges referencing missing nodes", () => {
    const errors = validateGraphContract(makeValidGraph({
      nodes: [{ id: "n1", type: "trigger", label: "A", category: "trigger", position: { x: 0, y: 0 }, config: {}, inputs: [], outputs: [] }],
      edges: [{ source: "n1", target: "nonexistent" }],
    }));
    expect(errors).toContain('edges[0].target "nonexistent" not found in nodes');
  });
});

describe("computeGraphChecksum", () => {
  it("produces a sha-256 hash", () => {
    const checksum = computeGraphChecksum(makeValidGraph());
    expect(checksum.algorithm).toBe("sha-256");
    expect(checksum.value).toMatch(/^[a-f0-9]{64}$/);
  });

  it("produces different hashes for different graphs", () => {
    const g1 = computeGraphChecksum(makeValidGraph({ version: 1 }));
    const g2 = computeGraphChecksum(makeValidGraph({ version: 2 }));
    expect(g1.value).not.toBe(g2.value);
  });

  it("includes computedAt timestamp", () => {
    const checksum = computeGraphChecksum(makeValidGraph());
    expect(checksum.computedAt).toBeTruthy();
    expect(() => new Date(checksum.computedAt)).not.toThrow();
  });
});

describe("computeDiff", () => {
  it("detects added nodes", () => {
    const from = makeValidGraph();
    const to = makeValidGraph({
      nodes: [...makeValidGraph().nodes, {
        id: "n3", type: "action", label: "New", category: "action",
        position: { x: 200, y: 0 }, config: {}, inputs: [], outputs: [],
      }],
    });
    const diff = computeDiff(from, to);
    expect(diff.nodeChanges.added).toEqual(["n3"]);
  });

  it("detects removed nodes", () => {
    const from = makeValidGraph();
    const to = makeValidGraph({ nodes: [from.nodes[0]], edges: [] });
    const diff = computeDiff(from, to);
    expect(diff.nodeChanges.removed).toEqual(["n2"]);
  });

  it("detects modified nodes", () => {
    const from = makeValidGraph();
    const to = makeValidGraph({
      nodes: [
        { ...from.nodes[0] },
        { ...from.nodes[1], label: "Modified" },
      ],
    });
    const diff = computeDiff(from, to);
    expect(diff.nodeChanges.modified).toEqual(["n2"]);
  });

  it("detects edge changes", () => {
    const from = makeValidGraph();
    const to = makeValidGraph({ edges: [{ source: "n1", target: "n2", condition: "x > 1" }] });
    const diff = computeDiff(from, to);
    expect(diff.nodeChanges.edgesChanged).toBe(true);
  });

  it("returns empty changes for identical graphs", () => {
    const g = makeValidGraph();
    const diff = computeDiff(g, g);
    expect(diff.nodeChanges.added).toEqual([]);
    expect(diff.nodeChanges.removed).toEqual([]);
    expect(diff.nodeChanges.modified).toEqual([]);
    expect(diff.nodeChanges.edgesChanged).toBe(false);
    expect(diff.patches).toEqual([]);
  });

  it("tracks version numbers", () => {
    const from = makeValidGraph({ version: 1 });
    const to = makeValidGraph({ version: 2 });
    const diff = computeDiff(from, to);
    expect(diff.fromVersion).toBe(1);
    expect(diff.toVersion).toBe(2);
  });

  it("generates patches for structural changes", () => {
    const from = makeValidGraph();
    const to = makeValidGraph({
      metadata: { ...from.metadata, name: "Updated" },
    });
    const diff = computeDiff(from, to);
    expect(diff.patches.length).toBeGreaterThan(0);
  });
});

describe("applyDiff", () => {
  it("applies patches to produce the target graph", () => {
    const from = makeValidGraph();
    const to = makeValidGraph({
      metadata: { ...from.metadata, name: "Updated Name" },
    });
    const diff = computeDiff(from, to);
    const result = applyDiff(from, diff);
    expect(result.metadata.name).toBe("Updated Name");
  });

  it("updates version after apply", () => {
    const from = makeValidGraph({ version: 1 });
    const to = makeValidGraph({ version: 2 });
    const diff = computeDiff(from, to);
    const result = applyDiff(from, diff);
    expect(result.version).toBe(2);
  });

  it("recomputes checksum after apply", () => {
    const from = makeValidGraph();
    const to = makeValidGraph({ nodes: [from.nodes[0]], edges: [] });
    const diff = computeDiff(from, to);
    const result = applyDiff(from, diff);
    expect(result.checksum.value).not.toBe(from.checksum.value);
  });

  it("updates metadata timestamps", () => {
    const from = makeValidGraph();
    const to = makeValidGraph({ metadata: { ...from.metadata, name: "Changed" } });
    const diff = computeDiff(from, to);
    const result = applyDiff(from, diff);
    expect(result.metadata.updatedAt).not.toBe(from.metadata.updatedAt);
  });
});

describe("getChangedNodes", () => {
  it("returns union of added, removed, and modified", () => {
    const diff = {
      fromVersion: 1,
      toVersion: 2,
      checksum: { algorithm: "sha-256" as const, value: "x", computedAt: "" },
      patches: [],
      nodeChanges: {
        added: ["n3"],
        removed: ["n1"],
        modified: ["n2"],
        edgesChanged: false,
      },
      metadata: { author: "test", changeNote: "", timestamp: "" },
    };
    const changed = getChangedNodes(diff);
    expect(changed).toContain("n3");
    expect(changed).toContain("n1");
    expect(changed).toContain("n2");
    expect(changed).toHaveLength(3);
  });
});
