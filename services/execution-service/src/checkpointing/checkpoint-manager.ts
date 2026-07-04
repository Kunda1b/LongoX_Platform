import { prisma } from "@longox/db/prisma";

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
  async saveCheckpoint(data: CheckpointData): Promise<string> {
    const checkpoint = await prisma.nodeExecutionCheckpoint.create({
      data: {
        executionId: data.executionId,
        nodeId: data.nodeId,
        attempt: data.attemptNumber,
        stateJson: {
          nodeName: data.nodeName,
          nodeType: data.nodeType,
          status: data.status,
          attemptNumber: data.attemptNumber,
          inputData: data.inputData,
          outputData: data.outputData ?? null,
          errorMessage: data.errorMessage ?? null,
          startedAt: new Date(),
          completedAt: data.status !== "running" ? new Date() : null,
        } as any,
      } as any,
    });

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
    // Prisma's NodeExecutionCheckpoint stores all per-node state inside
    // stateJson (Drizzle compat). We update the JSON patch in a single
    // upsert-like read/modify/write.
    const existing = await prisma.nodeExecutionCheckpoint.findUnique({
      where: { id },
    });
    const currentState = (existing?.stateJson ?? {}) as Record<string, unknown>;

    const patch: Record<string, unknown> = {};
    if (updates.status !== undefined) patch.status = updates.status;
    if (updates.outputData !== undefined) patch.outputData = updates.outputData;
    if (updates.errorMessage !== undefined) patch.errorMessage = updates.errorMessage;
    if (updates.completedAt !== undefined) patch.completedAt = updates.completedAt;
    if (updates.durationMs !== undefined) patch.durationMs = updates.durationMs;

    await prisma.nodeExecutionCheckpoint.update({
      where: { id },
      data: {
        stateJson: { ...currentState, ...patch } as any,
      } as any,
    });
  }

  async getCheckpoints(executionId: string): Promise<any[]> {
    return prisma.nodeExecutionCheckpoint.findMany({
      where: { executionId },
      orderBy: { id: "asc" },
    });
  }

  async getLatestCheckpoint(executionId: string): Promise<any | null> {
    const checkpoint = await prisma.nodeExecutionCheckpoint.findFirst({
      where: { executionId },
      orderBy: { id: "asc" },
    });

    return checkpoint ?? null;
  }

  async getCompletedNodeIds(executionId: string): Promise<Set<string>> {
    const checkpoints = await prisma.nodeExecutionCheckpoint.findMany({
      where: { executionId },
      select: { nodeId: true, stateJson: true } as any,
    });

    return new Set(
      checkpoints
        .filter((c: any) => (c.stateJson as any)?.status === "success")
        .map((c) => c.nodeId),
    );
  }

  async getLastOutput(
    executionId: string,
  ): Promise<Record<string, unknown> | null> {
    const checkpoint = await prisma.nodeExecutionCheckpoint.findFirst({
      where: { executionId } as any,
      orderBy: { id: "asc" },
    });

    return ((checkpoint?.stateJson as any)?.outputData ?? null) as
      | Record<string, unknown>
      | null;
  }
}
