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
  childExecutionId?: number;
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

// ─── Child workflow ───────────────────────────────────────────────────────────

export interface ChildWorkflowConfig {
  /** ID of the workflow to spawn */
  workflowId: string;
  /** Whether to await completion before continuing. Default: false (fire-and-forget) */
  await?: boolean;
  /** How to map current node output into child trigger payload */
  inputMapping?: Record<string, string>;
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

export interface IdempotencyStore {
  /** Returns true if the node has already completed successfully for this execution. */
  isComplete(executionId: string, nodeId: string): Promise<boolean>;
  /** Marks the node as complete with its output. */
  markComplete(
    executionId: string,
    nodeId: string,
    output: Record<string, unknown>,
  ): Promise<void>;
  /** Retrieves the stored output for an already-complete node. */
  getOutput(
    executionId: string,
    nodeId: string,
  ): Promise<Record<string, unknown> | null>;
}

// ─── Checkpoint ───────────────────────────────────────────────────────────────

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
  }): Promise<void>;
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
  | { type: "node.child_spawned"; executionId: string; nodeId: string; childExecutionId: number }
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
  spawnChildWorkflow?: (config: ChildWorkflowConfig, input: Record<string, unknown>, context: ExecutionContext) => Promise<number>;
  /** Approval gate writer */
  writeApprovalGate?: (opts: { executionId: string; nodeId: string; config: ApprovalGateConfig; input: Record<string, unknown> }) => Promise<string>;
  /** Node lease store for multi-worker safety */
  leaseStore?: LeaseStore;
}
