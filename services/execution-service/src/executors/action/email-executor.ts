import type { NodeExecutor, WorkflowNode, ExecutionContext, NodeExecutionResult } from "@autoflow/workflow-engine";

export class EmailExecutor implements NodeExecutor {
  canHandle(nodeTypeId: string): boolean {
    return nodeTypeId === "action.send_email";
  }

  async execute(
    node: WorkflowNode,
    _context: ExecutionContext,
    _input: Record<string, unknown>,
  ): Promise<NodeExecutionResult> {
    const startTime = Date.now();
    const config = (node.config ?? {}) as Record<string, unknown>;

    try {
      const to = String(config.to ?? "");
      const subject = String(config.subject ?? "Notification");
      const body = String(config.body ?? "");

      if (!to) {
        return {
          nodeId: node.id,
          nodeName: node.name,
          nodeType: "action.send_email",
          status: "failed",
          output: {},
          error: "Recipient email (to) is required",
          durationMs: Date.now() - startTime,
          attemptNumber: 1,
        };
      }

      const apiKey = process.env.RESEND_API_KEY ?? process.env.SENDGRID_API_KEY;
      if (!apiKey) {
        return {
          nodeId: node.id,
          nodeName: node.name,
          nodeType: "action.send_email",
          status: "failed",
          output: {},
          error: "Email API key not configured (RESEND_API_KEY or SENDGRID_API_KEY)",
          durationMs: Date.now() - startTime,
          attemptNumber: 1,
        };
      }

      const from = String(config.from ?? "noreply@flowbuilder.io");

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from,
          to: [to],
          subject,
          text: body,
        }),
      });

      const data = await response.json() as { id?: string; error?: string };

      if (!response.ok) {
        return {
          nodeId: node.id,
          nodeName: node.name,
          nodeType: "action.send_email",
          status: "failed",
          output: {},
          error: data.error ?? `Email API error: ${response.status}`,
          durationMs: Date.now() - startTime,
          attemptNumber: 1,
        };
      }

      return {
        nodeId: node.id,
        nodeName: node.name,
        nodeType: "action.send_email",
        status: "success",
        output: { messageId: data.id, to, subject, accepted: true },
        error: null,
        durationMs: Date.now() - startTime,
        attemptNumber: 1,
      };
    } catch (err) {
      return {
        nodeId: node.id,
        nodeName: node.name,
        nodeType: "action.send_email",
        status: "failed",
        output: {},
        error: err instanceof Error ? err.message : String(err),
        durationMs: Date.now() - startTime,
        attemptNumber: 1,
      };
    }
  }
}
