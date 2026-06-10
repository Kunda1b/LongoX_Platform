import type { NodeExecutor, WorkflowNode, ExecutionContext, NodeExecutionResult } from "@autoflow/workflow-engine";

export class HttpExecutor implements NodeExecutor {
  canHandle(nodeTypeId: string): boolean {
    return nodeTypeId === "action.http";
  }

  async execute(
    node: WorkflowNode,
    _context: ExecutionContext,
    input: Record<string, unknown>,
  ): Promise<NodeExecutionResult> {
    const startTime = Date.now();
    const config = (node.config ?? {}) as Record<string, unknown>;
    const url = String(config.url ?? "");
    if (!url) {
      return {
        nodeId: node.id,
        nodeName: node.name,
        nodeType: "action.http",
        status: "failed",
        output: {},
        error: "URL is required",
        durationMs: 0,
        attemptNumber: 1,
      };
    }

    try {
      const method = String(config.method ?? "GET").toUpperCase();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(config.headers as Record<string, string> ?? {}),
      };

      const hasBody = ["POST", "PUT", "PATCH"].includes(method);
      const body = hasBody ? JSON.stringify(config.body ?? input) : undefined;

      const response = await fetch(url, { method, headers, body });

      let responseBody: unknown;
      const contentType = response.headers.get("content-type") ?? "";
      try {
        responseBody = contentType.includes("application/json")
          ? await response.json()
          : await response.text();
      } catch {
        responseBody = null;
      }

      if (!response.ok) {
        return {
          nodeId: node.id,
          nodeName: node.name,
          nodeType: "action.http",
          status: "failed",
          output: { statusCode: response.status, body: responseBody },
          error: `HTTP ${response.status} ${response.statusText}`,
          durationMs: Date.now() - startTime,
          attemptNumber: 1,
        };
      }

      return {
        nodeId: node.id,
        nodeName: node.name,
        nodeType: "action.http",
        status: "success",
        output: {
          statusCode: response.status,
          headers: Object.fromEntries(response.headers.entries()),
          body: responseBody,
          responseTimeMs: Date.now() - startTime,
        },
        error: null,
        durationMs: Date.now() - startTime,
        attemptNumber: 1,
      };
    } catch (err) {
      return {
        nodeId: node.id,
        nodeName: node.name,
        nodeType: "action.http",
        status: "failed",
        output: {},
        error: err instanceof Error ? err.message : String(err),
        durationMs: Date.now() - startTime,
        attemptNumber: 1,
      };
    }
  }
}
