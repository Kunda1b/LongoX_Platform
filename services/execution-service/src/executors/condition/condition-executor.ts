import type { NodeExecutor, WorkflowNode, ExecutionContext, NodeExecutionResult } from "@autoflow/workflow-engine";

export class ConditionExecutor implements NodeExecutor {
  canHandle(nodeTypeId: string): boolean {
    return ["logic.if", "logic.router", "logic.filter"].includes(nodeTypeId);
  }

  async execute(
    node: WorkflowNode,
    _context: ExecutionContext,
    input: Record<string, unknown>,
  ): Promise<NodeExecutionResult> {
    const startTime = Date.now();
    const config = (node.config ?? {}) as Record<string, unknown>;
    const nodeTypeId = node.nodeTypeId ?? node.type ?? "logic.if";

    if (nodeTypeId === "logic.if") {
      const field = String(config.field ?? "");
      const operator = String(config.operator ?? "eq");
      const value = String(config.value ?? "");
      const actualValue = field ? String(input[field] ?? "") : "";

      let matched = false;
      switch (operator) {
        case "eq": matched = actualValue === value; break;
        case "neq": matched = actualValue !== value; break;
        case "contains": matched = actualValue.includes(value); break;
        case "gt": matched = Number(actualValue) > Number(value); break;
        case "gte": matched = Number(actualValue) >= Number(value); break;
        case "lt": matched = Number(actualValue) < Number(value); break;
        case "lte": matched = Number(actualValue) <= Number(value); break;
        case "is_empty": matched = actualValue === "" || actualValue === undefined; break;
        default: matched = actualValue === value;
      }

      return {
        nodeId: node.id,
        nodeName: node.name,
        nodeType: "logic.if",
        status: "success",
        output: { branch: matched ? "true" : "false", evaluated: true, condition: operator, field, expected: value, actual: actualValue },
        error: null,
        durationMs: Date.now() - startTime,
        attemptNumber: 1,
      };
    }

    if (nodeTypeId === "logic.router") {
      const rules = (config.rules ?? []) as Array<{ field: string; operator: string; value: string; output: string }>;
      let matchedBranch = "default";

      for (const rule of rules) {
        const actualValue = String(input[rule.field] ?? "");
        switch (rule.operator) {
          case "eq":
            if (actualValue === rule.value) matchedBranch = rule.output;
            break;
          case "contains":
            if (actualValue.includes(rule.value)) matchedBranch = rule.output;
            break;
        }
        if (matchedBranch !== "default") break;
      }

      return {
        nodeId: node.id,
        nodeName: node.name,
        nodeType: "logic.router",
        status: "success",
        output: { branch: matchedBranch, evaluated: true },
        error: null,
        durationMs: Date.now() - startTime,
        attemptNumber: 1,
      };
    }

    if (nodeTypeId === "logic.filter") {
      const items = (input.items ?? []) as unknown[];
      const field = String(config.field ?? "");
      const operator = String(config.operator ?? "eq");
      const value = String(config.value ?? "");

      const filtered = items.filter((item: unknown) => {
        const itemValue = String((item as Record<string, unknown>)[field] ?? "");
        switch (operator) {
          case "eq": return itemValue === value;
          case "neq": return itemValue !== value;
          case "contains": return itemValue.includes(value);
          default: return true;
        }
      });

      return {
        nodeId: node.id,
        nodeName: node.name,
        nodeType: "logic.filter",
        status: "success",
        output: { filtered: filtered.length, total: items.length, items: filtered },
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
      error: `Unknown condition type: ${nodeTypeId}`,
      durationMs: Date.now() - startTime,
      attemptNumber: 1,
    };
  }
}
