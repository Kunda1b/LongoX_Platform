export type AuthType = "oauth2" | "api_key" | "basic" | "none";

export interface ConnectorManifest {
  name: string;
  version: string;
  auth: AuthType[];
  actions: ConnectorActionDefinition[];
  triggers: ConnectorTriggerDefinition[];
  permissions: string[];
}

export interface ConnectorActionDefinition {
  id: string;
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  idempotent: boolean;
}

export interface ConnectorTriggerDefinition {
  id: string;
  name: string;
  description: string;
  type: "webhook" | "polling" | "event";
  outputSchema: Record<string, unknown>;
}

export interface ConnectorInstallation {
  id: number;
  connectorId: number;
  tenantId: number;
  config: Record<string, unknown>;
  authType: AuthType;
  status: "installed" | "active" | "error" | "retired";
  createdAt: string;
}
