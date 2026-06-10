import type { WorkflowNode, WorkflowEdge } from "../../domain";

export interface UpdateWorkflowCommand {
  id: number;
  name?: string;
  description?: string | null;
  nodes?: WorkflowNode[];
  edges?: WorkflowEdge[];
}
