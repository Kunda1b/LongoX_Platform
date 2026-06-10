import type { Workflow } from "./workflow.entity";
import type { WorkflowStatus, TriggerType } from "./workflow.entity";

export interface WorkflowFilters {
  status?: WorkflowStatus;
  search?: string;
  triggerType?: TriggerType;
  limit?: number;
  offset?: number;
}

export interface WorkflowRepository {
  findById(id: number): Promise<Workflow | null>;
  findAll(filters?: WorkflowFilters): Promise<Workflow[]>;
  count(filters?: WorkflowFilters): Promise<number>;
  save(workflow: Workflow): Promise<Workflow>;
  create(data: Partial<Workflow>): Promise<Workflow>;
  delete(id: number): Promise<boolean>;
  getNextVersion(workflowId: number): Promise<number>;
}
