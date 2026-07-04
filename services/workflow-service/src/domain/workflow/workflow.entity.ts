export type WorkflowStatus = "draft" | "active" | "inactive" | "archived";
export type TriggerType = "manual" | "webhook" | "schedule" | "event" | "api";

export interface WorkflowNode {
  id: string;
  name: string;
  nodeTypeId: string;
  position: { x: number; y: number };
  config: Record<string, unknown>;
  inputHandles: Array<{ id: string; label: string; type: string }>;
  outputHandles: Array<{ id: string; label: string; type: string }>;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle: string;
  targetHandle: string;
  type: "default" | "conditional";
  label?: string;
  condition?: Record<string, unknown>;
}

export class Workflow {
  constructor(
    public readonly id: string,
    public name: string,
    public description: string | null,
    public status: WorkflowStatus,
    public triggerType: TriggerType,
    public nodeCount: number,
    public executionCount: number,
    public nodes: WorkflowNode[],
    public edges: WorkflowEdge[],
    public lastRunAt: Date | null,
    public lastRunStatus: string | null,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {}

  static create(
    name: string,
    description: string | null,
    triggerType: TriggerType,
  ): Pick<
    Workflow,
    | "name"
    | "description"
    | "status"
    | "triggerType"
    | "nodeCount"
    | "nodes"
    | "edges"
  > {
    return {
      name,
      description,
      status: "draft",
      triggerType,
      nodeCount: 0,
      nodes: [],
      edges: [],
    };
  }

  updateNodes(nodes: WorkflowNode[], edges: WorkflowEdge[]): void {
    this.nodes = nodes;
    this.edges = edges;
    this.nodeCount = nodes.length;
    this.updatedAt = new Date();
  }

  activate(): void {
    this.status = "active";
    this.updatedAt = new Date();
  }

  deactivate(): void {
    this.status = "inactive";
    this.updatedAt = new Date();
  }

  archive(): void {
    this.status = "archived";
    this.updatedAt = new Date();
  }

  recordExecution(status: string): void {
    this.executionCount++;
    this.lastRunAt = new Date();
    this.lastRunStatus = status;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      status: this.status,
      triggerType: this.triggerType,
      nodeCount: this.nodeCount,
      executionCount: this.executionCount,
      nodes: this.nodes,
      edges: this.edges,
      lastRunAt: this.lastRunAt?.toISOString() ?? null,
      lastRunStatus: this.lastRunStatus,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
