import { z } from "zod";

export const createExecutionSchema = z.object({
  workflowId: z.number().int().positive(),
  input: z.record(z.unknown()).optional(),
  environmentId: z.number().int().positive().optional(),
});

export const cancelExecutionSchema = z.object({
  reason: z.string().max(1000).optional(),
});

export const retryExecutionSchema = z.object({
  fromNodeId: z.string().optional(),
  resetCompletedNodes: z.boolean().optional(),
});
