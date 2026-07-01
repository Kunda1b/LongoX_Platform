/**
 * Saga compensation coordinator.
 *
 * The DAGRunner pushes each successfully executed node onto a saga stack.
 * On failure, the coordinator walks the stack in reverse (LIFO) and calls
 * the registered compensate() handler for each step.
 *
 * This module exports helper utilities used by the DAGRunner and also
 * a standalone SagaCoordinator for unit-testing compensation logic.
 */

import type { SagaEntry, ExecutionContext, NodeExecutor, WorkflowNode } from "./types";

// ─── SagaCoordinator ──────────────────────────────────────────────────────────

export class SagaCoordinator {
  private stack: SagaEntry[] = [];
  private readonly executors: NodeExecutor[];

  constructor(executors: NodeExecutor[]) {
    this.executors = executors;
  }

  /** Push a completed step. Call after each successful node execution. */
  push(entry: SagaEntry): void {
    this.stack.push(entry);
  }

  /** Discard all stored saga entries (call on successful completion). */
  clear(): void {
    this.stack = [];
  }

  /**
   * Run compensation in reverse order for all recorded steps.
   * Returns a summary of which steps succeeded and which failed to compensate.
   */
  async compensate(
    context: ExecutionContext,
    onCompensated?: (nodeId: string) => void,
    onFailed?: (nodeId: string, error: string) => void,
  ): Promise<{
    compensated: string[];
    failed: Array<{ nodeId: string; error: string }>;
  }> {
    const compensated: string[] = [];
    const failed: Array<{ nodeId: string; error: string }> = [];

    for (let i = this.stack.length - 1; i >= 0; i--) {
      const entry = this.stack[i];
      const compensateTypeId =
        entry.compensationConfig?.nodeTypeId ?? `${entry.nodeType}.compensate`;

      const executor = this.executors.find((e) =>
        e.canHandle(compensateTypeId),
      );

      try {
        if (executor?.compensate) {
          const node: WorkflowNode = {
            id: `${entry.nodeId}__compensate`,
            name: `${entry.nodeName} (compensate)`,
            nodeTypeId: compensateTypeId,
            config: entry.compensationConfig?.config,
          };
          await executor.compensate(node, context, entry.output);
        } else if (executor) {
          const node: WorkflowNode = {
            id: `${entry.nodeId}__compensate`,
            name: `${entry.nodeName} (compensate)`,
            nodeTypeId: compensateTypeId,
            config: {
              ...entry.compensationConfig?.config,
              _compensating: true,
              _originalOutput: entry.output,
            },
          };
          await executor.execute(node, context, entry.output);
        }
        compensated.push(entry.nodeId);
        onCompensated?.(entry.nodeId);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        failed.push({ nodeId: entry.nodeId, error: msg });
        onFailed?.(entry.nodeId, msg);
      }
    }

    this.stack = [];
    return { compensated, failed };
  }

  get size(): number {
    return this.stack.length;
  }

  get entries(): ReadonlyArray<SagaEntry> {
    return [...this.stack];
  }
}
