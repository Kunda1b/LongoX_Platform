import { eq, like, and, desc, sql } from "drizzle-orm";
import { db, workflowsTable, workflowVersionsTable } from "@longox/db";
import { Workflow } from "../../domain";
import type { WorkflowRepository, WorkflowFilters } from "../../domain";
import type { WorkflowNode, WorkflowEdge } from "../../domain";

function mapRowToWorkflow(row: typeof workflowsTable.$inferSelect): Workflow {
  const nodes = (row.nodes ?? []) as unknown as WorkflowNode[];
  return new Workflow(
    row.id,
    row.name,
    row.description ?? null,
    row.status as Workflow["status"],
    row.triggerType as Workflow["triggerType"],
    row.nodeCount,
    row.executionCount,
    nodes,
    [],
    row.lastRunAt ?? null,
    row.lastRunStatus ?? null,
    row.createdAt,
    row.updatedAt,
  );
}

export class PostgresWorkflowRepository implements WorkflowRepository {
  async findById(id: number): Promise<Workflow | null> {
    const [row] = await db
      .select()
      .from(workflowsTable)
      .where(eq(workflowsTable.id, id))
      .limit(1);
    return row ? mapRowToWorkflow(row) : null;
  }

  async findAll(filters?: WorkflowFilters): Promise<Workflow[]> {
    const conditions: ReturnType<typeof eq>[] = [];

    if (filters?.status)
      conditions.push(eq(workflowsTable.status, filters.status));
    if (filters?.search)
      conditions.push(like(workflowsTable.name, `%${filters.search}%`));
    if (filters?.triggerType)
      conditions.push(eq(workflowsTable.triggerType, filters.triggerType));

    const limit = filters?.limit ?? 50;
    const offset = filters?.offset ?? 0;

    const rows = await db
      .select()
      .from(workflowsTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(workflowsTable.updatedAt))
      .limit(limit)
      .offset(offset);

    return rows.map(mapRowToWorkflow);
  }

  async count(filters?: WorkflowFilters): Promise<number> {
    const conditions: ReturnType<typeof eq>[] = [];

    if (filters?.status)
      conditions.push(eq(workflowsTable.status, filters.status));
    if (filters?.search)
      conditions.push(like(workflowsTable.name, `%${filters.search}%`));

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(workflowsTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return count;
  }

  async save(workflow: Workflow): Promise<Workflow> {
    const [row] = await db
      .update(workflowsTable)
      .set({
        name: workflow.name,
        description: workflow.description,
        status: workflow.status,
        triggerType: workflow.triggerType,
        nodeCount: workflow.nodeCount,
        executionCount: workflow.executionCount,
        nodes:
          workflow.nodes as unknown as typeof workflowsTable.$inferInsert.nodes,
        lastRunAt: workflow.lastRunAt,
        lastRunStatus: workflow.lastRunStatus,
        updatedAt: workflow.updatedAt,
      })
      .where(eq(workflowsTable.id, workflow.id))
      .returning();

    return mapRowToWorkflow(row);
  }

  async create(data: Partial<Workflow>): Promise<Workflow> {
    const [row] = await db
      .insert(workflowsTable)
      .values({
        name: data.name ?? "Untitled Workflow",
        description: data.description ?? null,
        status: (data.status ??
          "draft") as typeof workflowsTable.$inferInsert.status,
        triggerType: (data.triggerType ??
          "manual") as typeof workflowsTable.$inferInsert.triggerType,
        nodeCount: data.nodeCount ?? 0,
        executionCount: 0,
        nodes: (data.nodes ??
          []) as unknown as typeof workflowsTable.$inferInsert.nodes,
      } as any)
      .returning();

    return mapRowToWorkflow(row);
  }

  async delete(id: number): Promise<boolean> {
    const [row] = await db
      .delete(workflowsTable)
      .where(eq(workflowsTable.id, id))
      .returning({ id: workflowsTable.id });
    return !!row;
  }

  async getNextVersion(workflowId: number): Promise<number> {
    const [existing] = await db
      .select({ version: workflowVersionsTable.version })
      .from(workflowVersionsTable)
      .where(eq(workflowVersionsTable.workflowId, workflowId))
      .orderBy(desc(workflowVersionsTable.version))
      .limit(1);

    return (existing?.version ?? 0) + 1;
  }
}
