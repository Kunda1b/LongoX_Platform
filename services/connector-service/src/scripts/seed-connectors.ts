/**
 * Connector seed script.
 *
 * Migrated from Drizzle to Prisma per ADR-013 Phase 3.
 * Uses `prisma.connector`, `prisma.connectorAction`, `prisma.connectorTrigger`,
 * and `prisma.connectorVersion` delegates with `as any` casts for legacy
 * columns not reflected on the Prisma models.
 */

import { prisma } from "@longox/db/prisma";
import { PHASE2_CONNECTORS } from "./connector-manifests";

async function seedConnectors(): Promise<void> {
  for (const manifest of PHASE2_CONNECTORS) {
    const existing = await prisma.connector.findFirst({
      where: { name: manifest.name } as any,
    });

    let connectorId: string;

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
      const updated = await prisma.connector.update({
        where: { id: existing.id },
        data: { ...connectorData, updatedAt: new Date() } as any,
      });
      connectorId = updated.id;

      await prisma.connectorAction.deleteMany({
        where: { connectorId } as any,
      });
      await prisma.connectorTrigger.deleteMany({
        where: { connectorId } as any,
      });
    } else {
      const inserted = await prisma.connector.create({
        data: connectorData as any,
      });
      connectorId = inserted.id;
    }

    if (manifest.actions.length > 0) {
      await prisma.connectorAction.createMany({
        data: manifest.actions.map((action) => ({
          connectorId,
          actionId: action.actionId,
          name: action.name,
          description: action.description,
          inputSchema: action.inputSchema ?? {},
          outputSchema: action.outputSchema ?? {},
        })) as any,
      });
    }

    if (manifest.triggers.length > 0) {
      await prisma.connectorTrigger.createMany({
        data: manifest.triggers.map((trigger) => ({
          connectorId,
          triggerId: trigger.triggerId,
          triggerType: trigger.triggerType,
          name: trigger.name,
          description: trigger.description,
          config: trigger.config ?? {},
          pollingInterval: trigger.pollingInterval ?? null,
        })) as any,
      });
    }

    const version = await prisma.connectorVersion.findFirst({
      where: { connectorId } as any,
    });

    if (!version) {
      await prisma.connectorVersion.create({
        data: {
          connectorId,
          semver: "1.0.0",
          manifestJson: manifest as any,
        } as any,
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
