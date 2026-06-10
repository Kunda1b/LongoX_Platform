import type { WorkflowStatus, TriggerType } from "../../domain";

export interface ListWorkflowsQuery {
  status?: WorkflowStatus;
  search?: string;
  triggerType?: TriggerType;
  limit?: number;
  offset?: number;
}
