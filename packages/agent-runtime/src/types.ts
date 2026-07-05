export type AgentRole =
  | "orchestrator"
  | "executor"
  | "observer"
  | "planner"
  | "reviewer";

export interface AgentConfig {
  id: string;
  name: string;
  role: AgentRole;
  systemPrompt: string;
  tools: AgentToolDefinition[];
  maxIterations: number;
  temperature: number;
  model: string;
  provider: string;
  memoryEnabled: boolean;
  memoryType: "short_term" | "long_term" | "both";
  planningEnabled: boolean;
  maxSteps: number;
  toolCallTimeout: number;
}

export interface AgentToolDefinition {
  name: string;
  description: string;
  parameters: Record<
    string,
    {
      type: string;
      description: string;
      required?: boolean;
      enum?: string[];
    }
  >;
  handler: (
    args: Record<string, unknown>,
    context: AgentContext,
  ) => Promise<unknown>;
}

export interface AgentContext {
  workflowId: string;
  executionId: string;
  tenantId: string;
  correlationId: string;
  variables: Record<string, unknown>;
  history: AgentMessage[];
  memory: AgentMemoryEntry[];
}

export interface AgentMessage {
  id: string;
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  toolCalls?: AgentToolCall[];
  toolResults?: AgentToolResult[];
  timestamp: string;
}

export interface AgentToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface AgentToolResult {
  toolCallId: string;
  output: unknown;
  error?: string;
}

export interface AgentRunResult {
  success: boolean;
  output: unknown;
  messages: AgentMessage[];
  iterationCount: number;
  tokenUsage: { prompt: number; completion: number; total: number };
  durationMs: number;
  error?: string;
  plan?: AgentPlan;
  memoryUsed: AgentMemoryEntry[];
}

export interface AgentPlan {
  goal: string;
  steps: AgentPlanStep[];
  currentStep: string;
  completedSteps: string[];
}

export interface AgentPlanStep {
  id: string;
  description: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  toolCall?: AgentToolCall;
  result?: AgentToolResult;
}

export interface AgentMemoryEntry {
  id: string;
  key: string;
  content: string;
  memoryType: "short_term" | "long_term";
  metadata: Record<string, unknown>;
  createdAt: string;
  expiresAt?: string;
}

export interface AgentToolCallRequest {
  name: string;
  arguments: Record<string, unknown>;
}
