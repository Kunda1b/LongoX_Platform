import { db, dlqEntriesTable } from "@longox/db";
import { eq, and, desc } from "drizzle-orm";

export interface DLQEntry {
  executionId: string;
  workflowId: string;
  workflowName: string;
  nodeId: string;
  nodeName: string;
  nodeType: string;
  errorMessage: string;
  attempts: number;
  jobData: Record<string, unknown> | null;
}

export class DeadLetterQueue {
  async addEntry(entry: DLQEntry): Promise<string> {
    const [inserted] = await db
      .insert(dlqEntriesTable)
      .values({
        executionId: entry.executionId,
        workflowId: entry.workflowId,
        workflowName: entry.workflowName,
        nodeId: entry.nodeId,
        nodeName: entry.nodeName,
        nodeType: entry.nodeType,
        errorMessage: entry.errorMessage,
        attempts: entry.attempts,
        jobData: entry.jobData,
      })
      .returning();

    return inserted.id;
  }

  async listEntries(
    workflowId?: string,
    status?: string,
    limit: number = 50,
  ): Promise<(typeof dlqEntriesTable.$inferSelect)[]> {
    const conditions: ReturnType<typeof eq>[] = [];
    if (workflowId) conditions.push(eq(dlqEntriesTable.workflowId, workflowId));
    if (status) conditions.push(eq(dlqEntriesTable.status, status));

    return db
      .select()
      .from(dlqEntriesTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(dlqEntriesTable.createdAt))
      .limit(limit);
  }

  async getEntry(
    id: string,
  ): Promise<typeof dlqEntriesTable.$inferSelect | null> {
    const [entry] = await db
      .select()
      .from(dlqEntriesTable)
      .where(eq(dlqEntriesTable.id, id))
      .limit(1);
    return entry ?? null;
  }

  async markRetrying(id: string): Promise<void> {
    await db
      .update(dlqEntriesTable)
      .set({ status: "retrying" })
      .where(eq(dlqEntriesTable.id, id));
  }

  async markResolved(id: string): Promise<void> {
    await db
      .update(dlqEntriesTable)
      .set({ status: "resolved" })
      .where(eq(dlqEntriesTable.id, id));
  }

  async markArchived(id: string): Promise<void> {
    await db
      .update(dlqEntriesTable)
      .set({ status: "archived" })
      .where(eq(dlqEntriesTable.id, id));
  }

  async getStats(workflowId?: string): Promise<{
    total: number;
    pending: number;
    retrying: number;
    resolved: number;
  }> {
    const all = await this.listEntries(workflowId);
    return {
      total: all.length,
      pending: all.filter((e) => e.status === "pending").length,
      retrying: all.filter((e) => e.status === "retrying").length,
      resolved: all.filter((e) => e.status === "resolved").length,
    };
  }
}
