/**
 * Configure connector command.
 *
 * Migrated from Drizzle to Prisma per ADR-013 Phase 3.
 * Uses `prisma.tenantConnectorInstall` delegate with `as any` casts for
 * legacy columns.
 */

import { prisma } from "@longox/db/prisma";
import type { ConnectorRepository } from "../../domain";
import { ConnectorInstallation } from "../../domain";

export interface ConfigureConnectorInput {
  tenantId: string;
  installationId: string;
  config: Record<string, unknown>;
}

export class ConfigureConnectorCommand {
  constructor(private connectorRepo: ConnectorRepository) {}

  async execute(input: ConfigureConnectorInput): Promise<ConnectorInstallation> {
    let row: any;
    try {
      row = await prisma.tenantConnectorInstall.update({
        where: {
          id: input.installationId,
          tenantId: input.tenantId,
        } as any,
        data: {
          config: input.config,
          updatedAt: new Date(),
        } as any,
      });
    } catch {
      row = null;
    }

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
      installedBy: row.installedBy ?? "",
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
