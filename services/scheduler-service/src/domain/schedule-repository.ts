import type { Schedule, ScheduleProps, ScheduleStatus } from "./schedule.entity";

export interface ScheduleRepository {
  findById(id: number): Promise<Schedule | null>;
  findByTenantId(tenantId: number): Promise<Schedule[]>;
  findByWorkflowId(workflowId: number): Promise<Schedule[]>;
  findDueSchedules(now: Date): Promise<Schedule[]>;
  findActive(): Promise<Schedule[]>;
  create(props: Omit<ScheduleProps, "id" | "createdAt" | "updatedAt">): Promise<Schedule>;
  update(id: number, data: Partial<ScheduleProps>): Promise<Schedule>;
  delete(id: number): Promise<void>;
  countByTenantId(tenantId: number): Promise<number>;
  countByStatus(status: ScheduleStatus): Promise<number>;
}
