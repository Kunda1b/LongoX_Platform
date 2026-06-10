import type { NodeExecutor, WorkflowNode, ExecutionContext, NodeExecutionResult } from "@autoflow/workflow-engine";

export class SlackExecutor implements NodeExecutor {
  canHandle(nodeTypeId: string): boolean {
    return nodeTypeId === "action.slack";
  }

  async execute(
    node: WorkflowNode,
    _context: ExecutionContext,
    _input: Record<string, unknown>,
  ): Promise<NodeExecutionResult> {
    const startTime = Date.now();
    const config = (node.config ?? {}) as Record<string, unknown>;

    try {
      const token = process.env.SLACK_BOT_TOKEN;
      if (!token) {
        return {
          nodeId: node.id,
          nodeName: node.name,
          nodeType: "action.slack",
          status: "failed",
          output: {},
          error: "SLACK_BOT_TOKEN not configured",
          durationMs: Date.now() - startTime,
          attemptNumber: 1,
        };
      }

      const channel = String(config.channel ?? "#general");
      const text = String(config.text ?? "Hello from Flow Builder Nexus!");

      const response = await fetch("https://slack.com/api/chat.postMessage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ channel, text }),
      });

      const data = await response.json() as { ok: boolean; ts?: string; error?: string };

      if (!data.ok) {
        return {
          nodeId: node.id,
          nodeName: node.name,
          nodeType: "action.slack",
          status: "failed",
          output: {},
          error: `Slack API error: ${data.error ?? "unknown"}`,
          durationMs: Date.now() - startTime,
          attemptNumber: 1,
        };
      }

      return {
        nodeId: node.id,
        nodeName: node.name,
        nodeType: "action.slack",
        status: "success",
        output: { ts: data.ts, channel, ok: true },
        error: null,
        durationMs: Date.now() - startTime,
        attemptNumber: 1,
      };
    } catch (err) {
      return {
        nodeId: node.id,
        nodeName: node.name,
        nodeType: "action.slack",
        status: "failed",
        output: {},
        error: err instanceof Error ? err.message : String(err),
        durationMs: Date.now() - startTime,
        attemptNumber: 1,
      };
    }
  }
}
