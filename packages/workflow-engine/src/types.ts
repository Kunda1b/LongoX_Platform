// ─── Core graph types ─────────────────────────────────────────────────────────

export interface WorkflowNode {
  id: string;
  name: string;
  type?: string;
  nodeTypeId?: string;
  position?: { x: number; y: number };
  config?: Record<string, unknown>;
  inputHandles?: Array<{ id: string; label: string; type: string }>;
  outputHandles?: Array<{ id: string; label: string; type: string }>;
  /** Node-level retry policy (overrides DAGRunnerOptions defaults) */
  retryPolicy?: RetryPolicy;
  /** Saga compensation config — only for nodes that need rollback */
  compensation?: CompensationConfig;
  /** Human approval gate config — pauses execution at this node */
  approvalGate?: ApprovalGateConfig;
  /** Bounded loop config — repeats this node up to maxIterations */
  loop?: BoundedLoopConfig;
  /** Child workflow spawn config */
  childWorkflow?: ChildWorkflowConfig;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type?: "default" | "conditional";
  label?: string;
  condition?: Record<string, unknown>;
}

export interface WorkflowGraph {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  /** Maximum wall-clock milliseconds before the entire run is cancelled */
  timeoutMs?: number;
}

// ─── Execution context ────────────────────────────────────────────────────────

export interface ExecutionContext {
  executionId: string;
  workflowId: string;
  workflowName: string;
  triggerType: string;
  triggerPayload: Record<string, unknown>;
  variables: Record<string, unknown>;
  startedAt: Date;
  /** Set by the DAG runner to share outputs across branches */
  sharedState?: Map<string, Record<string, unknown>>;
  /** Idempotency key for the whole execution (usually executionId as string) */
  idempotencyKey?: string;
  /** Parent execution ID when this is a child workflow */
  parentExecutionId?: string;
  /**
   * Nesting depth for child-workflow orchestration (architecture §9.1).
   *
   * Top-level executions start at depth 0. Each child workflow spawn
   * increments the depth by 1; the runner rejects any spawn that would
   * exceed `DAGRunnerOptions.maxChildWorkflowDepth` (default 5).
   */
  childWorkflowDepth?: number;
}

// ─── Node execution result ────────────────────────────────────────────────────

export interface NodeExecutionResult {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  status: "success" | "failed" | "paused" | "skipped" | "compensated";
  output: Record<string, unknown>;
  error: string | null;
  durationMs: number;
  attemptNumber: number;
  /** Set when node is in approval-gate pause state */
  approvalTaskId?: string;
  /** Set when node spawned a child workflow */
  childExecutionId?: string;
  /** Loop iteration count (for bounded-loop nodes) */
  iterations?: number;
}

// ─── Node executor interface ──────────────────────────────────────────────────

export interface NodeExecutor {
  canHandle(nodeTypeId: string): boolean;
  execute(
    node: WorkflowNode,
    context: ExecutionContext,
    input: Record<string, unknown>,
  ): Promise<NodeExecutionResult>;
  /** Optional compensation handler for saga rollback */
  compensate?(
    node: WorkflowNode,
    context: ExecutionContext,
    output: Record<string, unknown>,
  ): Promise<void>;
}

// ─── Retry policy ─────────────────────────────────────────────────────────────

export interface RetryPolicy {
  /** Total attempts (including first try). Default: 3 */
  maxAttempts: number;
  /** Initial backoff delay in ms. Default: 500 */
  initialDelayMs: number;
  /** Backoff multiplier per attempt. Default: 2 (exponential) */
  backoffFactor: number;
  /** Maximum backoff delay cap in ms. Default: 30_000 */
  maxDelayMs: number;
  /** Jitter factor 0–1 (adds random noise to delay). Default: 0.2 */
  jitter: number;
}

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 3,
  initialDelayMs: 500,
  backoffFactor: 2,
  maxDelayMs: 30_000,
  jitter: 0.2,
};

export const TRIGGER_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 1,
  initialDelayMs: 0,
  backoffFactor: 1,
  maxDelayMs: 0,
  jitter: 0,
};

export function computeBackoffDelay(policy: RetryPolicy, attempt: number): number {
  const base = policy.initialDelayMs * Math.pow(policy.backoffFactor, attempt - 1);
  const capped = Math.min(base, policy.maxDelayMs);
  const jitter = capped * policy.jitter * Math.random();
  return Math.round(capped + jitter);
}

// ─── Saga / compensation ──────────────────────────────────────────────────────

export interface CompensationConfig {
  /** Node type ID of the compensation executor. Defaults to nodeTypeId + ".compensate" */
  nodeTypeId?: string;
  /** Additional config passed to the compensation executor */
  config?: Record<string, unknown>;
}

export interface SagaEntry {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  output: Record<string, unknown>;
  compensationConfig?: CompensationConfig;
}

// ─── Human approval gate ──────────────────────────────────────────────────────

export interface ApprovalGateConfig {
  /** Who can approve — role name or user ID list */
  approverRoles?: string[];
  approverUserIds?: number[];
  /** How long to wait before timing out the approval (ms). Default: 7 days */
  timeoutMs?: number;
  /** Message shown to approvers */
  message?: string;
}

export type ApprovalDecision = "approved" | "rejected" | "timed_out";

export interface ApprovalResumeSignal {
  executionId: string;
  nodeId: string;
  decision: ApprovalDecision;
  decidedBy?: number;
  note?: string;
}

// ─── Bounded loop ─────────────────────────────────────────────────────────────

export interface BoundedLoopConfig {
  /** Maximum number of iterations. Required. */
  maxIterations: number;
  /** Condition evaluated against node output — falsy stops the loop */
  continueCondition?: string; // JSON Pointer or simple expression key
  /** Delay between iterations in ms. Default: 0 */
  iterationDelayMs?: number;
  /** Stop when this key in output is truthy */
  breakOnKey?: string;
}

/**
 * Architecture §9.1 loop-iteration caps.
 *
 * Default tenants are capped at 100 iterations; Pro tenants at 10,000.
 * Unbounded loops are forbidden. The runner rejects (at the node level)
 * any loop node whose `maxIterations` exceeds the cap configured in
 * `DAGRunnerOptions.maxLoopIterations`.
 */
export const MAX_LOOP_ITERATIONS_DEFAULT = 100;
export const MAX_LOOP_ITERATIONS_PRO = 10_000;

// ─── Child workflow ───────────────────────────────────────────────────────────

export interface ChildWorkflowConfig {
  /** ID of the workflow to spawn */
  workflowId: string;
  /**
   * Whether to await completion before continuing. Default: false (fire-and-forget).
   *
   * When `await` is true the runner polls the child execution's status
   * (via `DAGRunnerOptions.awaitChildWorkflowCompletion`) until the child
   * reaches a terminal state. The current node's result mirrors the
   * child's terminal status.
   */
  await?: boolean;
  /** How to map current node output into child trigger payload */
  inputMapping?: Record<string, string>;
  /**
   * Optional wall-clock cap on how long the parent will wait for the child
   * when `await: true`. Defaults to the parent execution's remaining
   * timeout budget. Expressed in milliseconds.
   */
  awaitTimeoutMs?: number;
}

// ─── Node lease ───────────────────────────────────────────────────────────────

export interface LeaseStore {
  acquire(
    executionId: string,
    nodeId: string,
    ttlMs?: number,
  ): Promise<NodeLease | null>;
}

export interface NodeLease {
  executionId: string;
  nodeId: string;
  workerId: string;
  acquiredAt: Date;
  expiresAt: Date;
  release(): Promise<void>;
}

// ─── Idempotency ──────────────────────────────────────────────────────────────

/**
 * Input shape for idempotency checks. Architecture §9.1 requires the
 * idempotency key to be derived from `workflow_id + run_id + node_id +
 * attempt` (the `run_id` is the workflow execution id).
 */
export interface IdempotencyKeyInput {
  /** Workflow definition id (`workflow_id` in §9.1). */
  workflowId: string;
  /** Workflow execution id (`run_id` in §9.1). */
  executionId: string;
  /** Node id within the workflow graph. */
  nodeId: string;
  /** Attempt number (1-based). */
  attempt: number;
}

/**
 * Build the canonical §9.1 idempotency key.
 *
 * Format: `${workflowId}|${executionId}|${nodeId}|${attempt}`.
 * Components are pipe-delimited so the key is greppable in logs and
 * uniquely identifies a single (workflow, run, node, attempt) tuple.
 */
export function buildIdempotencyKey(input: IdempotencyKeyInput): string {
  return `${input.workflowId}|${input.executionId}|${input.nodeId}|${input.attempt}`;
}

export interface IdempotencyStore {
  /**
   * Returns true if the node has already completed successfully for this
   * (workflow, run, node, attempt) tuple.
   */
  isComplete(input: IdempotencyKeyInput): Promise<boolean>;
  /** Marks the (workflow, run, node, attempt) tuple as complete with its output. */
  markComplete(
    input: IdempotencyKeyInput,
    output: Record<string, unknown>,
  ): Promise<void>;
  /** Retrieves the stored output for an already-complete tuple. */
  getOutput(
    input: IdempotencyKeyInput,
  ): Promise<Record<string, unknown> | null>;
}

// ─── Checkpoint ───────────────────────────────────────────────────────────────

/**
 * Per-node checkpoint schema — architecture.md §9.7.
 *
 * Persisted inside the `node_execution_checkpoints.state_json` JSON column.
 * The full set of fields MUST be present so that a recovery worker can
 * reconstruct a crashed run: idempotency key, compensation status, retry
 * count, and start/finish timestamps.
 *
 * Field mapping (architecture §9.7):
 *   - idempotency_key:   `${executionId}|${nodeId}|${attempt}`
 *   - compensation_status: pending | done | failed | skipped
 *   - retry_count:       number of retries already attempted (attempt - 1)
 *   - started_at:        when the node execution began
 *   - finished_at:       when the node execution ended (null while running)
 */
export interface CheckpointData {
  /** Canonical id from the workflow_executions row. */
  executionId: string;
  nodeId: string;
  nodeName: string;
  nodeType: string;
  /** Lifecycle state — uses the §9.7 `state` vocabulary. */
  status: "pending" | "running" | "completed" | "failed" | "paused" | "skipped";
  attemptNumber: number;
  inputData: Record<string, unknown>;
  outputData?: Record<string, unknown> | null;
  errorMessage?: string | null;
  durationMs?: number | null;
  metadata?: Record<string, unknown>;
  // ── §9.7 mandated fields ──────────────────────────────────────────────────
  /** Idempotency key — format: `${executionId}|${nodeId}|${attemptNumber}`. */
  idempotencyKey: string;
  /** Saga compensation state. */
  compensationStatus: "pending" | "done" | "failed" | "skipped";
  /** Number of retries already attempted (= attempt - 1). */
  retryCount: number;
  /** ISO timestamp the node started executing. */
  startedAt: string;
  /** ISO timestamp the node finished (null while running). */
  finishedAt: string | null;
}

export interface CheckpointStore {
  /** Save a checkpoint for a node execution. */
  save(opts: {
    executionId: string;
    nodeId: string;
    nodeName: string;
    nodeType: string;
    status: "running" | "success" | "failed" | "paused";
    attemptNumber: number;
    inputData: Record<string, unknown>;
    outputData?: Record<string, unknown>;
    errorMessage?: string;
    durationMs?: number;
    metadata?: Record<string, unknown>;
    /**
     * Optional workflow + run identifiers used to build the §9.7
     * `idempotency_key` (`workflowId|runId|nodeId|attempt`). When omitted,
     * the checkpoint store falls back to `executionId|nodeId|attempt`.
     */
    workflowId?: string;
    /** Optional run id (defaults to the executionId). */
    runId?: string;
    /** Optional compensation status override (defaults to "pending"). */
    compensationStatus?: "pending" | "done" | "failed" | "skipped";
    /** Optional explicit start timestamp (defaults to now). */
    startedAt?: Date;
    /** Optional explicit finish timestamp (set when status != "running"). */
    finishedAt?: Date | null;
  }): Promise<string>;
  /** Load all successful checkpoints for an execution (for resume). */
  loadCompleted(
    executionId: string,
  ): Promise<Array<{ nodeId: string; outputData: Record<string, unknown> }>>;
  /** Update an existing checkpoint by its DB id. */
  update(checkpointId: string, updates: {
    status: "success" | "failed" | "paused";
    outputData?: Record<string, unknown>;
    errorMessage?: string;
    durationMs?: number;
    metadata?: Record<string, unknown>;
    /** Saga compensation status — set to "done" after a successful compensate. */
    compensationStatus?: "pending" | "done" | "failed" | "skipped";
    /** Optional explicit finish timestamp (defaults to now). */
    finishedAt?: Date | null;
  }): Promise<void>;
}

/**
 * Build the canonical §9.7 idempotency key for a checkpoint.
 *
 * Format: `${workflowId}|${runId}|${nodeId}|${attempt}`.
 * When `workflowId`/`runId` are unavailable, falls back to the legacy
 * `${executionId}|${nodeId}|${attempt}` form (still unique per attempt).
 */
export function buildCheckpointIdempotencyKey(opts: {
  executionId: string;
  workflowId?: string;
  runId?: string;
  nodeId: string;
  attemptNumber: number;
}): string {
  const workflow = opts.workflowId ?? opts.executionId;
  const run = opts.runId ?? opts.executionId;
  return `${workflow}|${run}|${opts.nodeId}|${opts.attemptNumber}`;
}

// ─── DAG runner events ────────────────────────────────────────────────────────

export type DAGEvent =
  | { type: "execution.started"; executionId: string; workflowId: string }
  | { type: "node.started"; executionId: string; nodeId: string; nodeName: string; attempt: number }
  | { type: "node.completed"; executionId: string; nodeId: string; durationMs: number }
  | { type: "node.failed"; executionId: string; nodeId: string; error: string; attempt: number }
  | { type: "node.retrying"; executionId: string; nodeId: string; attempt: number; delayMs: number }
  | { type: "node.paused"; executionId: string; nodeId: string; approvalTaskId: string }
  | { type: "node.compensating"; executionId: string; nodeId: string }
  | { type: "node.compensated"; executionId: string; nodeId: string }
  | { type: "node.child_spawned"; executionId: string; nodeId: string; childExecutionId: string }
  | { type: "execution.completed"; executionId: string; durationMs: number }
  | { type: "execution.failed"; executionId: string; error: string }
  | { type: "execution.saga_compensating"; executionId: string; steps: number }
  | { type: "dlq.entry"; executionId: string; nodeId: string; error: string };

export type DAGEventHandler = (event: DAGEvent) => void | Promise<void>;

// ─── DAG runner options ───────────────────────────────────────────────────────

export interface DAGRunnerOptions {
  /** Default retry policy for all nodes (per-node policy takes precedence). */
  defaultRetryPolicy?: RetryPolicy;
  /** Parallelism limit for fan-out. Default: unlimited (0) */
  maxParallelNodes?: number;
  /** Global execution timeout in ms (overrides graph.timeoutMs) */
  timeoutMs?: number;
  /** Event handler for progress reporting / SSE */
  onEvent?: DAGEventHandler;
  /** Checkpoint store (required for resume) */
  checkpointStore?: CheckpointStore;
  /** Idempotency store (required for deduplication) */
  idempotencyStore?: IdempotencyStore;
  /** Whether to run saga compensation on failure. Default: true */
  enableSaga?: boolean;
  /** Child workflow spawner */
  spawnChildWorkflow?: (config: ChildWorkflowConfig, input: Record<string, unknown>, context: ExecutionContext) => Promise<string>;
  /** Approval gate writer */
  writeApprovalGate?: (opts: { executionId: string; nodeId: string; config: ApprovalGateConfig; input: Record<string, unknown> }) => Promise<string>;
  /** Node lease store for multi-worker safety */
  leaseStore?: LeaseStore;
  /**
   * Maximum nesting depth for child workflows (architecture §9.1 default: 5).
   *
   * Top-level executions run at depth 0. A spawn that would push the depth
   * past this cap is rejected with a node-level `failed` result instead of
   * being enqueued.
   */
  maxChildWorkflowDepth?: number;
  /**
   * Maximum allowed `maxIterations` for bounded-loop nodes (architecture §9.1).
   *
   * Default tenants are capped at `MAX_LOOP_ITERATIONS_DEFAULT` (100); Pro
   * tenants at `MAX_LOOP_ITERATIONS_PRO` (10,000). Unbounded loops are
   * forbidden. The runner rejects any loop node whose `maxIterations`
   * exceeds this cap with a node-level `failed` result.
   *
   * Defaults to `MAX_LOOP_ITERATIONS_DEFAULT`. The runner host should
   * resolve the tenant's tier and pass the appropriate cap.
   */
  maxLoopIterations?: number;
  /**
   * Polling-based awaiter used when a `ChildWorkflowConfig` has `await: true`.
   *
   * Resolves to the child's terminal status (`success` | `failed` | any
   * other terminal state). Implementations should poll the
   * `workflow_executions` table and resolve as soon as the child reaches a
   * terminal state (or time out).
   */
  awaitChildWorkflowCompletion?: (
    childExecutionId: string,
    opts?: { timeoutMs?: number; pollIntervalMs?: number },
  ) => Promise<{ status: string; error?: string }>;
}
