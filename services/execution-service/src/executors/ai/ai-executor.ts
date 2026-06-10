import type {
  NodeExecutor,
  WorkflowNode,
  ExecutionContext,
  NodeExecutionResult,
} from "@longox/workflow-engine";
import OpenAI from "openai";

export class AiExecutor implements NodeExecutor {
  private openai: OpenAI | null = null;

  canHandle(nodeTypeId: string): boolean {
    return nodeTypeId.startsWith("ai.");
  }

  private getClient(): OpenAI {
    if (!this.openai) {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    return this.openai;
  }

  async execute(
    node: WorkflowNode,
    _context: ExecutionContext,
    input: Record<string, unknown>,
  ): Promise<NodeExecutionResult> {
    const startTime = Date.now();
    const config = (node.config ?? {}) as Record<string, unknown>;
    const nodeTypeId = node.nodeTypeId ?? "ai.prompt";

    if (!process.env.OPENAI_API_KEY) {
      return {
        nodeId: node.id,
        nodeName: node.name,
        nodeType: nodeTypeId,
        status: "failed",
        output: {},
        error: "OPENAI_API_KEY not configured",
        durationMs: Date.now() - startTime,
        attemptNumber: 1,
      };
    }

    try {
      const model = String(config.model ?? "gpt-4o-mini");
      const maxTokens = Number(config.maxTokens ?? 1024);
      const openai = this.getClient();

      let messages: OpenAI.ChatCompletionMessageParam[];
      let responseFormat: "text" | "json" = "text";

      if (nodeTypeId === "ai.classify") {
        const categories = String(config.categories ?? "CategoryA,CategoryB");
        messages = [
          {
            role: "system",
            content: `Classify the input into one of these categories: ${categories}. Respond with JSON: {"category": "...", "confidence": 0.0-1.0, "reasoning": "..."}`,
          },
          { role: "user", content: JSON.stringify(input) },
        ];
        responseFormat = "json";
      } else if (nodeTypeId === "ai.summarize") {
        const maxWords = Number(config.maxWords ?? 100);
        messages = [
          {
            role: "system",
            content: `Summarize the input in at most ${maxWords} words. Respond with JSON: {"summary": "...", "wordCount": 0}`,
          },
          { role: "user", content: JSON.stringify(input) },
        ];
        responseFormat = "json";
      } else if (nodeTypeId === "ai.extract") {
        const fields = String(config.fields ?? "vendor,amount,date");
        messages = [
          {
            role: "system",
            content: `Extract these fields from the input: ${fields}. Respond with JSON: {"extracted": {...}, "confidence": 0.0-1.0}`,
          },
          { role: "user", content: JSON.stringify(input) },
        ];
        responseFormat = "json";
      } else {
        const systemPrompt = String(
          config.systemPrompt ??
            config.prompt ??
            "Process the following input and return a JSON result.",
        );
        messages = [
          { role: "system", content: systemPrompt },
          { role: "user", content: JSON.stringify(input) },
        ];
        responseFormat = "json";
      }

      const completion = await openai.chat.completions.create({
        model,
        messages,
        response_format:
          responseFormat === "json" ? { type: "json_object" } : undefined,
        max_tokens: maxTokens,
      });

      const inputTokens = completion.usage?.prompt_tokens ?? 0;
      const outputTokens = completion.usage?.completion_tokens ?? 0;
      const content = completion.choices[0]?.message?.content ?? "{}";

      let parsed: Record<string, unknown> = {};
      try {
        parsed = JSON.parse(content);
      } catch {
        parsed = { result: content };
      }

      return {
        nodeId: node.id,
        nodeName: node.name,
        nodeType: nodeTypeId,
        status: "success",
        output: { ...parsed, modelUsed: model, inputTokens, outputTokens },
        error: null,
        durationMs: Date.now() - startTime,
        attemptNumber: 1,
      };
    } catch (err) {
      return {
        nodeId: node.id,
        nodeName: node.name,
        nodeType: nodeTypeId,
        status: "failed",
        output: {},
        error: err instanceof Error ? err.message : String(err),
        durationMs: Date.now() - startTime,
        attemptNumber: 1,
      };
    }
  }
}
