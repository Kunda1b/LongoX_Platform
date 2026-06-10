import type {
  NodeExecutor,
  WorkflowNode,
  ExecutionContext,
  NodeExecutionResult,
} from "@longox/workflow-engine";
import * as vm from "node:vm";

export class CodeExecutor implements NodeExecutor {
  canHandle(nodeTypeId: string): boolean {
    return nodeTypeId === "action.run_code" || nodeTypeId === "data.run_code";
  }

  async execute(
    node: WorkflowNode,
    _context: ExecutionContext,
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

    try {
      const sandbox = {
        input,
        output: {},
        console: { log: (...args: unknown[]) => args },
      };
      const context = vm.createContext(sandbox);
      const wrappedCode = `
        try {
          const result = (function(input) {
            ${code}
          })(input);
          output.result = result;
        } catch (err) {
          output.error = err.message;
        }
      `;
      vm.runInContext(wrappedCode, context, { timeout: 5000 });

      const result = sandbox.output as { result?: unknown; error?: string };

      if (result.error) {
        return {
          nodeId: node.id,
          nodeName: node.name,
          nodeType: "action.run_code",
          status: "failed",
          output: {},
          error: result.error,
          durationMs: Date.now() - startTime,
          attemptNumber: 1,
        };
      }

      return {
        nodeId: node.id,
        nodeName: node.name,
        nodeType: "action.run_code",
        status: "success",
        output: { result: result.result },
        error: null,
        durationMs: Date.now() - startTime,
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
