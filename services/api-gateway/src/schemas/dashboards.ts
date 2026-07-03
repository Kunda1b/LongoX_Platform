import { z } from "zod";

export const createDashboardSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  layout: z.array(z.object({
    widgetId: z.string(),
    x: z.number().int().min(0),
    y: z.number().int().min(0),
    w: z.number().int().min(1).max(12),
    h: z.number().int().min(1),
  })).optional(),
});

export const updateDashboardSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional(),
  layout: z.array(z.object({
    widgetId: z.string(),
    x: z.number().int().min(0),
    y: z.number().int().min(0),
    w: z.number().int().min(1).max(12),
    h: z.number().int().min(1),
  })).optional(),
});
