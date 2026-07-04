/**
 * Prisma-based workflow repository.
 *
 * Migrated from Drizzle to Prisma per ADR-013 Phase 3.
 * Uses `prisma.workflow` and `prisma.workflowVersion` delegates.
 */

import { prisma } from "@longox/db/prisma";
import { Workflow } from "../../domain";
import type { WorkflowRepository, WorkflowFilters } from "../../domain";
import type { WorkflowNode } from "../../domain";

export class PostgresWorkflowRepository implements WorkflowRepository {
  async findById(id: string): Promise<Workflow | null> {
    const row = await prisma.workflow.findUnique({ where: { id } });
    return row ? this.mapRowToWorkflow(row) : null;
  }

  async findAll(filters?: WorkflowFilters): Promise<Workflow[]> {
    const where: Record<string, unknown> = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.search)
      where.name = { contains: filters.search, mode: "insensitive" };
    if (filters?.triggerType) where.triggerType = filters.triggerType;

    const rows = await prisma.workflow.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: filters?.limit ?? 50,
      skip: filters?.offset ?? 0,
    });
    return rows.map((r) => this.mapRowToWorkflow(r));
  }

  async count(filters?: WorkflowFilters): Promise<number> {
    const where: Record<string, unknown> = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.search)
      where.name = { contains: filters.search, mode: "insensitive" };
    return prisma.workflow.count({ where });
  }

  async save(workflow: Workflow): Promise<Workflow> {
    const row = await prisma.workflow.update({
      where: { id: workflow.id },
      data: {
        name: workflow.name,
        description: workflow.description,
        status: workflow.status,
        triggerType: workflow.triggerType,
        nodeCount: workflow.nodeCount,
        executionCount: workflow.executionCount,
        lastRunAt: workflow.lastRunAt,
        lastRunStatus: workflow.lastRunStatus,
        updatedAt: workflow.updatedAt,
      } as any,
    });
    return this.mapRowToWorkflow(row);
  }

  async create(data: Partial<Workflow>): Promise<Workflow> {
    const row = await prisma.workflow.create({
      data: {
        name: data.name ?? "Untitled Workflow",
        description: data.description ?? null,
        status: (data.status ?? "draft") as string,
        triggerType: (data.triggerType ?? "manual") as string,
        nodeCount: data.nodeCount ?? 0,
        executionCount: 0,
        tags: [],
      } as any,
    });
    return this.mapRowToWorkflow(row);
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.workflow.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  async getNextVersion(workflowId: string): Promise<number> {
    const latest = await prisma.workflowVersion.findFirst({
      where: { workflowId },
      orderBy: { versionNumber: "desc" },
      select: { versionNumber: true },
    });
    return (latest?.versionNumber ?? 0) + 1;
  }

  private mapRowToWorkflow(row: any): Workflow {
    const nodes = (row.nodes ?? []) as unknown as WorkflowNode[];
    return new Workflow(
      row.id,
      row.name,
      row.description ?? null,
      row.status as Workflow["status"],
      row.triggerType as Workflow["triggerType"],
      row.nodeCount ?? 0,
      row.executionCount ?? 0,
      nodes,
      [],
      row.lastRunAt ?? null,
      row.lastRunStatus ?? null,
      row.createdAt,
      row.updatedAt,
    );
  }
}
