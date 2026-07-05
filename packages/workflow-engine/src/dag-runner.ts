/**
 * Architecture-compliant DAG execution engine.
 *
 * Features:
 *   ✓ True topological fan-out (parallel execution of independent nodes)
 *   ✓ Bounded loops (max_iterations + break condition)
 *   ✓ Per-node idempotency (skip already-completed nodes on resume)
 *   ✓ Checkpoint/resume (reload completed checkpoints from DB)
 *   ✓ Per-node leases (prevent duplicate execution across workers)
 *   ✓ Configurable retry policy with exponential backoff + jitter
 *   ✓ Saga compensation (rollback completed nodes on failure, LIFO order)
 *   ✓ Child workflow spawning
 *   ✓ Human approval gate (pause at node, resume on external signal)
 *   ✓ Global execution timeout (AbortController)
 *   ✓ SSE-compatible event emission via onEvent callback
 */

import { topologicalSort, getDownstreamNodes } from "./graph";
import type {
  WorkflowNode,
  WorkflowGraph,
  ExecutionContext,
  NodeExecutionResult,
  NodeExecutor,
  DAGRunnerOptions,
  DAGEvent,
  RetryPolicy,
  SagaEntry,
} from "./types";
import {
  DEFAULT_RETRY_POLICY,
  TRIGGER_RETRY_POLICY,
  computeBackoffDelay,
  MAX_LOOP_ITERATIONS_DEFAULT,
  type LeaseStore,
} from "./types";
import { NoOpLeaseStore } from "./node-lease";

// ─── DAGRunner ────────────────────────────────────────────────────────────────

export class DAGRunner {
  private executors: NodeExecutor[] = [];

  registerExecutor(executor: NodeExecutor): void {
    this.executors.push(executor);
  }

  private findExecutor(nodeTypeId: string): NodeExecutor | null {
    return this.executors.find((e) => e.canHandle(nodeTypeId)) ?? null;
  }

  // ─── Main entry ────────────────────────────────────────────────────────────

  async run(
    graph: WorkflowGraph,
    context: ExecutionContext,
    options: DAGRunnerOptions = {},
  ): Promise<NodeExecutionResult[]> {
    const {
      defaultRetryPolicy = DEFAULT_RETRY_POLICY,
      maxParallelNodes = 0,
      timeoutMs = graph.timeoutMs,
      onEvent,
      checkpointStore,
      idempotencyStore,
      enableSaga = true,
      leaseStore = new NoOpLeaseStore(),
    } = options;

    const emit = (event: DAGEvent) => onEvent?.(event);

    // Shared mutable output state across the DAG (fan-out merges here)
    if (!context.sharedState) {
      context.sharedState = new Map<string, Record<string, unknown>>();
    }

    // ── Resume: load completed checkpoints ───────────────────────────────────
    const completedNodes = new Map<string, Record<string, unknown>>();
    if (checkpointStore) {
      const saved = await checkpointStore.loadCompleted(context.executionId);
      for (const cp of saved) {
        completedNodes.set(cp.nodeId, cp.outputData);
        context.sharedState.set(cp.nodeId, cp.outputData);
      }
    }

    // ── Topological levels (for parallel fan-out) ────────────────────────────
    const allSorted = topologicalSort(graph);
    if (allSorted.length === 0 && graph.nodes.length > 0) {
      throw new Error(
        "Workflow graph contains a cycle — topological sort failed",
      );
    }

    // Track in-degree for parallel fan-out scheduling
    const inDegreeMap = buildInDegreeMap(graph);
    const adjacencyMap = buildAdjacencyMap(graph);
    const results: NodeExecutionResult[] = [];
    const sagaStack: SagaEntry[] = [];
    let failed = false;
    let failureError = "";

    // ── Timeout controller ───────────────────────────────────────────────────
    const abortController = new AbortController();
    let timeoutHandle: NodeJS.Timeout | undefined;
    if (timeoutMs && timeoutMs > 0) {
      timeoutHandle = setTimeout(() => {
        abortController.abort();
      }, timeoutMs);
    }

    emit({
      type: "execution.started",
      executionId: context.executionId,
      workflowId: context.workflowId,
    });

    try {
      // ── Parallel fan-out execution ─────────────────────────────────────────
      // We maintain a "ready queue" of nodes whose in-degree has dropped to 0.
      // As nodes complete, we decrement downstream in-degrees and enqueue newly
      // ready nodes. All nodes at any "wave" execute concurrently.

      const readyQueue: WorkflowNode[] = [];
      const inFlight = new Set<string>();
      const localInDegree = new Map(inDegreeMap);

      // Seed with entry nodes (in-degree === 0)
      for (const [nodeId, degree] of localInDegree) {
        if (degree === 0) {
          const node = graph.nodes.find((n) => n.id === nodeId);
          if (node) readyQueue.push(node);
        }
      }

      // Active promises for parallelism tracking
      const active: Map<string, Promise<void>> = new Map();

      const processNode = async (node: WorkflowNode): Promise<void> => {
        if (abortController.signal.aborted) return;
        if (failed) return;

        inFlight.add(node.id);

        // ── Acquire node lease ──────────────────────────────────────────────
        const lease = await leaseStore.acquire(
          context.executionId,
          node.id,
          300_000,
        );
        if (!lease) {
          // Another worker holds the lease — skip (will be picked up on expiry)
          inFlight.delete(node.id);
          return;
        }

        // ── Skip already-completed (checkpoint resume) ──────────────────────
        if (completedNodes.has(node.id)) {
          const savedOutput = completedNodes.get(node.id)!;
          results.push({
            nodeId: node.id,
            nodeName: node.name,
            nodeType: node.nodeTypeId ?? node.type ?? "unknown",
            status: "skipped",
            output: savedOutput,
            error: null,
            durationMs: 0,
            attemptNumber: 0,
          });
          unlockDownstream(
            node.id,
            localInDegree,
            adjacencyMap,
            readyQueue,
            graph,
            failed,
          );
          await lease.release();
          inFlight.delete(node.id);
          return;
        }

        // ── Idempotency check (architecture §9.1) ─────────────────────────
        // The idempotency key is `${workflowId}|${executionId}|${nodeId}|${attempt}`.
        // For the resume-skip path we probe attempt=1 — the underlying store
        // is free to interpret the attempt component per its dedup strategy
        // (DbIdempotencyStore treats any completed checkpoint for the
        // (workflow, run, node) tuple as a hit so resume works regardless
        // of which attempt originally succeeded).
        if (idempotencyStore) {
          const alreadyDone = await idempotencyStore.isComplete({
            workflowId: context.workflowId,
            executionId: context.executionId,
            nodeId: node.id,
            attempt: 1,
          });
          if (alreadyDone) {
            const savedOutput =
              (await idempotencyStore.getOutput({
                workflowId: context.workflowId,
                executionId: context.executionId,
                nodeId: node.id,
                attempt: 1,
              })) ?? {};
            context.sharedState!.set(node.id, savedOutput);
            results.push({
              nodeId: node.id,
              nodeName: node.name,
              nodeType: node.nodeTypeId ?? node.type ?? "unknown",
              status: "skipped",
              output: savedOutput,
              error: null,
              durationMs: 0,
              attemptNumber: 0,
            });
            unlockDownstream(
              node.id,
              localInDegree,
              adjacencyMap,
              readyQueue,
              graph,
              failed,
            );
            await lease.release();
            inFlight.delete(node.id);
            return;
          }
        }

        const result = await this.executeNodeWithPolicy(
          node,
          context,
          options,
          defaultRetryPolicy,
          emit,
        );

        results.push(result);

        if (result.status === "paused") {
          // Human approval gate — pause the whole run; resume externally.
          // We don't unlock downstream — the run stops here for this branch.
          await lease.release();
          inFlight.delete(node.id);
          return;
        }

        if (result.status === "failed") {
          failed = true;
          failureError = result.error ?? "Node execution failed";
          emit({
            type: "dlq.entry",
            executionId: context.executionId,
            nodeId: node.id,
            error: failureError,
          });
          await lease.release();
          inFlight.delete(node.id);
          return;
        }

        // ── Record success ──────────────────────────────────────────────────
        context.sharedState!.set(node.id, result.output);

        if (idempotencyStore) {
          await idempotencyStore.markComplete(
            {
              workflowId: context.workflowId,
              executionId: context.executionId,
              nodeId: node.id,
              attempt: result.attemptNumber,
            },
            result.output,
          );
        }

        // ── Saga stack (push on success for potential rollback) ─────────────
        if (enableSaga) {
          sagaStack.push({
            nodeId: node.id,
            nodeName: node.name,
            nodeType: node.nodeTypeId ?? node.type ?? "unknown",
            output: result.output,
            compensationConfig: node.compensation,
          });
        }

        // ── Unlock downstream nodes ─────────────────────────────────────────
        unlockDownstream(
          node.id,
          localInDegree,
          adjacencyMap,
          readyQueue,
          graph,
          failed,
        );
        await lease.release();
        inFlight.delete(node.id);
      };

      // ── Scheduling loop ────────────────────────────────────────────────────
      while ((readyQueue.length > 0 || active.size > 0) && !failed) {
        if (abortController.signal.aborted) {
          failed = true;
          failureError = "Execution timed out";
          break;
        }

        // Drain ready queue respecting maxParallelNodes
        while (readyQueue.length > 0) {
          const canStart =
            maxParallelNodes === 0 || active.size < maxParallelNodes;
          if (!canStart) break;

          const node = readyQueue.shift()!;
          if (inFlight.has(node.id) || completedNodes.has(node.id)) continue;

          const p = processNode(node).then(() => {
            active.delete(node.id);
          });
          active.set(node.id, p);
        }

        if (active.size === 0) break;

        // Wait for any active node to complete before re-evaluating the queue
        await Promise.race([...active.values()]);
      }

      // Drain remaining active nodes
      if (active.size > 0) {
        await Promise.allSettled([...active.values()]);
      }
    } finally {
      if (timeoutHandle) clearTimeout(timeoutHandle);
    }

    // ── Saga compensation on failure ─────────────────────────────────────────
    if (failed && enableSaga && sagaStack.length > 0) {
      emit({
        type: "execution.saga_compensating",
        executionId: context.executionId,
        steps: sagaStack.length,
      });
      await this.runSagaCompensation(sagaStack, context, emit);
    }

    if (failed) {
      emit({
        type: "execution.failed",
        executionId: context.executionId,
        error: failureError,
      });
    } else {
      const durationMs = Date.now() - context.startedAt.getTime();
      emit({
        type: "execution.completed",
        executionId: context.executionId,
        durationMs,
      });
    }

    return results;
  }

  // ─── Single node execution with retry + special types ──────────────────────

  private async executeNodeWithPolicy(
    node: WorkflowNode,
    context: ExecutionContext,
    options: DAGRunnerOptions,
    defaultRetryPolicy: RetryPolicy,
    emit: (e: DAGEvent) => void,
  ): Promise<NodeExecutionResult> {
    const nodeTypeId = node.nodeTypeId ?? node.type ?? "unknown";
    const isTrigger = nodeTypeId.startsWith("trigger.");
    const retryPolicy =
      node.retryPolicy ??
      (isTrigger ? TRIGGER_RETRY_POLICY : defaultRetryPolicy);

    // ── Human approval gate ─────────────────────────────────────────────────
    if (node.approvalGate && options.writeApprovalGate) {
      const input = gatherInputs(node, context);
      const approvalTaskId = await options.writeApprovalGate({
        executionId: context.executionId,
        nodeId: node.id,
        config: node.approvalGate,
        input,
      });
      emit({
        type: "node.paused",
        executionId: context.executionId,
        nodeId: node.id,
        approvalTaskId,
      });
      return {
        nodeId: node.id,
        nodeName: node.name,
        nodeType: nodeTypeId,
        status: "paused",
        output: {},
        error: null,
        durationMs: 0,
        attemptNumber: 0,
        approvalTaskId,
      };
    }

    // ── Child workflow spawn ────────────────────────────────────────────────
    if (node.childWorkflow && options.spawnChildWorkflow) {
      const input = gatherInputs(node, context);

      // ── P1-11: enforce child-workflow nesting depth (architecture §9.1) ──
      // Top-level executions start at depth 0. Each spawn increments the
      // depth by 1; a spawn that would push the depth past
      // `maxChildWorkflowDepth` (default 5) is rejected at the node level
      // so we never enqueue an over-nested child.
      const currentDepth = context.childWorkflowDepth ?? 0;
      const maxDepth = options.maxChildWorkflowDepth ?? 5;
      const childDepth = currentDepth + 1;
      if (childDepth > maxDepth) {
        const depthError =
          `Max child workflow nesting depth (${maxDepth}) exceeded ` +
          `(attempted depth ${childDepth})`;
        emit({
          type: "node.failed",
          executionId: context.executionId,
          nodeId: node.id,
          error: depthError,
          attempt: 1,
        });
        return {
          nodeId: node.id,
          nodeName: node.name,
          nodeType: nodeTypeId,
          status: "failed",
          output: {},
          error: depthError,
          durationMs: 0,
          attemptNumber: 1,
        };
      }

      // Mark the depth on the context so the spawner can propagate it to
      // the child execution (the child's own DAG run will start at
      // `childDepth` and reject any further spawn past `maxDepth`).
      context.childWorkflowDepth = childDepth;

      const childExecutionId = await options.spawnChildWorkflow(
        node.childWorkflow,
        input,
        context,
      );
      emit({
        type: "node.child_spawned",
        executionId: context.executionId,
        nodeId: node.id,
        childExecutionId,
      });

      // ── P1-12: child workflow `await: true` ────────────────────────────
      // When the child is awaited, poll its execution status until it
      // reaches a terminal state (success/failed/cancelled/timeout). The
      // node's result mirrors the child's terminal status. The actual
      // polling is delegated to `awaitChildWorkflowCompletion` (provided
      // by the runner host — typically a `workflow_executions` table
      // poller). If no awaiter is wired we fall back to fire-and-forget
      // and surface a warning so operators notice the misconfiguration.
      if (node.childWorkflow.await === true) {
        if (options.awaitChildWorkflowCompletion) {
          const startedWait = Date.now();
          const childResult = await options.awaitChildWorkflowCompletion(
            childExecutionId,
            {
              timeoutMs: node.childWorkflow.awaitTimeoutMs,
            },
          );
          const waitDurationMs = Date.now() - startedWait;
          if (childResult.status !== "success") {
            const childError =
              childResult.error ??
              `Child workflow ${childExecutionId} ended in status "${childResult.status}"`;
            emit({
              type: "node.failed",
              executionId: context.executionId,
              nodeId: node.id,
              error: childError,
              attempt: 1,
            });
            return {
              nodeId: node.id,
              nodeName: node.name,
              nodeType: nodeTypeId,
              status: "failed",
              output: { childExecutionId },
              error: childError,
              durationMs: waitDurationMs,
              attemptNumber: 1,
              childExecutionId,
            };
          }
          return {
            nodeId: node.id,
            nodeName: node.name,
            nodeType: nodeTypeId,
            status: "success",
            output: { childExecutionId },
            error: null,
            durationMs: waitDurationMs,
            attemptNumber: 1,
            childExecutionId,
          };
        }
        // No awaiter wired — surface as a warning in logs but still
        // succeed (the child was spawned; we just couldn't wait for it).
        console.warn(
          `[DAGRunner] childWorkflow.await=true for node ${node.id} but no awaitChildWorkflowCompletion callback was provided; falling back to fire-and-forget`,
        );
      }

      return {
        nodeId: node.id,
        nodeName: node.name,
        nodeType: nodeTypeId,
        status: "success",
        output: { childExecutionId },
        error: null,
        durationMs: 0,
        attemptNumber: 1,
        childExecutionId,
      };
    }

    // ── Bounded loop ────────────────────────────────────────────────────────
    if (node.loop) {
      return this.executeBoundedLoop(node, context, options, retryPolicy, emit);
    }

    // ── Standard execution with retries ────────────────────────────────────
    return this.executeWithRetries(
      node,
      context,
      retryPolicy,
      emit,
      options.checkpointStore,
    );
  }

  // ─── Standard execution + retries ──────────────────────────────────────────

  private async executeWithRetries(
    node: WorkflowNode,
    context: ExecutionContext,
    policy: RetryPolicy,
    emit: (e: DAGEvent) => void,
    checkpointStore?: DAGRunnerOptions["checkpointStore"],
  ): Promise<NodeExecutionResult> {
    const nodeTypeId = node.nodeTypeId ?? node.type ?? "unknown";
    const executor = this.findExecutor(nodeTypeId);
    const input = gatherInputs(node, context);
    const startedAt = Date.now();

    if (!executor) {
      return {
        nodeId: node.id,
        nodeName: node.name,
        nodeType: nodeTypeId,
        status: "failed",
        output: {},
        error: `No executor registered for node type "${nodeTypeId}"`,
        durationMs: 0,
        attemptNumber: 1,
      };
    }

    let lastError: string | null = null;
    let checkpointId: string | undefined;

    for (let attempt = 1; attempt <= policy.maxAttempts; attempt++) {
      emit({
        type: "node.started",
        executionId: context.executionId,
        nodeId: node.id,
        nodeName: node.name,
        attempt,
      });

      // Write running checkpoint
      if (checkpointStore) {
        checkpointId = await checkpointStore.save({
          executionId: context.executionId,
          nodeId: node.id,
          nodeName: node.name,
          nodeType: nodeTypeId,
          status: "running",
          attemptNumber: attempt,
          inputData: input,
        });
      }

      try {
        const result = await executor.execute(node, context, input);
        const durationMs = Date.now() - startedAt;

        if (result.status === "success") {
          if (checkpointStore && checkpointId !== undefined) {
            await checkpointStore.update(checkpointId, {
              status: "success",
              outputData: result.output,
              durationMs,
            });
          }
          emit({
            type: "node.completed",
            executionId: context.executionId,
            nodeId: node.id,
            durationMs,
          });
          return { ...result, durationMs, attemptNumber: attempt };
        }

        lastError = result.error ?? "Unknown error";
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
      }

      const durationMs = Date.now() - startedAt;
      if (checkpointStore && checkpointId !== undefined) {
        await checkpointStore.update(checkpointId, {
          status: "failed",
          errorMessage: lastError ?? undefined,
          durationMs,
        });
      }

      emit({
        type: "node.failed",
        executionId: context.executionId,
        nodeId: node.id,
        error: lastError ?? "Unknown error",
        attempt,
      });

      if (attempt < policy.maxAttempts) {
        const delay = computeBackoffDelay(policy, attempt);
        emit({
          type: "node.retrying",
          executionId: context.executionId,
          nodeId: node.id,
          attempt: attempt + 1,
          delayMs: delay,
        });
        await sleep(delay);
      }
    }

    return {
      nodeId: node.id,
      nodeName: node.name,
      nodeType: nodeTypeId,
      status: "failed",
      output: {},
      error: lastError ?? "Unknown error",
      durationMs: Date.now() - startedAt,
      attemptNumber: policy.maxAttempts,
    };
  }

  // ─── Bounded loop ───────────────────────────────────────────────────────────

  private async executeBoundedLoop(
    node: WorkflowNode,
    context: ExecutionContext,
    options: DAGRunnerOptions,
    policy: RetryPolicy,
    emit: (e: DAGEvent) => void,
  ): Promise<NodeExecutionResult> {
    const loopConfig = node.loop!;
    const {
      maxIterations,
      continueCondition,
      breakOnKey,
      iterationDelayMs = 0,
    } = loopConfig;
    const startedAt = Date.now();

    // ── P1-13: enforce loop-iteration caps (architecture §9.1) ──────────────
    // Default tenants are capped at MAX_LOOP_ITERATIONS_DEFAULT (100); Pro
    // tenants at MAX_LOOP_ITERATIONS_PRO (10,000). Unbounded loops are
    // forbidden. The cap is resolved by the runner host (dag-worker.ts)
    // based on tenant tier and passed via `options.maxLoopIterations`.
    const loopCap = options.maxLoopIterations ?? MAX_LOOP_ITERATIONS_DEFAULT;
    if (!Number.isFinite(maxIterations) || maxIterations <= 0) {
      const loopError =
        `Bounded loop on node "${node.id}" has invalid maxIterations ` +
        `(${maxIterations}); must be a positive finite integer`;
      emit({
        type: "node.failed",
        executionId: context.executionId,
        nodeId: node.id,
        error: loopError,
        attempt: 1,
      });
      return {
        nodeId: node.id,
        nodeName: node.name,
        nodeType: node.nodeTypeId ?? node.type ?? "unknown",
        status: "failed",
        output: {},
        error: loopError,
        durationMs: Date.now() - startedAt,
        attemptNumber: 1,
      };
    }
    if (maxIterations > loopCap) {
      const loopError =
        `Bounded loop on node "${node.id}" exceeds the iteration cap ` +
        `(${maxIterations} > ${loopCap}). Unbounded loops are forbidden; ` +
        `the tenant tier cap is ${loopCap}.`;
      emit({
        type: "node.failed",
        executionId: context.executionId,
        nodeId: node.id,
        error: loopError,
        attempt: 1,
      });
      return {
        nodeId: node.id,
        nodeName: node.name,
        nodeType: node.nodeTypeId ?? node.type ?? "unknown",
        status: "failed",
        output: {},
        error: loopError,
        durationMs: Date.now() - startedAt,
        attemptNumber: 1,
      };
    }

    let lastOutput: Record<string, unknown> = {};
    let iterations = 0;

    for (let i = 0; i < maxIterations; i++) {
      iterations++;
      const iterResult = await this.executeWithRetries(
        node,
        context,
        policy,
        emit,
        options.checkpointStore,
      );

      if (iterResult.status === "failed") {
        return { ...iterResult, iterations };
      }

      lastOutput = iterResult.output;

      // Break conditions
      if (breakOnKey && lastOutput[breakOnKey]) break;
      if (continueCondition && !lastOutput[continueCondition]) break;

      if (i < maxIterations - 1 && iterationDelayMs > 0) {
        await sleep(iterationDelayMs);
      }
    }

    return {
      nodeId: node.id,
      nodeName: node.name,
      nodeType: node.nodeTypeId ?? node.type ?? "unknown",
      status: "success",
      output: { ...lastOutput, _iterations: iterations },
      error: null,
      durationMs: Date.now() - startedAt,
      attemptNumber: 1,
      iterations,
    };
  }

  // ─── Saga compensation (LIFO rollback) ──────────────────────────────────────

  private async runSagaCompensation(
    sagaStack: SagaEntry[],
    context: ExecutionContext,
    emit: (e: DAGEvent) => void,
  ): Promise<void> {
    // Reverse iteration = LIFO (last in, first compensated)
    for (let i = sagaStack.length - 1; i >= 0; i--) {
      const entry = sagaStack[i];
      const compensateTypeId =
        entry.compensationConfig?.nodeTypeId ?? `${entry.nodeType}.compensate`;

      const executor = this.findExecutor(compensateTypeId);

      emit({
        type: "node.compensating",
        executionId: context.executionId,
        nodeId: entry.nodeId,
      });

      try {
        if (executor?.compensate) {
          const compensationNode: WorkflowNode = {
            id: `${entry.nodeId}__compensate`,
            name: `${entry.nodeName} (compensate)`,
            nodeTypeId: compensateTypeId,
            config: entry.compensationConfig?.config,
          };
          await executor.compensate(compensationNode, context, entry.output);
        } else if (executor) {
          // Fallback: call execute with compensation config
          const compensationNode: WorkflowNode = {
            id: `${entry.nodeId}__compensate`,
            name: `${entry.nodeName} (compensate)`,
            nodeTypeId: compensateTypeId,
            config: {
              ...entry.compensationConfig?.config,
              _compensating: true,
              _originalOutput: entry.output,
            },
          };
          await executor.execute(compensationNode, context, entry.output);
        }
        emit({
          type: "node.compensated",
          executionId: context.executionId,
          nodeId: entry.nodeId,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(
          `[DAGRunner] Saga compensation failed for node ${entry.nodeId}:`,
          msg,
        );
        // Continue compensating other nodes even if one fails
      }
    }
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Gather merged input for a node from sharedState (all upstream outputs). */
function gatherInputs(
  node: WorkflowNode,
  context: ExecutionContext,
): Record<string, unknown> {
  const merged: Record<string, unknown> = {
    ...context.triggerPayload,
    _triggerType: context.triggerType,
    _executionId: context.executionId,
    _workflowId: context.workflowId,
  };
  if (context.sharedState) {
    for (const [, output] of context.sharedState) {
      Object.assign(merged, output);
    }
  }
  return merged;
}

function buildInDegreeMap(graph: WorkflowGraph): Map<string, number> {
  const map = new Map<string, number>();
  for (const node of graph.nodes) map.set(node.id, 0);
  for (const edge of graph.edges) {
    map.set(edge.target, (map.get(edge.target) ?? 0) + 1);
  }
  return map;
}

function buildAdjacencyMap(graph: WorkflowGraph): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const node of graph.nodes) map.set(node.id, []);
  for (const edge of graph.edges) {
    map.get(edge.source)?.push(edge.target);
  }
  return map;
}

function unlockDownstream(
  completedNodeId: string,
  inDegreeMap: Map<string, number>,
  adjacencyMap: Map<string, string[]>,
  readyQueue: WorkflowNode[],
  graph: WorkflowGraph,
  failed: boolean,
): void {
  if (failed) return;
  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));
  for (const neighborId of adjacencyMap.get(completedNodeId) ?? []) {
    const newDegree = (inDegreeMap.get(neighborId) ?? 1) - 1;
    inDegreeMap.set(neighborId, newDegree);
    if (newDegree === 0) {
      const node = nodeMap.get(neighborId);
      if (node) readyQueue.push(node);
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
