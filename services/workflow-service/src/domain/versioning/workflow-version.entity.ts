import type { WorkflowNode, WorkflowEdge } from "../workflow/workflow.entity";

export class WorkflowVersion {
  constructor(
    public readonly id: number,
    public readonly workflowId: number,
    public readonly version: number,
    public readonly name: string,
    public readonly nodes: WorkflowNode[],
    public readonly edges: WorkflowEdge[],
    public readonly changeNote: string | null,
    public readonly published: boolean,
    public readonly checksum: string,
    public readonly createdAt: Date,
  ) {}

  static create(
    workflowId: number,
    version: number,
    name: string,
    nodes: WorkflowNode[],
    edges: WorkflowEdge[],
    changeNote: string | null,
  ): Omit<WorkflowVersion, "id" | "createdAt" | "checksum"> {
    return {
      workflowId,
      version,
      name,
      nodes,
      edges,
      changeNote,
      published: false,
    };
  }

  publish(): void {
    (this as { published: boolean }).published = true;
  }
}

export function computeChecksum(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, "0");
}
