import type { ConnectorRepository } from "../../domain";
import type { ConnectorInstallation } from "../../domain";

export interface InstallConnectorInput {
  tenantId: number;
  connectorId: number;
  environmentId?: number;
  config: Record<string, unknown>;
  installedBy: number;
}

export class InstallConnectorCommand {
  constructor(
    private connectorRepo: ConnectorRepository,
    private installationRepo: import("../../domain/connector-repository").ConnectorRepository,
  ) {}

  async execute(input: InstallConnectorInput): Promise<ConnectorInstallation> {
    const connector = await this.connectorRepo.findById(input.connectorId);
    if (!connector) {
      throw new Error(`Connector with id ${input.connectorId} not found`);
    }
    if (connector.status === "disabled") {
      throw new Error(`Connector "${connector.name}" is disabled and cannot be installed`);
    }

    return {} as ConnectorInstallation;
  }
}
