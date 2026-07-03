import { z } from "zod";

export const createPromptSchema = z.object({
  name: z.string().min(1).max(255),
  model: z.string().min(1),
  template: z.string().min(1),
  variables: z.array(z.string()).optional(),
  config: z.record(z.unknown()).optional(),
});

export const updatePromptSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  model: z.string().optional(),
  template: z.string().optional(),
  variables: z.array(z.string()).optional(),
  config: z.record(z.unknown()).optional(),
});

export const createDatasetSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  entries: z.array(z.object({
    input: z.record(z.unknown()),
    expectedOutput: z.unknown(),
  })).min(1),
});

export const runEvaluationSchema = z.object({
  promptId: z.number().int().positive(),
  datasetId: z.number().int().positive(),
  model: z.string().optional(),
  threshold: z.number().min(0).max(1).optional(),
});
