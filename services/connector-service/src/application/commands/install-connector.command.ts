import { db, tenantConnectorInstallsTable } from "@longox/db";
import type { ConnectorRepository } from "../../domain";
import { ConnectorInstallation } from "../../domain";

export interface InstallConnectorInput {
  tenantId: number;
  connectorId: number;
  connectorVersionId?: number;
  config: Record<string, unknown>;
  installedBy: number;
}

export class InstallConnectorCommand {
  constructor(private connectorRepo: ConnectorRepository) {}

  async execute(input: InstallConnectorInput): Promise<ConnectorInstallation> {
    const connector = await this.connectorRepo.findById(input.connectorId);
    if (!connector) {
      throw new Error(`Connector with id ${input.connectorId} not found`);
    }
    if (connector.status === "disabled") {
      throw new Error(
        `Connector "${connector.name}" is disabled and cannot be installed`,
      );
    }

    const [row] = await db
      .insert(tenantConnectorInstallsTable)
      .values({
        tenantId: input.tenantId,
        connectorId: input.connectorId,
        connectorVersionId: input.connectorVersionId ?? null,
        status: "active",
        config: input.config,
        installedBy: input.installedBy,
      })
      .returning();

    return new ConnectorInstallation({
      id: row.id,
      tenantId: row.tenantId,
      connectorId: row.connectorId,
      connectorName: connector.displayName ?? connector.name,
      environmentId: undefined,
      status: row.status as "installing" | "active" | "error" | "removed",
      config: (row.config ?? {}) as Record<string, unknown>,
      installedBy: row.installedBy ?? input.installedBy,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
