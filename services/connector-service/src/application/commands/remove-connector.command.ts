import { db, tenantConnectorInstallsTable } from "@longox/db";
import { eq, and } from "drizzle-orm";

export interface RemoveConnectorInput {
  tenantId: string;
  installationId: string;
}

export class RemoveConnectorCommand {
  async execute(input: RemoveConnectorInput): Promise<void> {
    const [row] = await db
      .delete(tenantConnectorInstallsTable)
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
  }
}
