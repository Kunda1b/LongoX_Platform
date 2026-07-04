export interface UsageEvent {
  id: string;
  workflowId: string | null;
  workflowName: string | null;
  eventType: string;
  quantity: number;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface ListUsageEventsFilter {
  limit?: number;
  workflowId?: string | null;
  eventType?: string;
}

export interface UsageEventQuantity {
  eventType: string;
  quantity: number;
}

export interface UsageMetrics {
  totalExecutions: number;
  executionsThisMonth: number;
  totalWorkflows: number;
  activeWorkflows: number;
  totalConnectors: number;
  usedConnectors: number;
}
