import { eq, sql } from "drizzle-orm";
import {
  db,
  executionsTable,
  executionCheckpointsTable,
  dlqEntriesTable,
  auditLogTable,
  workflowVersionsTable,
  workflowsTable,
} from "@workspace/db";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface WorkflowNode {
  id: string;
  name: string;
  type?: string;
  nodeTypeId?: string;
  position?: { x: number; y: number };
  config?: Record<string, unknown>;
}

// ─── Audit helper ──────────────────────────────────────────────────────────────

export async function writeAudit(
  action: string,
  resourceType: string,
  resourceId: string,
  metadata?: Record<string, unknown>,
  actorType = "system",
  actorId?: string
) {
  await db.insert(auditLogTable).values({
    action,
    resourceType,
    resourceId,
    actorType,
    actorId: actorId ?? null,
    metadata: metadata ?? null,
  });
}

// ─── Node simulation ───────────────────────────────────────────────────────────

function nodeCategory(nodeTypeId: string): string {
  const prefix = nodeTypeId.split(".")[0] ?? "action";
  return ["trigger", "action", "logic", "ai", "data"].includes(prefix)
    ? prefix
    : "action";
}

function nodeDurationMs(category: string): number {
  switch (category) {
    case "trigger": return Math.floor(Math.random() * 80) + 20;
    case "logic": return Math.floor(Math.random() * 40) + 10;
    case "data": return Math.floor(Math.random() * 120) + 30;
    case "ai": return Math.floor(Math.random() * 2500) + 500;
    default: return Math.floor(Math.random() * 1300) + 200; // action
  }
}

function nodeFailureProbability(category: string): number {
  switch (category) {
    case "trigger": return 0;
    case "logic": return 0.01;
    case "data": return 0.02;
    case "ai": return 0.04;
    default: return 0.06; // action
  }
}

function simulateOutput(nodeTypeId: string, config: Record<string, unknown>, input: Record<string, unknown>): Record<string, unknown> {
  const t = nodeTypeId;
  if (t.startsWith("trigger.")) {
    return { triggeredAt: new Date().toISOString(), payload: input, source: t.replace("trigger.", "") };
  }
  if (t === "action.http") {
    return { statusCode: 200, headers: { "content-type": "application/json" }, body: { success: true, data: { id: Math.floor(Math.random() * 9999) } }, responseTimeMs: Math.floor(Math.random() * 300) + 50 };
  }
  if (t === "action.send_email") {
    return { messageId: `msg_${Math.random().toString(36).slice(2)}`, to: config.to ?? "recipient@example.com", subject: config.subject ?? "Notification", accepted: true, timestamp: new Date().toISOString() };
  }
  if (t === "action.slack") {
    return { ts: `${Date.now() / 1000}`, channel: config.channel ?? "#general", ok: true, messageId: `slack_${Math.random().toString(36).slice(2)}` };
  }
  if (t === "action.create_record") {
    return { id: Math.floor(Math.random() * 99999), object: config.object_type ?? "Record", createdAt: new Date().toISOString(), fields: { name: input.name ?? "New Record", status: "active" } };
  }
  if (t === "action.db_query") {
    const rows = Array.from({ length: Math.floor(Math.random() * 8) + 1 }, (_, i) => ({ id: i + 1, value: Math.random() * 100 }));
    return { rows, rowCount: rows.length, duration: `${Math.floor(Math.random() * 20) + 2}ms` };
  }
  if (t === "action.spreadsheet") {
    return { updatedRange: "Sheet1!A2:E100", updatedRows: Math.floor(Math.random() * 5) + 1, spreadsheetId: config.spreadsheetId ?? "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms" };
  }
  if (t === "ai.classify") {
    const categories = String(config.categories ?? "CategoryA,CategoryB").split(",");
    return { category: categories[Math.floor(Math.random() * categories.length)]?.trim(), confidence: (Math.random() * 0.3 + 0.7).toFixed(3), modelVersion: "gpt-4o-mini", tokensUsed: Math.floor(Math.random() * 80) + 20 };
  }
  if (t === "ai.summarize") {
    return { summary: "Key metrics show a positive trend with 23% growth QoQ. Action items identified: expand outreach, optimize pipeline stages, and schedule follow-ups.", wordCount: 28, tokensUsed: Math.floor(Math.random() * 150) + 50 };
  }
  if (t === "ai.extract") {
    return { extracted: { vendor: "ACME Corp", amount: `$${(Math.random() * 5000 + 100).toFixed(2)}`, date: new Date().toISOString().split("T")[0], invoiceNumber: `INV-${Math.floor(Math.random() * 9999)}` }, confidence: 0.94 };
  }
  if (t === "ai.scraper") {
    return { url: config.url ?? "https://example.com/pricing", content: "Extracted pricing data: Starter $29/mo, Pro $99/mo, Enterprise custom pricing.", extractedAt: new Date().toISOString() };
  }
  if (t === "logic.if" || t === "logic.router") {
    return { branch: Math.random() > 0.5 ? "true" : "false", evaluated: true, condition: config.operator ?? "eq" };
  }
  if (t === "logic.filter") {
    const kept = Math.floor(Math.random() * 5) + 1;
    return { filtered: kept, total: kept + Math.floor(Math.random() * 5), passedItems: kept };
  }
  if (t === "logic.loop") {
    return { iterations: Math.floor(Math.random() * 8) + 2, completed: true };
  }
  if (t === "logic.delay") {
    return { delayedMs: parseInt(String(config.duration ?? 1)) * 1000, resumedAt: new Date().toISOString() };
  }
  if (t === "data.transform") {
    return { transformed: true, inputFields: Object.keys(input).length, outputFields: Object.keys(input).length + 2, schema: { id: "integer", name: "string", createdAt: "datetime" } };
  }
  if (t === "data.parse_doc") {
    return { text: "Extracted document text content. Invoice #12345. Total: $2,450.00. Due: 2025-02-15.", pages: 1, wordCount: 18 };
  }
  return { processed: true, timestamp: new Date().toISOString(), nodeType: nodeTypeId };
}

function simulateError(nodeTypeId: string): string {
  const errors: Record<string, string[]> = {
    "action.http": ["Connection timeout after 30s", "HTTP 429 Too Many Requests", "HTTP 503 Service Unavailable", "SSL certificate verification failed"],
    "action.send_email": ["SMTP connection refused", "Invalid recipient address", "Rate limit exceeded"],
    "action.slack": ["Slack API error: channel_not_found", "Slack API error: not_in_channel"],
    "action.create_record": ["Duplicate key constraint violation", "Required field 'email' missing"],
    "ai.classify": ["OpenAI API timeout", "Context length exceeded", "Model overloaded, retry later"],
    "ai.summarize": ["Token limit exceeded for input", "OpenAI API rate limit"],
    "ai.extract": ["Unable to parse document format", "Extraction confidence below threshold"],
    "action.db_query": ["Connection pool exhausted", "Query execution timeout (30s)", "Deadlock detected"],
  };
  const nodeErrors = errors[nodeTypeId] ?? ["Unexpected error: internal service failure", "Step execution timed out"];
  return nodeErrors[Math.floor(Math.random() * nodeErrors.length)] ?? "Unexpected error";
}

// ─── Core runner (async, fire-and-forget) ─────────────────────────────────────

export async function runWorkflow(
  executionId: number,
  workflowId: number,
  workflowName: string,
  nodes: WorkflowNode[],
  triggerPayload: Record<string, unknown> = {},
  triggerType = "manual"
): Promise<void> {
  // Sort nodes left-to-right by x position
  const sorted = [...nodes].sort((a, b) => (a.position?.x ?? 0) - (b.position?.x ?? 0));

  await writeAudit("execution.started", "execution", String(executionId), { workflowId, workflowName, triggerType, nodeCount: sorted.length });

  let currentInput: Record<string, unknown> = { ...triggerPayload, _triggerType: triggerType };
  let failed = false;

  for (const node of sorted) {
    const nodeTypeId = node.nodeTypeId ?? node.type ?? "action.http";
    const category = nodeCategory(nodeTypeId);
    const config = (node.config ?? {}) as Record<string, unknown>;
    const maxAttempts = category === "trigger" ? 1 : 2;

    let lastError: string | null = null;
    let succeeded = false;
    let finalOutput: Record<string, unknown> | null = null;
    let finalDuration = 0;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const startedAt = new Date();
      const duration = nodeDurationMs(category);

      // Insert checkpoint as "running"
      const [checkpoint] = await db.insert(executionCheckpointsTable).values({
        executionId,
        nodeId: node.id,
        nodeName: node.name,
        nodeType: nodeTypeId,
        status: "running",
        attemptNumber: attempt,
        inputData: currentInput,
        startedAt,
      }).returning();

      // Simulate execution time
      await new Promise((r) => setTimeout(r, duration));

      const willFail = Math.random() < nodeFailureProbability(category);

      if (willFail) {
        lastError = simulateError(nodeTypeId);
        await db.update(executionCheckpointsTable)
          .set({ status: "failed", errorMessage: lastError, completedAt: new Date(), durationMs: duration })
          .where(eq(executionCheckpointsTable.id, checkpoint.id));

        if (attempt < maxAttempts) {
          // Brief backoff before retry
          await new Promise((r) => setTimeout(r, 500));
        }
      } else {
        const output = simulateOutput(nodeTypeId, config, currentInput);
        finalOutput = output;
        finalDuration = duration;
        await db.update(executionCheckpointsTable)
          .set({ status: "success", outputData: output, completedAt: new Date(), durationMs: duration })
          .where(eq(executionCheckpointsTable.id, checkpoint.id));
        succeeded = true;
        break;
      }
    }

    if (!succeeded) {
      // Write DLQ entry
      await db.insert(dlqEntriesTable).values({
        executionId,
        workflowId,
        workflowName,
        nodeId: node.id,
        nodeName: node.name,
        nodeType: nodeTypeId,
        errorMessage: lastError ?? "Unknown error",
        attempts: maxAttempts,
        jobData: { nodeTypeId, config, lastInput: currentInput },
      });

      await writeAudit("execution.node_failed", "execution", String(executionId), { nodeId: node.id, nodeName: node.name, nodeType: nodeTypeId, error: lastError });

      // Mark execution as failed
      await db.update(executionsTable).set({
        status: "failed",
        finishedAt: new Date(),
        durationMs: sql`EXTRACT(EPOCH FROM (NOW() - ${executionsTable.startedAt})) * 1000`,
        errorMessage: `Node "${node.name}" failed after ${maxAttempts} attempt(s): ${lastError}`,
      }).where(eq(executionsTable.id, executionId));

      await db.update(workflowsTable).set({ lastRunStatus: "failed", lastRunAt: new Date() }).where(eq(workflowsTable.id, workflowId));

      await writeAudit("execution.failed", "execution", String(executionId), { workflowId, failedNode: node.name, error: lastError });
      failed = true;
      break;
    }

    if (finalOutput) currentInput = { ...finalOutput, _prevNode: node.id };
  }

  if (!failed) {
    const [exec] = await db.select().from(executionsTable).where(eq(executionsTable.id, executionId));
    const durationMs = exec ? Date.now() - exec.startedAt.getTime() : 0;

    await db.update(executionsTable).set({
      status: "success",
      finishedAt: new Date(),
      durationMs,
    }).where(eq(executionsTable.id, executionId));

    await db.update(workflowsTable).set({ lastRunStatus: "success", lastRunAt: new Date() }).where(eq(workflowsTable.id, workflowId));

    await writeAudit("execution.completed", "execution", String(executionId), { workflowId, workflowName, durationMs });
  }
}

// ─── Create execution + fire runner ───────────────────────────────────────────

export async function startWorkflowExecution(
  workflowId: number,
  workflowName: string,
  nodes: WorkflowNode[],
  triggerType: "manual" | "webhook" | "schedule" | "api",
  triggerPayload: Record<string, unknown> = {}
): Promise<typeof executionsTable.$inferSelect> {
  const [execution] = await db.insert(executionsTable).values({
    workflowId,
    workflowName,
    status: "running",
    startedAt: new Date(),
    steps: [],
  }).returning();

  await db.update(workflowsTable).set({
    executionCount: sql`${workflowsTable.executionCount} + 1`,
    lastRunAt: new Date(),
    lastRunStatus: "running",
  }).where(eq(workflowsTable.id, workflowId));

  await writeAudit("execution.started", "workflow", String(workflowId), { executionId: execution.id, triggerType, workflowName }, triggerType === "webhook" ? "webhook" : "user");

  // Save a version snapshot on each run (only if nodes exist)
  if (nodes.length > 0) {
    const existing = await db.select({ version: workflowVersionsTable.version })
      .from(workflowVersionsTable)
      .where(eq(workflowVersionsTable.workflowId, workflowId))
      .orderBy(sql`${workflowVersionsTable.version} DESC`)
      .limit(1);
    const nextVersion = (existing[0]?.version ?? 0) + 1;
    if (nextVersion <= 1 || nodes.length > 0) {
      await db.insert(workflowVersionsTable).values({
        workflowId,
        version: nextVersion,
        name: workflowName,
        nodes,
        changeNote: `Auto-snapshot on execution (${triggerType})`,
      }).onConflictDoNothing();
    }
  }

  // Fire-and-forget execution
  runWorkflow(execution.id, workflowId, workflowName, nodes, triggerPayload, triggerType).catch(async (err) => {
    console.error("[workflow-runner] unexpected error:", err);
    await db.update(executionsTable).set({
      status: "failed",
      finishedAt: new Date(),
      errorMessage: String(err),
    }).where(eq(executionsTable.id, execution.id)).catch(() => {});
  });

  return execution;
}
