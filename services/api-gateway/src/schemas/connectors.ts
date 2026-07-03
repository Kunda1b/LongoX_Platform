import { z } from "zod";

export const installConnectorSchema = z.object({
  connectorTypeId: z.string().min(1),
  displayName: z.string().min(1).max(255),
  config: z.record(z.unknown()),
  credentials: z.record(z.unknown()).optional(),
});

export const configureConnectorSchema = z.object({
  config: z.record(z.unknown()),
  credentials: z.record(z.unknown()).optional(),
});
