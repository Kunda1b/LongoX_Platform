import { randomUUID } from "node:crypto";
import type {
  AgentConfig,
  AgentContext,
  AgentRunResult,
  AgentMessage,
  AgentToolCall,
  AgentToolResult,
  AgentPlan,
  AgentPlanStep,
  AgentMemoryEntry,
  AgentToolDefinition,
} from "./types";
export * from "./types";

interface LLMProvider {
  chatCompletion(
    messages: Array<{ role: string; content: string }>,
    options?: { model?: string; temperature?: number; maxTokens?: number },
  ): Promise<{ content: string; inputTokens: number; outputTokens: number }>;
}

export class AgentRuntime {
  private config: AgentConfig;
  private provider: LLMProvider;
  private memoryStore: Map<string, AgentMemoryEntry> = new Map();
  private toolRegistry: Map<string, AgentToolDefinition> = new Map();

  constructor(config: AgentConfig, provider: LLMProvider) {
    this.config = config;
    this.provider = provider;

    for (const tool of config.tools) {
      this.toolRegistry.set(tool.name, tool);
    }
  }

  async run(context: AgentContext): Promise<AgentRunResult> {
    const startTime = Date.now();
    const messages: AgentMessage[] = [
      {
        id: randomUUID(),
        role: "system",
        content: this.buildSystemPrompt(context),
        timestamp: new Date().toISOString(),
      },
      ...context.history,
    ];

    let iterationCount = 0;
    let finalOutput: unknown = null;
    let error: string | undefined;
    let totalPrompt = 0;
    let totalCompletion = 0;
    let plan: AgentPlan | undefined;
    const memoryUsed: AgentMemoryEntry[] = [];

    if (this.config.planningEnabled) {
      plan = await this.createPlan(context);
      messages.push({
        id: randomUUID(),
        role: "user",
        content: `Create a plan to accomplish: ${context.variables.goal ?? "the given task"}. Return a JSON plan with steps.`,
        timestamp: new Date().toISOString(),
      });
    }

    try {
      while (iterationCount < this.config.maxIterations) {
        iterationCount++;

        const llmMessages = messages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const toolDescriptions = Array.from(this.toolRegistry.values())
          .map((t) => `- ${t.name}: ${t.description}`)
          .join("\n");

        if (toolDescriptions) {
          llmMessages[0].content += `\n\nAvailable tools:\n${toolDescriptions}\n\nTo use a tool, respond with JSON: {"tool_call": {"name": "tool_name", "arguments": {...}}}`;
        }

        const response = await this.provider.chatCompletion(llmMessages, {
          model: this.config.model,
          temperature: this.config.temperature,
          maxTokens: 2048,
        });

        totalPrompt += response.inputTokens;
        totalCompletion += response.outputTokens;

        const toolCallMatch = response.content.match(
          /\{"tool_call"\s*:\s*\{[^}]*"name"\s*:\s*"([^"]+)"/,
        );

        if (toolCallMatch) {
          const toolCallData = this.parseToolCall(response.content);
          if (toolCallData) {
            const toolCall: AgentToolCall = {
              id: randomUUID(),
              name: toolCallData.name,
              arguments: toolCallData.arguments,
            };

            const assistantMsg: AgentMessage = {
              id: randomUUID(),
              role: "assistant",
              content: response.content,
              toolCalls: [toolCall],
              timestamp: new Date().toISOString(),
            };
            messages.push(assistantMsg);

            const toolResult = await this.executeToolCall(toolCall, context);
            const toolResultMsg: AgentMessage = {
              id: randomUUID(),
              role: "tool",
              content: JSON.stringify(toolResult.output),
              toolResults: [toolResult],
              timestamp: new Date().toISOString(),
            };
            messages.push(toolResultMsg);

            if (this.config.memoryEnabled) {
              await this.storeMemory(
                `tool_${toolCall.name}_${iterationCount}`,
                JSON.stringify({ call: toolCall, result: toolResult }),
                context,
              );
            }

            if (plan) {
              this.updatePlanStep(plan, toolCall, toolResult);
            }

            continue;
          }
        }

        const assistantMsg: AgentMessage = {
          id: randomUUID(),
          role: "assistant",
          content: response.content,
          timestamp: new Date().toISOString(),
        };
        messages.push(assistantMsg);

        if (this.config.memoryEnabled) {
          const memoryEntry = await this.storeMemory(
            `response_${iterationCount}`,
            response.content,
            context,
          );
          memoryUsed.push(memoryEntry);
        }

        if (
          response.content.includes("FINAL") ||
          response.content.includes('"done"') ||
          iterationCount >= this.config.maxIterations
        ) {
          finalOutput = response.content;
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
      plan,
      memoryUsed,
    };
  }

  private buildSystemPrompt(context: AgentContext): string {
    let prompt = this.config.systemPrompt;
    prompt += `\n\nRole: ${this.config.role}`;
    prompt += `\nAgent ID: ${this.config.id}`;
    prompt += `\nWorkflow: ${context.workflowId}`;
    prompt += `\nExecution: ${context.executionId}`;

    if (this.config.planningEnabled) {
      prompt += `\n\nYou have planning capabilities. Break down complex tasks into steps and execute them methodically.`;
    }

    if (this.config.memoryEnabled) {
      const relevantMemory = context.memory.slice(-10);
      if (relevantMemory.length > 0) {
        prompt += `\n\nRelevant memory from previous interactions:`;
        for (const entry of relevantMemory) {
          prompt += `\n- ${entry.key}: ${entry.content.substring(0, 200)}`;
        }
      }
    }

    return prompt;
  }

  private async createPlan(context: AgentContext): Promise<AgentPlan> {
    const goal = (context.variables.goal as string) ?? "Complete the given task";
    return {
      goal,
      steps: [
        { id: "1", description: "Analyze the task", status: "pending" },
        { id: "2", description: "Execute the task", status: "pending" },
        { id: "3", description: "Verify the result", status: "pending" },
      ],
      currentStep: "",
      completedSteps: [],
    };
  }

  private updatePlanStep(
    plan: AgentPlan,
    toolCall: AgentToolCall,
    result: AgentToolResult,
  ): void {
    const currentStep = plan.steps.find((s) => s.status === "in_progress");
    if (currentStep) {
      currentStep.status = result.error ? "failed" : "completed";
      currentStep.toolCall = toolCall;
      currentStep.result = result;
      plan.completedSteps.push(currentStep.id);

      const nextStep = plan.steps.find((s) => s.status === "pending");
      if (nextStep) {
        nextStep.status = "in_progress";
        plan.currentStep = nextStep.id;
      }
    }
  }

  private parseToolCall(content: string): {
    name: string;
    arguments: Record<string, unknown>;
  } | null {
    try {
      const match = content.match(/\{"tool_call"\s*:\s*(\{[^}]*\})\}/);
      if (match) {
        const parsed = JSON.parse(match[1]);
        return { name: parsed.name, arguments: parsed.arguments ?? {} };
      }
    } catch {
      // Failed to parse
    }
    return null;
  }

  private async executeToolCall(
    toolCall: AgentToolCall,
    context: AgentContext,
  ): Promise<AgentToolResult> {
    const tool = this.toolRegistry.get(toolCall.name);
    if (!tool) {
      return {
        toolCallId: toolCall.id,
        output: null,
        error: `Tool "${toolCall.name}" not found`,
      };
    }

    try {
      const output = await Promise.race([
        tool.handler(toolCall.arguments, context),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error("Tool call timeout")),
            this.config.toolCallTimeout,
          ),
        ),
      ]);
      return { toolCallId: toolCall.id, output };
    } catch (err) {
      return {
        toolCallId: toolCall.id,
        output: null,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  private async storeMemory(
    key: string,
    content: string,
    context: AgentContext,
  ): Promise<AgentMemoryEntry> {
    const entry: AgentMemoryEntry = {
      id: randomUUID(),
      key,
      content,
      memoryType: this.config.memoryType === "both" ? "short_term" : this.config.memoryType,
      metadata: {
        workflowId: context.workflowId,
        executionId: context.executionId,
        agentId: this.config.id,
      },
      createdAt: new Date().toISOString(),
      expiresAt:
        this.config.memoryType === "short_term"
          ? new Date(Date.now() + 3600000).toISOString()
          : undefined,
    };

    this.memoryStore.set(entry.id, entry);
    return entry;
  }

  getMemory(): AgentMemoryEntry[] {
    return Array.from(this.memoryStore.values());
  }

  clearMemory(): void {
    this.memoryStore.clear();
  }
}

export function createAgent(
  config: AgentConfig,
  provider: LLMProvider,
): AgentRuntime {
  return new AgentRuntime(config, provider);
}
