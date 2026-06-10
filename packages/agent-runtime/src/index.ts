import { randomUUID } from "node:crypto";
import type {
  AgentConfig,
  AgentContext,
  AgentRunResult,
  AgentMessage,
  AgentToolCall,
  AgentToolResult,
} from "./types";
export * from "./types";
export class AgentRuntime {
  private config: AgentConfig;
  constructor(config: AgentConfig) {
    this.config = config;
  }
  async run(context: AgentContext): Promise<AgentRunResult> {
    const startTime = Date.now();
    const messages: AgentMessage[] = [
      {
        id: randomUUID(),
        role: "system",
        content: this.config.systemPrompt,
        timestamp: new Date().toISOString(),
      },
      ...context.history,
    ];
    let iterationCount = 0;
    let finalOutput: unknown = null;
    let error: string | undefined;
    let totalPrompt = 0;
    let totalCompletion = 0;
    try {
      while (iterationCount < this.config.maxIterations) {
        iterationCount++;
        const assistantMsg: AgentMessage = {
          id: randomUUID(),
          role: "assistant",
          content: `[Agent: ${this.config.name}] Iteration ${iterationCount} completed.`,
          timestamp: new Date().toISOString(),
        };
        messages.push(assistantMsg);
        if (
          iterationCount >= this.config.maxIterations ||
          assistantMsg.content.includes("FINAL")
        ) {
          finalOutput = assistantMsg.content;
          break;
        }
      }
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    }
    const durationMs = Date.now() - startTime;
    return {
      success: !error,
      output: finalOutput ?? error,
      messages,
      iterationCount,
      durationMs,
      tokenUsage: {
        prompt: totalPrompt,
        completion: totalCompletion,
        total: totalPrompt + totalCompletion,
      },
      error,
    };
  }
}
export function createAgent(config: AgentConfig): AgentRuntime {
  return new AgentRuntime(config);
}
