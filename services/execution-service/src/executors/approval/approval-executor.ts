import type { NodeExecutor, WorkflowNode, ExecutionContext, NodeExecutionResult } from "@autoflow/workflow-engine";

export class ApprovalExecutor implements NodeExecutor {
  canHandle(nodeTypeId: string): boolean {
    return nodeTypeId === "human.approval";
  }

  async execute(
    node: WorkflowNode,
    _context: ExecutionContext,
    input: Record<string, unknown>,
  ): Promise<NodeExecutionResult> {
    const startTime = Date.now();
    const config = (node.config ?? {}) as Record<string, unknown>;
    const approvers = (config.approvers ?? []) as string[];

    if (approvers.length === 0) {
      return {
        nodeId: node.id,
        nodeName: node.name,
        nodeType: "human.approval",
        status: "success",
        output: { approved: true, approvedBy: "system", comment: "No approvers configured, auto-approved", autoApproved: true },
        error: null,
        durationMs: Date.now() - startTime,
        attemptNumber: 1,
      };
    }

    return {
      nodeId: node.id,
      nodeName: node.name,
      nodeType: "human.approval",
      status: "success",
      output: { approved: false, approvedBy: null, comment: null, pending: true, approvers, inputData: input },
      error: null,
      durationMs: Date.now() - startTime,
      attemptNumber: 1,
    };
  }
}
