import type { SdkConfig } from "../index.ts";

export interface ConnectorConfig extends SdkConfig {}

export interface ConnectorDefinition {
  id: string;
  name: string;
  type: string;
  version: string;
  description?: string;
  authType: "none" | "api_key" | "oauth2" | "basic" | "custom";
  actions: ConnectorAction[];
  triggers: ConnectorTrigger[];
  config: Record<string, unknown>;
}

export interface ConnectorAction {
  id: string;
  name: string;
  description?: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
}

export interface ConnectorTrigger {
  id: string;
  name: string;
  description?: string;
  event: string;
  payload: Record<string, unknown>;
}

export class ConnectorClient {
  private config: ConnectorConfig;

  constructor(config: ConnectorConfig) {
    this.config = config;
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (this.config.token) h["Authorization"] = `Bearer ${this.config.token}`;
    if (this.config.apiKey) h["X-Api-Key"] = this.config.apiKey;
    return h;
  }

  async list(): Promise<ConnectorDefinition[]> {
    const res = await fetch(`${this.config.baseUrl}/api/connectors`, {
      headers: this.headers(),
    });
    if (!res.ok) throw new Error("Failed to list connectors");
    return res.json() as Promise<ConnectorDefinition[]>;
  }

  async get(id: string): Promise<ConnectorDefinition> {
    const res = await fetch(`${this.config.baseUrl}/api/connectors/${id}`, {
      headers: this.headers(),
    });
    if (!res.ok) throw new Error(`Connector not found: ${id}`);
    return res.json() as Promise<ConnectorDefinition>;
  }

  async install(
    connectorId: string,
    config: Record<string, unknown>,
  ): Promise<{ id: string; status: string }> {
    const res = await fetch(
      `${this.config.baseUrl}/api/connectors/${connectorId}/install`,
      {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify({ config }),
      },
    );
    if (!res.ok) throw new Error("Failed to install connector");
    return res.json() as Promise<{ id: string; status: string }>;
  }

  async uninstall(installationId: string): Promise<void> {
    const res = await fetch(
      `${this.config.baseUrl}/api/connectors/installations/${installationId}`,
      {
        method: "DELETE",
        headers: this.headers(),
      },
    );
    if (!res.ok) throw new Error("Failed to uninstall connector");
  }

  async execute(
    installationId: string,
    action: string,
    input: Record<string, unknown>,
  ): Promise<unknown> {
    const res = await fetch(
      `${this.config.baseUrl}/api/connectors/installations/${installationId}/execute`,
      {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify({ action, input }),
      },
    );
    if (!res.ok) throw new Error("Connector execution failed");
    return res.json();
  }
}
