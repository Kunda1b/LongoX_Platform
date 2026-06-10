import type { NodeExecutor, WorkflowNode, ExecutionContext, NodeExecutionResult } from "@autoflow/workflow-engine";

export class TriggerExecutor implements NodeExecutor {
  canHandle(nodeTypeId: string): boolean {
    return nodeTypeId.startsWith("trigger.");
  }

  async execute(
    node: WorkflowNode,
    context: ExecutionContext,
    input: Record<string, unknown>,
  ): Promise<NodeExecutionResult> {
    const startTime = Date.now();
    const nodeTypeId = node.nodeTypeId ?? "trigger.manual";

    return {
      nodeId: node.id,
      nodeName: node.name,
      nodeType: nodeTypeId,
      status: "success",
      output: {
        triggeredAt: new Date().toISOString(),
        payload: input,
        source: nodeTypeId.replace("trigger.", ""),
        triggerType: context.triggerType,
      },
      error: null,
      durationMs: Date.now() - startTime,
      attemptNumber: 1,
    };
  }
}
