export type EdgeType = "default" | "conditional";

export class Edge {
  constructor(
    public readonly id: string,
    public readonly source: string,
    public readonly target: string,
    public readonly sourceHandle: string,
    public readonly targetHandle: string,
    public readonly type: EdgeType,
    public readonly label: string | null,
    public readonly condition: Record<string, unknown> | null,
  ) {}

  static createDefault(
    source: string,
    target: string,
    sourceHandle: string = "output",
    targetHandle: string = "input",
  ): Edge {
    return new Edge(
      `edge-${source}-${target}-${Date.now()}`,
      source,
      target,
      sourceHandle,
      targetHandle,
      "default",
      null,
      null,
    );
  }

  static createConditional(
    source: string,
    target: string,
    label: string,
    condition: Record<string, unknown>,
  ): Edge {
    return new Edge(
      `edge-${source}-${target}-${Date.now()}`,
      source,
      target,
      "output",
      "input",
      "conditional",
      label,
      condition,
    );
  }
}
