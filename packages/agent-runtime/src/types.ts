import { randomUUID } from "node:crypto";
export type AgentRole = "orchestrator" | "executor" | "observer" | "planner" | "reviewer";
export interface AgentConfig {
  id: string;
  name: string;
  role: AgentRole;
  systemPrompt: string;
  tools: string[];
  maxIterations: number;
  temperature: number;
  model: string;
}
export interface AgentContext {
  workflowId: string;
  executionId: string;
  tenantId: string;
  correlationId: string;
  variables: Record<string, unknown>;
  history: AgentMessage[];
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
}
