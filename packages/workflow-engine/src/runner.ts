import type { WorkflowNode, ExecutionContext, NodeExecutionResult, NodeExecutor } from "./types";
import type { WorkflowGraph } from "./types";
import { topologicalSort } from "./graph";

export interface RunnerOptions {
  maxRetries?: number;
  retryDelayMs?: number;
  checkpointCallback?: (result: NodeExecutionResult) => Promise<void>;
}

export class WorkflowRunner {
  private executors: NodeExecutor[] = [];

  registerExecutor(executor: NodeExecutor): void {
    this.executors.push(executor);
  }

  private findExecutor(nodeTypeId: string): NodeExecutor | null {
    for (const executor of this.executors) {
      if (executor.canHandle(nodeTypeId)) return executor;
    }
    return null;
  }

  async run(
    graph: WorkflowGraph,
    context: ExecutionContext,
    options: RunnerOptions = {},
  ): Promise<NodeExecutionResult[]> {
    const { maxRetries = 2, retryDelayMs = 500, checkpointCallback } = options;
    const sorted = topologicalSort(graph);
    const results: NodeExecutionResult[] = [];
    let currentInput: Record<string, unknown> = {
      ...context.triggerPayload,
      _triggerType: context.triggerType,
    };

    for (const node of sorted) {
      const nodeTypeId = node.nodeTypeId ?? node.type ?? "unknown";
      const executor = this.findExecutor(nodeTypeId);

      if (!executor) {
        const errorResult: NodeExecutionResult = {
          nodeId: node.id,
          nodeName: node.name,
          nodeType: nodeTypeId,
          status: "failed",
          output: {},
          error: `No executor found for node type "${nodeTypeId}"`,
          durationMs: 0,
          attemptNumber: 1,
        };
        results.push(errorResult);
        if (checkpointCallback) await checkpointCallback(errorResult);
        break;
      }

      let lastError: string | null = null;
      let result: NodeExecutionResult | null = null;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          result = await executor.execute(node, context, currentInput);
          if (result.status === "success") {
            currentInput = { ...result.output, _prevNode: node.id };
            if (checkpointCallback) await checkpointCallback(result);
            break;
          }
        } catch (err) {
          lastError = err instanceof Error ? err.message : String(err);
        }

        if (attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, retryDelayMs * attempt));
        }
      }

      if (!result || result.status === "failed") {
        const errorResult: NodeExecutionResult = {
          nodeId: node.id,
          nodeName: node.name,
          nodeType: nodeTypeId,
          status: "failed",
          output: {},
          error: lastError ?? result?.error ?? "Unknown error",
          durationMs: result?.durationMs ?? 0,
          attemptNumber: maxRetries,
        };
        results.push(errorResult);
        if (checkpointCallback) await checkpointCallback(errorResult);
        break;
      }

      results.push(result);
    }

    return results;
  }
}
