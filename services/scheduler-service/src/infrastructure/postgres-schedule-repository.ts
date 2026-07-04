import { eq, and, gte, lte, sql, desc } from "drizzle-orm";
import { db, schedulesTable } from "@longox/db";
import { Schedule } from "../domain/schedule.entity";
import type { ScheduleRepository } from "../domain/schedule-repository";
import type { ScheduleProps, ScheduleStatus } from "../domain/schedule.entity";

export class PostgresScheduleRepository implements ScheduleRepository {
  private toDomain(row: typeof schedulesTable.$inferSelect): Schedule {
    return new Schedule({
      id: row.id,
      tenantId: row.tenantId ?? 0,
      workflowId: row.workflowId ?? 0,
      name: row.name,
      description: row.description ?? undefined,
      interval: row.interval as ScheduleProps["interval"],
      cronExpression: row.cronExpression ?? undefined,
      timezone: row.timezone,
      startAt: row.startAt,
      endAt: row.endAt ?? undefined,
      status: row.status as ScheduleStatus,
      lastRunAt: row.lastRunAt ?? undefined,
      nextRunAt: row.nextRunAt ?? undefined,
      maxRuns: row.maxRuns ?? undefined,
      runCount: row.runCount,
      retryOnFailure: row.retryOnFailure,
      maxRetries: row.maxRetries,
      metadata: (row.metadata ?? {}) as Record<string, unknown>,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async findById(id: string): Promise<Schedule | null> {
    const [row] = await db
      .select()
      .from(schedulesTable)
      .where(eq(schedulesTable.id, id))
      .limit(1);
    return row ? this.toDomain(row) : null;
  }

  async findByTenantId(tenantId: string): Promise<Schedule[]> {
    const rows = await db
      .select()
      .from(schedulesTable)
      .where(eq(schedulesTable.tenantId, tenantId))
      .orderBy(desc(schedulesTable.createdAt));
    return rows.map(this.toDomain);
  }

  async findByWorkflowId(workflowId: string): Promise<Schedule[]> {
    const rows = await db
      .select()
      .from(schedulesTable)
      .where(eq(schedulesTable.workflowId, workflowId))
      .orderBy(desc(schedulesTable.createdAt));
    return rows.map(this.toDomain);
  }

  async findDueSchedules(now: Date): Promise<Schedule[]> {
    const rows = await db
      .select()
      .from(schedulesTable)
      .where(
        and(
          eq(schedulesTable.status, "active"),
          lte(schedulesTable.nextRunAt, now),
          sql`(${schedulesTable.endAt} IS NULL OR ${schedulesTable.endAt} >= ${now})`,
        ),
      )
      .orderBy(schedulesTable.nextRunAt);
    return rows.map(this.toDomain);
  }

  async findActive(): Promise<Schedule[]> {
    const rows = await db
      .select()
      .from(schedulesTable)
      .where(eq(schedulesTable.status, "active"))
      .orderBy(schedulesTable.nextRunAt);
    return rows.map(this.toDomain);
  }

  async create(
    props: Omit<ScheduleProps, "id" | "createdAt" | "updatedAt">,
  ): Promise<Schedule> {
    const [row] = await db
      .insert(schedulesTable)
      .values({
        tenantId: props.tenantId,
        workflowId: props.workflowId,
        name: props.name,
        description: props.description,
        interval: props.interval,
        cronExpression: props.cronExpression,
        timezone: props.timezone,
        startAt: props.startAt,
        endAt: props.endAt,
        status: props.status,
        lastRunAt: props.lastRunAt,
        nextRunAt: props.nextRunAt,
        maxRuns: props.maxRuns,
        runCount: props.runCount,
        retryOnFailure: props.retryOnFailure,
        maxRetries: props.maxRetries,
        metadata: props.metadata,
      })
      .returning();
    return this.toDomain(row);
  }

  async update(id: string, data: Partial<ScheduleProps>): Promise<Schedule> {
    const [row] = await db
      .update(schedulesTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schedulesTable.id, id))
      .returning();
    return this.toDomain(row);
  }

  async delete(id: string): Promise<void> {
    await db.delete(schedulesTable).where(eq(schedulesTable.id, id));
  }

  async countByTenantId(tenantId: string): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schedulesTable)
      .where(eq(schedulesTable.tenantId, tenantId));
    return result.count;
  }

  async countByStatus(status: ScheduleStatus): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schedulesTable)
      .where(eq(schedulesTable.status, status));
    return result.count;
  }
}
