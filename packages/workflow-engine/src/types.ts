export interface WorkflowNode {
  id: string;
  name: string;
  type?: string;
  nodeTypeId?: string;
  position?: { x: number; y: number };
  config?: Record<string, unknown>;
  inputHandles?: Array<{ id: string; label: string; type: string }>;
  outputHandles?: Array<{ id: string; label: string; type: string }>;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type?: "default" | "conditional";
  label?: string;
  condition?: Record<string, unknown>;
}

export interface WorkflowGraph {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface ExecutionContext {
  executionId: number;
  workflowId: number;
  workflowName: string;
  triggerType: string;
  triggerPayload: Record<string, unknown>;
  variables: Record<string, unknown>;
  startedAt: Date;
}

export interface NodeExecutionResult {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  status: "success" | "failed";
  output: Record<string, unknown>;
  error: string | null;
  durationMs: number;
  attemptNumber: number;
}

export interface NodeExecutor {
  canHandle(nodeTypeId: string): boolean;
  execute(
    node: WorkflowNode,
    context: ExecutionContext,
    input: Record<string, unknown>,
  ): Promise<NodeExecutionResult>;
}
