export interface ConnectorDefinition {
  name: string;
  version: string;
  auth: AuthMethod[];
  actions: ActionDefinition[];
  triggers: TriggerDefinition[];
  permissions: string[];
}

export type AuthMethod = "oauth2" | "api_key" | "basic" | "none";

export interface AuthConfig {
  type: AuthMethod;
  credentials: Record<string, unknown>;
}

export interface ActionDefinition {
  id: string;
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  idempotent: boolean;
}

export interface TriggerDefinition {
  id: string;
  name: string;
  description: string;
  type: "webhook" | "polling" | "event";
  outputSchema: Record<string, unknown>;
}

export interface ActionContext {
  connectorName: string;
  actionId: string;
  config: Record<string, unknown>;
  auth: AuthConfig;
  input: Record<string, unknown>;
  tenantId: number;
}

export interface ActionResult {
  success: boolean;
  data: Record<string, unknown>;
  error: string | null;
  durationMs: number;
}

export interface TriggerContext {
  connectorName: string;
  triggerId: string;
  config: Record<string, unknown>;
  auth: AuthConfig;
  tenantId: number;
}

export interface TriggerEvent {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  timestamp: string;
}
