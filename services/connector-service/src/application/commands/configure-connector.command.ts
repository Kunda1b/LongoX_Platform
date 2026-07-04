import { db, tenantConnectorInstallsTable } from "@longox/db";
import { eq, and } from "drizzle-orm";
import type { ConnectorRepository } from "../../domain";
import { ConnectorInstallation } from "../../domain";

export interface ConfigureConnectorInput {
  tenantId: string;
  installationId: number;
  config: Record<string, unknown>;
}

export class ConfigureConnectorCommand {
  constructor(private connectorRepo: ConnectorRepository) {}

  async execute(input: ConfigureConnectorInput): Promise<ConnectorInstallation> {
    const [row] = await db
      .update(tenantConnectorInstallsTable)
      .set({
        config: input.config,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(tenantConnectorInstallsTable.id, input.installationId),
          eq(tenantConnectorInstallsTable.tenantId, input.tenantId)
        )
      )
      .returning();

    if (!row) {
      throw new Error(`Installation ${input.installationId} not found`);
    }

    const connector = await this.connectorRepo.findById(row.connectorId);

    return new ConnectorInstallation({
      id: row.id,
      tenantId: row.tenantId,
      connectorId: row.connectorId,
      connectorName: connector?.displayName ?? connector?.name ?? "Unknown",
      environmentId: undefined,
      status: row.status as any,
      config: (row.config ?? {}) as Record<string, unknown>,
      installedBy: row.installedBy ?? 0,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
