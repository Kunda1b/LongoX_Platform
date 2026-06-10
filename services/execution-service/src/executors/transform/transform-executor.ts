import type {
  NodeExecutor,
  WorkflowNode,
  ExecutionContext,
  NodeExecutionResult,
} from "@longox/workflow-engine";

export class TransformExecutor implements NodeExecutor {
  canHandle(nodeTypeId: string): boolean {
    return ["data.transform", "data.parse_doc"].includes(nodeTypeId);
  }

  async execute(
    node: WorkflowNode,
    _context: ExecutionContext,
    input: Record<string, unknown>,
  ): Promise<NodeExecutionResult> {
    const startTime = Date.now();
    const config = (node.config ?? {}) as Record<string, unknown>;
    const nodeTypeId = node.nodeTypeId ?? node.type ?? "data.transform";

    if (nodeTypeId === "data.transform") {
      const mapping = (config.mapping ?? {}) as Record<string, string>;
      const transformed: Record<string, unknown> = {};

      for (const [targetField, sourcePath] of Object.entries(mapping)) {
        const value = resolvePath(input, sourcePath);
        if (value !== undefined) {
          transformed[targetField] = value;
        }
      }

      return {
        nodeId: node.id,
        nodeName: node.name,
        nodeType: "data.transform",
        status: "success",
        output: {
          transformed: true,
          inputFields: Object.keys(input).length,
          outputFields: Object.keys(transformed).length,
          data: transformed,
        },
        error: null,
        durationMs: Date.now() - startTime,
        attemptNumber: 1,
      };
    }

    if (nodeTypeId === "data.parse_doc") {
      const content = String(input.content ?? input.text ?? "");
      return {
        nodeId: node.id,
        nodeName: node.name,
        nodeType: "data.parse_doc",
        status: "success",
        output: {
          text: content,
          pages: 1,
          wordCount: content.split(/\s+/).filter(Boolean).length,
        },
        error: null,
        durationMs: Date.now() - startTime,
        attemptNumber: 1,
      };
    }

    return {
      nodeId: node.id,
      nodeName: node.name,
      nodeType: nodeTypeId,
      status: "failed",
      output: {},
      error: `Unknown transform type: ${nodeTypeId}`,
      durationMs: Date.now() - startTime,
      attemptNumber: 1,
    };
  }
}

function resolvePath(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}
