import type {
  Schedule,
  ScheduleProps,
  ScheduleStatus,
} from "./schedule.entity";

export interface ScheduleRepository {
  findById(id: string): Promise<Schedule | null>;
  findByTenantId(tenantId: string): Promise<Schedule[]>;
  findByWorkflowId(workflowId: string): Promise<Schedule[]>;
  findDueSchedules(now: Date): Promise<Schedule[]>;
  findActive(): Promise<Schedule[]>;
  create(
    props: Omit<ScheduleProps, "id" | "createdAt" | "updatedAt">,
  ): Promise<Schedule>;
  update(id: string, data: Partial<ScheduleProps>): Promise<Schedule>;
  delete(id: string): Promise<void>;
  countByTenantId(tenantId: string): Promise<string>;
  countByStatus(status: ScheduleStatus): Promise<string>;
}
