import { db, executionCheckpointsTable } from "@longox/db";
import { eq, and } from "drizzle-orm";

export interface CheckpointData {
  executionId: string;
  nodeId: string;
  nodeName: string;
  nodeType: string;
  status: "running" | "success" | "failed";
  attemptNumber: number;
  inputData: Record<string, unknown>;
  outputData?: Record<string, unknown> | null;
  errorMessage?: string | null;
}

export class CheckpointManager {
  async saveCheckpoint(data: CheckpointData): Promise<number> {
    const [checkpoint] = await db
      .insert(executionCheckpointsTable)
      .values({
        executionId: data.executionId,
        nodeId: data.nodeId,
        nodeName: data.nodeName,
        nodeType: data.nodeType,
        status: data.status,
        attemptNumber: data.attemptNumber,
        inputData: data.inputData,
        outputData: data.outputData ?? null,
        errorMessage: data.errorMessage ?? null,
        startedAt: new Date(),
        completedAt: data.status !== "running" ? new Date() : null,
      })
      .returning();

    return checkpoint.id;
  }

  async updateCheckpoint(
    id: string,
    updates: Partial<{
      status: "running" | "success" | "failed";
      outputData: Record<string, unknown> | null;
      errorMessage: string | null;
      completedAt: Date;
      durationMs: number;
    }>,
  ): Promise<void> {
    await db
      .update(executionCheckpointsTable)
      .set(updates)
      .where(eq(executionCheckpointsTable.id, id));
  }

  async getCheckpoints(
    executionId: string,
  ): Promise<(typeof executionCheckpointsTable.$inferSelect)[]> {
    return db
      .select()
      .from(executionCheckpointsTable)
      .where(eq(executionCheckpointsTable.executionId, executionId))
      .orderBy(executionCheckpointsTable.id);
  }

  async getLatestCheckpoint(
    executionId: string,
  ): Promise<typeof executionCheckpointsTable.$inferSelect | null> {
    const [checkpoint] = await db
      .select()
      .from(executionCheckpointsTable)
      .where(eq(executionCheckpointsTable.executionId, executionId))
      .orderBy(executionCheckpointsTable.id)
      .limit(1);

    return checkpoint ?? null;
  }

  async getCompletedNodeIds(executionId: string): Promise<Set<string>> {
    const checkpoints = await db
      .select({ nodeId: executionCheckpointsTable.nodeId })
      .from(executionCheckpointsTable)
      .where(
        and(
          eq(executionCheckpointsTable.executionId, executionId),
          eq(executionCheckpointsTable.status, "success"),
        ),
      );

    return new Set(checkpoints.map((c) => c.nodeId));
  }

  async getLastOutput(
    executionId: string,
  ): Promise<Record<string, unknown> | null> {
    const [checkpoint] = await db
      .select()
      .from(executionCheckpointsTable)
      .where(
        and(
          eq(executionCheckpointsTable.executionId, executionId),
          eq(executionCheckpointsTable.status, "success"),
        ),
      )
      .orderBy(executionCheckpointsTable.id)
      .limit(1);

    return (checkpoint?.outputData ?? null) as Record<string, unknown> | null;
  }
}
