import { db, tenantConnectorInstallsTable } from "@longox/db";
import { eq, and } from "drizzle-orm";
import type { ConnectorRepository } from "../../domain";
import { ConnectorInstallation } from "../../domain";

export interface UpgradeConnectorInput {
  tenantId: string;
  installationId: string;
  newVersionId: string;
}

export class UpgradeConnectorCommand {
  constructor(private connectorRepo: ConnectorRepository) {}

  async execute(input: UpgradeConnectorInput): Promise<ConnectorInstallation> {
    const [row] = await db
      .update(tenantConnectorInstallsTable)
      .set({
        connectorVersionId: input.newVersionId,
        updatedAt: new Date(),
      } as any)
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
      installedBy: String(row.installedBy ?? ""),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
