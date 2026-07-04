/**
 * Remove connector command.
 *
 * Migrated from Drizzle to Prisma per ADR-013 Phase 3.
 * Uses `prisma.tenantConnectorInstall` delegate with `as any` casts for
 * the legacy composite (tenantId, id) lookup.
 */

import { prisma } from "@longox/db/prisma";

export interface RemoveConnectorInput {
  tenantId: string;
  installationId: string;
}

export class RemoveConnectorCommand {
  async execute(input: RemoveConnectorInput): Promise<void> {
    let row: any;
    try {
      row = await prisma.tenantConnectorInstall.delete({
        where: {
          id: input.installationId,
          tenantId: input.tenantId,
        } as any,
      });
    } catch {
      row = null;
    }

    if (!row) {
      throw new Error(`Installation ${input.installationId} not found`);
    }
  }
}
