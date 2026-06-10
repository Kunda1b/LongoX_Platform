import type { NodeExecutor, WorkflowNode, ExecutionContext, NodeExecutionResult } from "@autoflow/workflow-engine";
import { db } from "@autoflow/db";
import { sql } from "drizzle-orm";

export class DbQueryExecutor implements NodeExecutor {
  canHandle(nodeTypeId: string): boolean {
    return nodeTypeId === "action.db_query";
  }

  async execute(
    node: WorkflowNode,
    _context: ExecutionContext,
    _input: Record<string, unknown>,
  ): Promise<NodeExecutionResult> {
    const startTime = Date.now();
    const config = (node.config ?? {}) as Record<string, unknown>;
    const query = String(config.query ?? "");

    if (!query) {
      return {
        nodeId: node.id,
        nodeName: node.name,
        nodeType: "action.db_query",
        status: "failed",
        output: {},
        error: "SQL query is required",
        durationMs: Date.now() - startTime,
        attemptNumber: 1,
      };
    }

    try {
      const result = await db.execute(sql.raw(query));
      const rows = Array.isArray(result) ? result : [];

      return {
        nodeId: node.id,
        nodeName: node.name,
        nodeType: "action.db_query",
        status: "success",
        output: { rows, rowCount: rows.length },
        error: null,
        durationMs: Date.now() - startTime,
        attemptNumber: 1,
      };
    } catch (err) {
      return {
        nodeId: node.id,
        nodeName: node.name,
        nodeType: "action.db_query",
        status: "failed",
        output: {},
        error: err instanceof Error ? err.message : String(err),
        durationMs: Date.now() - startTime,
        attemptNumber: 1,
      };
    }
  }
}
