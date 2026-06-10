import { db, executionsTable, auditLogTable, workflowsTable } from "@longox/db";
import { eq } from "drizzle-orm";

export async function startWorkflowExecution(
  workflowId: number,
  workflowName: string,
  nodes: any[],
  triggerType: string,
  payload?: Record<string, unknown>,
) {
  const [execution] = await db
    .insert(executionsTable)
    .values({
      workflowId,
      workflowName,
      status: "pending",
      startedAt: new Date(),
      triggerType,
      input: payload ?? {},
      steps: [],
    })
    .returning();

  // Delegate actual execution to the execution-service worker
  // which picks up 'pending' executions via its recovery mechanism.

  return execution;
}

export async function writeAudit(
  action: string,
  entityType: string,
  entityId: string,
  details: Record<string, unknown>,
  actor: string,
) {
  await db.insert(auditLogTable).values({
    action,
    entityType,
    entityId,
    details,
    actor,
    createdAt: new Date(),
  });
}
