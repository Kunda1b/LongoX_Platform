import { z } from "zod";

// ─── Shared param schemas ─────────────────────────────────────────────────────

const IdParams = z.object({ id: z.string() });

// ─── Workflows ────────────────────────────────────────────────────────────────

export const ListWorkflowsQueryParams = z.object({
  status: z.string().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().positive().optional(),
  offset: z.coerce.number().int().min(0).optional(),
});
export type ListWorkflowsQueryParams = z.infer<typeof ListWorkflowsQueryParams>;

export const CreateWorkflowBody = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  triggerType: z.string().optional().default("manual"),
  nodes: z.array(z.any()).optional(),
  region: z.string().optional(),
  deploymentZone: z.string().optional(),
  tenantId: z.string().optional(),
});
export type CreateWorkflowBody = z.infer<typeof CreateWorkflowBody>;

export const GetWorkflowParams = IdParams;
export type GetWorkflowParams = z.infer<typeof GetWorkflowParams>;

export const UpdateWorkflowParams = IdParams;
export type UpdateWorkflowParams = z.infer<typeof UpdateWorkflowParams>;

export const UpdateWorkflowBody = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.string().optional(),
  triggerType: z.string().optional(),
  nodes: z.array(z.any()).optional(),
  region: z.string().optional(),
  deploymentZone: z.string().optional(),
});
export type UpdateWorkflowBody = z.infer<typeof UpdateWorkflowBody>;

export const DeleteWorkflowParams = IdParams;
export type DeleteWorkflowParams = z.infer<typeof DeleteWorkflowParams>;

export const ToggleWorkflowParams = IdParams;
export type ToggleWorkflowParams = z.infer<typeof ToggleWorkflowParams>;

export const RunWorkflowParams = IdParams;
export type RunWorkflowParams = z.infer<typeof RunWorkflowParams>;

// ─── Executions ───────────────────────────────────────────────────────────────

export const ListExecutionsQueryParams = z.object({
  workflowId: z.string().optional(),
  status: z.string().optional(),
  limit: z.coerce.number().int().positive().optional(),
  offset: z.coerce.number().int().min(0).optional(),
});
export type ListExecutionsQueryParams = z.infer<
  typeof ListExecutionsQueryParams
>;

export const GetExecutionParams = IdParams;
export type GetExecutionParams = z.infer<typeof GetExecutionParams>;

// ─── Dashboard ────────────────────────────────────────────────────────────────

export const GetRecentActivityQueryParams = z.object({
  limit: z.coerce.number().int().positive().optional(),
});
export type GetRecentActivityQueryParams = z.infer<
  typeof GetRecentActivityQueryParams
>;
