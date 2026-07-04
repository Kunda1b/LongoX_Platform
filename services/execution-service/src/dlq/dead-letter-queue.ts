import { prisma } from "@longox/db/prisma";

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
    const inserted = await prisma.deadLetterQueue.create({
      data: {
        executionId: entry.executionId,
        nodeId: entry.nodeId,
        reason: entry.errorMessage,
        payloadJson: {
          workflowId: entry.workflowId,
          workflowName: entry.workflowName,
          nodeName: entry.nodeName,
          nodeType: entry.nodeType,
          errorMessage: entry.errorMessage,
          attempts: entry.attempts,
          jobData: entry.jobData,
        } as any,
      } as any,
    });
    return inserted.id;
  }

  async listEntries(
    workflowId?: string,
    status?: string,
    limit: number = 50,
  ): Promise<any[]> {
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    // workflowId is stored inside payloadJson (Drizzle compat) — when a
    // workflowId filter is supplied we fall back to filtering in-memory.
    const rows = await prisma.deadLetterQueue.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    if (!workflowId) return rows;
    return rows.filter((r: any) =>
      r.payloadJson?.workflowId === workflowId ||
      (r as any).workflowId === workflowId,
    );
  }

  async getEntry(id: string): Promise<any | null> {
    const entry = await prisma.deadLetterQueue.findUnique({ where: { id } });
    return entry ?? null;
  }

  async markRetrying(id: string): Promise<void> {
    await prisma.deadLetterQueue.update({
      where: { id },
      data: { status: "retrying" } as any,
    });
  }

  async markResolved(id: string): Promise<void> {
    await prisma.deadLetterQueue.update({
      where: { id },
      data: { status: "resolved" } as any,
    });
  }

  async markArchived(id: string): Promise<void> {
    await prisma.deadLetterQueue.update({
      where: { id },
      data: { status: "archived" } as any,
    });
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
