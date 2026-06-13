import {
  db,
  connectorsTable,
  connectorActionsTable,
  connectorTriggersTable,
  connectorVersionsTable,
} from "@longox/db";
import { eq } from "drizzle-orm";
import { PHASE2_CONNECTORS } from "./connector-manifests";

async function seedConnectors(): Promise<void> {
  for (const manifest of PHASE2_CONNECTORS) {
    const [existing] = await db
      .select()
      .from(connectorsTable)
      .where(eq(connectorsTable.name, manifest.name))
      .limit(1);

    let connectorId: number;

    const connectorData = {
      name: manifest.name,
      displayName: manifest.displayName,
      version: "1.0.0",
      sdkVersion: "1.0",
      category: manifest.category,
      description: manifest.description,
      icon: manifest.icon,
      color: manifest.color,
      author: manifest.author,
      authType: manifest.authType,
      authConfig: manifest.authConfig,
      certificationLevel: manifest.certificationLevel,
      capabilities: manifest.capabilities,
      isFeatured: manifest.isFeatured,
      actionCount: manifest.actions.length,
      triggerCount: manifest.triggers.length,
      status: "active" as const,
      permissions: [],
      rateLimit: { requestsPerMinute: 60, burst: 10 },
      healthStatus: {
        availability: 99.9,
        avgLatencyMs: 120,
        apiErrorRate: 0.01,
        oauthFailureRate: 0.005,
        lastChecked: new Date().toISOString(),
      },
    };

    if (existing) {
      const [updated] = await db
        .update(connectorsTable)
        .set({ ...connectorData, updatedAt: new Date() })
        .where(eq(connectorsTable.id, existing.id))
        .returning();
      connectorId = updated.id;

      await db
        .delete(connectorActionsTable)
        .where(eq(connectorActionsTable.connectorId, connectorId));
      await db
        .delete(connectorTriggersTable)
        .where(eq(connectorTriggersTable.connectorId, connectorId));
    } else {
      const [inserted] = await db
        .insert(connectorsTable)
        .values(connectorData)
        .returning();
      connectorId = inserted.id;
    }

    if (manifest.actions.length > 0) {
      await db.insert(connectorActionsTable).values(
        manifest.actions.map((action) => ({
          connectorId,
          actionId: action.actionId,
          name: action.name,
          description: action.description,
          inputSchema: action.inputSchema ?? {},
          outputSchema: action.outputSchema ?? {},
        })),
      );
    }

    if (manifest.triggers.length > 0) {
      await db.insert(connectorTriggersTable).values(
        manifest.triggers.map((trigger) => ({
          connectorId,
          triggerId: trigger.triggerId,
          triggerType: trigger.triggerType,
          name: trigger.name,
          description: trigger.description,
          config: trigger.config ?? {},
          pollingInterval: trigger.pollingInterval ?? null,
        })),
      );
    }

    const [version] = await db
      .select()
      .from(connectorVersionsTable)
      .where(eq(connectorVersionsTable.connectorId, connectorId))
      .limit(1);

    if (!version) {
      await db.insert(connectorVersionsTable).values({
        connectorId,
        semver: "1.0.0",
        manifestJson: manifest,
      });
    }
  }

  console.log(`Seeded ${PHASE2_CONNECTORS.length} marketplace connectors`);
}

seedConnectors()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Failed to seed connectors:", err);
    process.exit(1);
  });
