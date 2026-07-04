/**
 * Prisma-based schedule repository.
 *
 * Migrated from Drizzle to Prisma per ADR-013 Phase 3.
 * Uses `prisma.schedule` delegate with `as any` casts for legacy columns.
 */

import { prisma } from "@longox/db/prisma";
import { Schedule } from "../domain/schedule.entity";
import type { ScheduleRepository } from "../domain/schedule-repository";
import type { ScheduleProps, ScheduleStatus } from "../domain/schedule.entity";

export class PostgresScheduleRepository implements ScheduleRepository {
  private toDomain(row: any): Schedule {
    return new Schedule({
      id: row.id,
      tenantId: row.tenantId ?? "",
      workflowId: row.workflowId ?? "",
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
    const row = await prisma.schedule.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findByTenantId(tenantId: string): Promise<Schedule[]> {
    const rows = await prisma.schedule.findMany({
      where: { tenantId } as any,
      orderBy: { createdAt: "desc" },
    });
    return rows.map((r: any) => this.toDomain(r));
  }

  async findByWorkflowId(workflowId: string): Promise<Schedule[]> {
    const rows = await prisma.schedule.findMany({
      where: { workflowId } as any,
      orderBy: { createdAt: "desc" },
    });
    return rows.map((r: any) => this.toDomain(r));
  }

  async findDueSchedules(now: Date): Promise<Schedule[]> {
    const rows = await prisma.schedule.findMany({
      where: {
        status: "active",
        nextRunAt: { lte: now },
        OR: [{ endAt: null }, { endAt: { gte: now } }],
      } as any,
      orderBy: { nextRunAt: "asc" } as any,
    });
    return rows.map((r: any) => this.toDomain(r));
  }

  async findActive(): Promise<Schedule[]> {
    const rows = await prisma.schedule.findMany({
      where: { status: "active" } as any,
      orderBy: { nextRunAt: "asc" } as any,
    });
    return rows.map((r: any) => this.toDomain(r));
  }

  async create(
    props: Omit<ScheduleProps, "id" | "createdAt" | "updatedAt">,
  ): Promise<Schedule> {
    const row = await prisma.schedule.create({
      data: {
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
      } as any,
    });
    return this.toDomain(row);
  }

  async update(id: string, data: Partial<ScheduleProps>): Promise<Schedule> {
    const row = await prisma.schedule.update({
      where: { id },
      data: { ...data, updatedAt: new Date() } as any,
    });
    return this.toDomain(row);
  }

  async delete(id: string): Promise<void> {
    await prisma.schedule.delete({ where: { id } });
  }

  async countByTenantId(tenantId: string): Promise<number> {
    return prisma.schedule.count({ where: { tenantId } });
  }

  async countByStatus(status: ScheduleStatus): Promise<number> {
    return prisma.schedule.count({ where: { status } as any });
  }
}
