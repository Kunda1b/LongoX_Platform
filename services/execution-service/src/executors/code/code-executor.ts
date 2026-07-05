import type {
  NodeExecutor,
  WorkflowNode,
  ExecutionContext,
  NodeExecutionResult,
} from "@longox/workflow-engine";
import {
  DenoIsolate,
  UNTRUSTED_CONNECTOR_POLICY,
} from "@longox/connector-sandbox";

export class CodeExecutor implements NodeExecutor {
  canHandle(nodeTypeId: string): boolean {
    return nodeTypeId === "action.run_code" || nodeTypeId === "data.run_code";
  }

  async execute(
    node: WorkflowNode,
    context: ExecutionContext,
    input: Record<string, unknown>,
  ): Promise<NodeExecutionResult> {
    const startTime = Date.now();
    const config = (node.config ?? {}) as Record<string, unknown>;
    const code = String(config.code ?? "");

    if (!code) {
      return {
        nodeId: node.id,
        nodeName: node.name,
        nodeType: "action.run_code",
        status: "failed",
        output: {},
        error: "No code provided",
        durationMs: Date.now() - startTime,
        attemptNumber: 1,
      };
    }

    const wrappedCode = `
try {
  const __result = (function(input) {
    ${code}
  })(input);
  console.log(JSON.stringify({ result: __result }));
} catch (__err) {
  console.log(JSON.stringify({ error: __err.message }));
}
`;

    try {
      const isolate = new DenoIsolate(UNTRUSTED_CONNECTOR_POLICY);
      const result = await isolate.execute({
        connectorName: "code-executor",
        actionId: node.id,
        executionId: (context as any).executionId ?? "unknown",
        tenantId: (context as any).tenantId ?? 0,
        auth: {},
        input,
        config: {},
        secrets: {},
        code: wrappedCode,
      });

      if (result.success) {
        const output = result.data as Record<string, unknown>;
        if (output.error) {
          return {
            nodeId: node.id,
            nodeName: node.name,
            nodeType: "action.run_code",
            status: "failed",
            output: {},
            error: String(output.error),
            durationMs: result.durationMs,
            attemptNumber: 1,
          };
        }
        return {
          nodeId: node.id,
          nodeName: node.name,
          nodeType: "action.run_code",
          status: "success",
          output: { result: output.result },
          error: null,
          durationMs: result.durationMs,
          attemptNumber: 1,
        };
      }

      return {
        nodeId: node.id,
        nodeName: node.name,
        nodeType: "action.run_code",
        status: "failed",
        output: {},
        error: result.error ?? "Sandbox execution failed",
        durationMs: result.durationMs,
        attemptNumber: 1,
      };
    } catch (err) {
      return {
        nodeId: node.id,
        nodeName: node.name,
        nodeType: "action.run_code",
        status: "failed",
        output: {},
        error: err instanceof Error ? err.message : String(err),
        durationMs: Date.now() - startTime,
        attemptNumber: 1,
      };
    }
  }
}
