import { z } from "zod";

export const createWorkflowSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  nodes: z.array(z.record(z.unknown())).optional(),
  edges: z.array(z.object({ source: z.string(), target: z.string() })).optional(),
});

export const updateWorkflowSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional(),
  nodes: z.array(z.record(z.unknown())).optional(),
  edges: z.array(z.object({ source: z.string(), target: z.string() })).optional(),
});

export const publishWorkflowSchema = z.object({
  version: z.number().int().positive(),
  changeNote: z.string().max(2000).optional(),
});
