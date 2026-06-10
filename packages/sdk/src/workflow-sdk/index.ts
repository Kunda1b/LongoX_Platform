import type { SdkConfig } from "../index.ts";

export interface WorkflowConfig extends SdkConfig {}

export interface WorkflowDefinition {
  id?: string;
  name: string;
  description?: string;
  version: number;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  metadata?: Record<string, unknown>;
}

export interface WorkflowNode {
  id: string;
  type: string;
  label: string;
  position: { x: number; y: number };
  config: Record<string, unknown>;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  conditions?: Record<string, unknown>;
}

export interface ExecutionResult {
  id: string;
  workflowId: string;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  startedAt: string;
  completedAt?: string;
  error?: string;
  output?: Record<string, unknown>;
}

export class WorkflowClient {
  private config: WorkflowConfig;

  constructor(config: WorkflowConfig) {
    this.config = config;
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (this.config.token) h["Authorization"] = `Bearer ${this.config.token}`;
    if (this.config.apiKey) h["X-Api-Key"] = this.config.apiKey;
    return h;
  }

  async list(params?: { page?: number; limit?: number; search?: string }): Promise<{ items: WorkflowDefinition[]; total: number }> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.limit) searchParams.set("limit", String(params.limit));
    if (params?.search) searchParams.set("search", params.search);

    const res = await fetch(`${this.config.baseUrl}/api/workflows?${searchParams}`, {
      headers: this.headers(),
    });

    if (!res.ok) throw new Error("Failed to list workflows");
    return res.json() as Promise<{ items: WorkflowDefinition[]; total: number }>;
  }

  async get(id: string): Promise<WorkflowDefinition> {
    const res = await fetch(`${this.config.baseUrl}/api/workflows/${id}`, {
      headers: this.headers(),
    });

    if (!res.ok) throw new Error(`Workflow not found: ${id}`);
    return res.json() as Promise<WorkflowDefinition>;
  }

  async create(def: Omit<WorkflowDefinition, "id" | "version">): Promise<WorkflowDefinition> {
    const res = await fetch(`${this.config.baseUrl}/api/workflows`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(def),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message ?? "Failed to create workflow");
    }

    return res.json() as Promise<WorkflowDefinition>;
  }

  async update(id: string, def: Partial<WorkflowDefinition>): Promise<WorkflowDefinition> {
    const res = await fetch(`${this.config.baseUrl}/api/workflows/${id}`, {
      method: "PATCH",
      headers: this.headers(),
      body: JSON.stringify(def),
    });

    if (!res.ok) throw new Error("Failed to update workflow");
    return res.json() as Promise<WorkflowDefinition>;
  }

  async delete(id: string): Promise<void> {
    const res = await fetch(`${this.config.baseUrl}/api/workflows/${id}`, {
      method: "DELETE",
      headers: this.headers(),
    });

    if (!res.ok) throw new Error("Failed to delete workflow");
  }

  async execute(id: string, input?: Record<string, unknown>): Promise<ExecutionResult> {
    const res = await fetch(`${this.config.baseUrl}/api/workflows/${id}/execute`, {
      method: "POST",
      headers: this.headers(),
      body: input ? JSON.stringify({ input }) : undefined,
    });

    if (!res.ok) throw new Error("Failed to execute workflow");
    return res.json() as Promise<ExecutionResult>;
  }

  async getExecution(workflowId: string, executionId: string): Promise<ExecutionResult> {
    const res = await fetch(
      `${this.config.baseUrl}/api/workflows/${workflowId}/executions/${executionId}`,
      { headers: this.headers() },
    );

    if (!res.ok) throw new Error("Execution not found");
    return res.json() as Promise<ExecutionResult>;
  }

  async listExecutions(workflowId: string): Promise<ExecutionResult[]> {
    const res = await fetch(
      `${this.config.baseUrl}/api/workflows/${workflowId}/executions`,
      { headers: this.headers() },
    );

    if (!res.ok) throw new Error("Failed to list executions");
    return res.json() as Promise<ExecutionResult[]>;
  }
}
