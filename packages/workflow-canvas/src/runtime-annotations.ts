export type NodeRunStatus = "idle" | "running" | "success" | "failed" | "skipped" | "pending";

export interface NodeRuntimeAnnotation {
  nodeId: string;
  lastRunStatus: NodeRunStatus;
  lastRunAt?: string;
  executionCount: number;
  lastDurationMs?: number;
  warning?: string;
  error?: string;
  output?: Record<string, unknown>;
}

export interface ExecutionAnnotations {
  executionId: string;
  status: "running" | "completed" | "failed" | "cancelled";
  startedAt: string;
  completedAt?: string;
  nodeAnnotations: Map<string, NodeRuntimeAnnotation>;
}

export function createAnnotation(
  nodeId: string,
  status: NodeRunStatus = "idle",
): NodeRuntimeAnnotation {
  return {
    nodeId,
    lastRunStatus: status,
    executionCount: 0,
  };
}

export function updateAnnotation(
  annotation: NodeRuntimeAnnotation,
  updates: Partial<NodeRuntimeAnnotation>,
): NodeRuntimeAnnotation {
  return { ...annotation, ...updates };
}

export function getStatusColor(status: NodeRunStatus): string {
  switch (status) {
    case "running":
      return "text-blue-500";
    case "success":
      return "text-green-500";
    case "failed":
      return "text-red-500";
    case "skipped":
      return "text-amber-500";
    case "pending":
      return "text-muted-foreground";
    case "idle":
    default:
      return "text-muted-foreground/40";
  }
}

export function getStatusBadgeVariant(
  status: NodeRunStatus,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "running":
      return "default";
    case "success":
      return "secondary";
    case "failed":
      return "destructive";
    case "skipped":
    case "pending":
    default:
      return "outline";
  }
}
