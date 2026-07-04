export type WorkflowStatus = "draft" | "active" | "inactive" | "archived";
export type TriggerType = "manual" | "webhook" | "schedule" | "event" | "api";

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string | null;
  status: WorkflowStatus;
  triggerType: TriggerType;
  nodeCount: number;
  executionCount: number;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  lastRunAt: string | null;
  lastRunStatus: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowNode {
  id: string;
  name: string;
  type: string;
  nodeTypeId: string;
  position: { x: number; y: number };
  config: Record<string, unknown>;
  inputHandles: HandleDefinition[];
  outputHandles: HandleDefinition[];
}

export interface HandleDefinition {
  id: string;
  label: string;
  type: string;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle: string;
  targetHandle: string;
  type: "default" | "conditional";
  label?: string;
}

export interface WorkflowVersion {
  id: string;
  workflowId: string;
  version: number;
  name: string;
  nodes: WorkflowNode[];
  changeNote: string | null;
  published: boolean;
  checksum: string;
  createdAt: string;
}

export interface WorkflowPromotion {
  id: string;
  workflowId: string;
  workflowName: string;
  fromEnvironment: string;
  toEnvironment: string;
  status: "pending" | "promoted" | "rejected" | "rolled-back";
  promotedBy: string;
  approvedBy: string | null;
  notes: string | null;
  createdAt: string;
}
