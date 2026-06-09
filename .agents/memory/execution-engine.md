---
name: Execution engine architecture
description: How the real workflow execution engine works; fire-and-forget async pattern with DB checkpoints.
---

## Rule
The execution engine (`artifacts/api-server/src/engine/workflow-runner.ts`) runs asynchronously. `startWorkflowExecution()` inserts the execution record and fires `runWorkflow()` as a detached async function. The HTTP route returns immediately (202) with the new execution in "running" status.

**Why:** No BullMQ/Redis in this stack; fire-and-forget avoids blocking HTTP responses for long-running flows. Node.js event loop handles the async simulation.

**How to apply:**
- Route handlers call `startWorkflowExecution()` and return the result immediately.
- `runWorkflow()` writes per-node checkpoints to `execution_checkpoints` table.
- DLQ entries are written when a node exhausts its retry attempts (2 attempts for non-trigger nodes).
- Audit log is written at execution start, completion, and failure.
- Legacy executions (before engine) have `steps` JSONB; new ones use checkpoint rows.
- `GET /executions/:id` returns checkpoints if present, otherwise falls back to `steps` JSONB.

## DB tables added
- `execution_checkpoints` — per-node execution records with input/output/error
- `dlq_entries` — dead-letter queue (failed after all retries)
- `audit_log` — full event trail
- `workflow_versions` — DAG snapshots on workflow save/run
