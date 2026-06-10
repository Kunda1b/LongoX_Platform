import type { TriggerType } from "../../domain";

export interface CreateWorkflowCommand {
  name: string;
  description?: string;
  triggerType: TriggerType;
}
