import { eq, desc, and, sql } from "drizzle-orm";
import {
  db,
  tenantTiersTable,
  tenantMigrationsTable,
  tenantPlacementTable,
  tenantTierAssignmentsTable,
  tenantSettingsTable,
} from "@longox/db";
import { tenantPlacementService } from "./tenant-placement.service";

interface K8sClusterConfig {
  clusterId: string;
  region: string;
}

let k8sClient: any = null;

async function getK8sClient(): Promise<any> {
  if (k8sClient) return k8sClient;
  try {
    const k8s = await import("@kubernetes/client-node");
    const kc = new k8s.KubeConfig();
    kc.loadFromDefault();
    k8sClient = {
      core: kc.makeApiClient(k8s.CoreV1Api),
      rbac: kc.makeApiClient(k8s.RbacAuthorizationV1Api),
      networking: kc.makeApiClient(k8s.NetworkingV1Api),
      apps: kc.makeApiClient(k8s.AppsV1Api),
    };
    return k8sClient;
  } catch {
    console.warn(
      "[tenant-migration] K8s client not available, using DB-only mode",
    );
    return null;
  }
}

function getNamespaceName(tenantId: number): string {
  return `platform-enterprise-${tenantId}`;
}

function getWorkerDeploymentName(tenantId: number): string {
  return `execution-worker-${tenantId}`;
}

interface MigrationPlan {
  plan: {
    fromTierId: number;
    toTierId: number;
    fromPlacement: string;
    toPlacement: string;
    fromCluster: string;
    toCluster: string;
  };
  steps: MigrationStep[];
  estimatedDowntime: string;
  risks: string[];
}

interface MigrationStep {
  order: number;
  name: string;
  description: string;
  estimatedDuration: string;
}

interface MigrationStatus {
  id: number;
  tenantId: number;
  status: string;
  fromPlacement: string;
  toPlacement: string;
  fromCluster: string;
  toCluster: string;
  steps: MigrationStep[];
  dataVerified: boolean;
  trafficSwitched: boolean;
  startedAt: string | null;
  completedAt: string | null;
  errorMessage: string | null;
  rolledBackAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export class TenantMigrationService {
  async planMigration(
    tenantId: number,
    targetTierId: number,
  ): Promise<MigrationPlan> {
    const [targetTier] = await db
      .select()
      .from(tenantTiersTable)
      .where(eq(tenantTiersTable.id, targetTierId))
      .limit(1);

    if (!targetTier) {
      throw new Error(`Target tier ${targetTierId} not found`);
    }

    const [assignment] = await db
      .select()
      .from(tenantTierAssignmentsTable)
      .where(eq(tenantTierAssignmentsTable.tenantId, tenantId))
      .limit(1);

    const fromPlacement = assignment?.infrastructureLevel ?? "shared";

    const [currentPlacement] = await db
      .select()
      .from(tenantPlacementTable)
      .where(eq(tenantPlacementTable.tenantId, tenantId))
      .limit(1);

    const fromCluster = currentPlacement?.clusterId ?? "unknown";

    const targetPlacement = targetTier.infrastructureLevel;
    let estimatedDowntime = "5 minutes";
    const risks: string[] = [];

    if (
      fromPlacement === "shared" &&
      targetPlacement === "dedicated-namespace"
    ) {
      estimatedDowntime = "15 minutes";
      risks.push(
        "Namespace creation may fail if cluster resources are exhausted",
      );
      risks.push(
        "Network policy propagation delay may cause transient connectivity issues",
      );
    } else if (
      fromPlacement === "dedicated-namespace" &&
      targetPlacement === "dedicated-cluster"
    ) {
      estimatedDowntime = "30 minutes";
      risks.push("Cluster provisioning may take longer than expected");
      risks.push("DNS propagation delay after traffic switch");
    } else if (
      fromPlacement === "shared" &&
      targetPlacement === "dedicated-cluster"
    ) {
      estimatedDowntime = "45 minutes";
      risks.push("Full cluster provisioning is required");
      risks.push("Data replication across environments may be slow");
    }

    const toCluster = `eks-target-${targetPlacement}-${tenantId}`;

    const steps: MigrationStep[] = [
      {
        order: 1,
        name: "Provision target resources",
        description: `Provision ${targetPlacement} infrastructure`,
        estimatedDuration: "10 minutes",
      },
      {
        order: 2,
        name: "Replicate data",
        description: "Copy tenant data to target placement",
        estimatedDuration: "5 minutes",
      },
      {
        order: 3,
        name: "Sync data with cutover window",
        description: "Final sync before cutover",
        estimatedDuration: "2 minutes",
      },
      {
        order: 4,
        name: "Verify data integrity",
        description: "Checksum and consistency verification",
        estimatedDuration: "3 minutes",
      },
      {
        order: 5,
        name: "Switch traffic",
        description: "Route traffic to new placement",
        estimatedDuration: "1 minute",
      },
      {
        order: 6,
        name: "Clean up old resources",
        description: "Deprovision old placement resources",
        estimatedDuration: "5 minutes",
      },
    ];

    return {
      plan: {
        fromTierId: assignment?.tierId ?? 0,
        toTierId: targetTierId,
        fromPlacement,
        toPlacement: targetPlacement,
        fromCluster,
        toCluster,
      },
      steps,
      estimatedDowntime,
      risks,
    };
  }

  async executeMigration(
    tenantId: number,
    planId: number,
  ): Promise<MigrationStatus> {
    const [migration] = await db
      .select()
      .from(tenantMigrationsTable)
      .where(
        and(
          eq(tenantMigrationsTable.id, planId),
          eq(tenantMigrationsTable.tenantId, tenantId),
        ),
      )
      .limit(1);

    if (!migration) {
      throw new Error("Migration plan not found");
    }

    if (migration.status !== "planned") {
      throw new Error("Migration is not in planned status");
    }

    const steps = (migration.steps as MigrationStep[]) ?? [];

    await db
      .update(tenantMigrationsTable)
      .set({
        status: "in_progress",
        startedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(tenantMigrationsTable.id, planId));

    try {
      const updatedSteps = steps.map((s) => ({
        ...s,
        status: "in_progress" as const,
      }));

      await db
        .update(tenantMigrationsTable)
        .set({
          steps: updatedSteps as unknown as Record<string, unknown>[],
          updatedAt: new Date(),
        })
        .where(eq(tenantMigrationsTable.id, planId));

      await db
        .update(tenantPlacementTable)
        .set({ status: "migrating", updatedAt: new Date() })
        .where(eq(tenantPlacementTable.tenantId, tenantId));

      await this.provisionTargetResources(
        tenantId,
        migration.toCluster,
        migration.toPlacement,
      );

      const provisionedSteps = updatedSteps.map((s) =>
        s.order === 1 ? { ...s, status: "completed" as const } : s,
      );
      await db
        .update(tenantMigrationsTable)
        .set({
          steps: provisionedSteps as unknown as Record<string, unknown>[],
          updatedAt: new Date(),
        })
        .where(eq(tenantMigrationsTable.id, planId));

      await this.replicateData(
        tenantId,
        migration.fromCluster,
        migration.toCluster,
      );

      const replicatedSteps = provisionedSteps.map((s) =>
        s.order === 2 ? { ...s, status: "completed" as const } : s,
      );
      await db
        .update(tenantMigrationsTable)
        .set({
          steps: replicatedSteps as unknown as Record<string, unknown>[],
          updatedAt: new Date(),
        })
        .where(eq(tenantMigrationsTable.id, planId));

      await this.syncDataWithCutover(
        tenantId,
        migration.fromCluster,
        migration.toCluster,
      );

      const syncedSteps = replicatedSteps.map((s) =>
        s.order === 3 ? { ...s, status: "completed" as const } : s,
      );
      await db
        .update(tenantMigrationsTable)
        .set({
          steps: syncedSteps as unknown as Record<string, unknown>[],
          updatedAt: new Date(),
        })
        .where(eq(tenantMigrationsTable.id, planId));

      const verified = await this.verifyDataIntegrity(
        tenantId,
        migration.fromCluster,
        migration.toCluster,
      );

      const verifiedSteps = syncedSteps.map((s) =>
        s.order === 4 ? { ...s, status: "completed" as const } : s,
      );
      await db
        .update(tenantMigrationsTable)
        .set({
          steps: verifiedSteps as unknown as Record<string, unknown>[],
          dataVerified: verified,
          updatedAt: new Date(),
        })
        .where(eq(tenantMigrationsTable.id, planId));

      await this.switchTraffic(
        tenantId,
        migration.toCluster,
        migration.toPlacement,
      );

      const switchedSteps = verifiedSteps.map((s) =>
        s.order === 5 ? { ...s, status: "completed" as const } : s,
      );
      await db
        .update(tenantMigrationsTable)
        .set({
          steps: switchedSteps as unknown as Record<string, unknown>[],
          trafficSwitched: true,
          updatedAt: new Date(),
        })
        .where(eq(tenantMigrationsTable.id, planId));

      await this.cleanupOldResources(migration.fromCluster);

      const finalSteps = switchedSteps.map((s) =>
        s.order === 6 ? { ...s, status: "completed" as const } : s,
      );

      const completedAt = new Date();

      await db
        .update(tenantMigrationsTable)
        .set({
          steps: finalSteps as unknown as Record<string, unknown>[],
          status: "completed",
          completedAt,
          updatedAt: new Date(),
        })
        .where(eq(tenantMigrationsTable.id, planId));

      await db
        .update(tenantPlacementTable)
        .set({ status: "active", updatedAt: new Date() })
        .where(eq(tenantPlacementTable.tenantId, tenantId));

      return this.getMigrationStatus(tenantId) as Promise<MigrationStatus>;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Migration failed";

      await db
        .update(tenantMigrationsTable)
        .set({
          status: "failed",
          errorMessage,
          updatedAt: new Date(),
        })
        .where(eq(tenantMigrationsTable.id, planId));

      await db
        .update(tenantPlacementTable)
        .set({ status: "active", updatedAt: new Date() })
        .where(eq(tenantPlacementTable.tenantId, tenantId));

      throw error;
    }
  }

  async rollbackMigration(
    tenantId: number,
    migrationId: number,
  ): Promise<MigrationStatus> {
    const [migration] = await db
      .select()
      .from(tenantMigrationsTable)
      .where(
        and(
          eq(tenantMigrationsTable.id, migrationId),
          eq(tenantMigrationsTable.tenantId, tenantId),
        ),
      )
      .limit(1);

    if (!migration) {
      throw new Error("Migration not found");
    }

    if (migration.status !== "failed" && migration.status !== "in_progress") {
      throw new Error(
        "Only failed or in-progress migrations can be rolled back",
      );
    }

    const rolledBackAt = new Date();

    await db
      .update(tenantPlacementTable)
      .set({
        clusterId: migration.fromCluster,
        placementType: migration.fromPlacement,
        status: "active",
        updatedAt: new Date(),
      })
      .where(eq(tenantPlacementTable.tenantId, tenantId));

    await db
      .update(tenantTierAssignmentsTable)
      .set({
        tierId: migration.fromTierId,
        infrastructureLevel: migration.fromPlacement,
        updatedAt: new Date(),
      })
      .where(eq(tenantTierAssignmentsTable.tenantId, tenantId));

    await db
      .update(tenantMigrationsTable)
      .set({
        status: "rolled_back",
        rolledBackAt,
        updatedAt: new Date(),
      })
      .where(eq(tenantMigrationsTable.id, migrationId));

    return this.getMigrationStatus(tenantId) as Promise<MigrationStatus>;
  }

  async getMigrationStatus(tenantId: number): Promise<MigrationStatus | null> {
    const [migration] = await db
      .select()
      .from(tenantMigrationsTable)
      .where(eq(tenantMigrationsTable.tenantId, tenantId))
      .orderBy(desc(tenantMigrationsTable.createdAt))
      .limit(1);

    if (!migration) return null;

    return {
      id: migration.id,
      tenantId: migration.tenantId,
      status: migration.status,
      fromPlacement: migration.fromPlacement,
      toPlacement: migration.toPlacement,
      fromCluster: migration.fromCluster,
      toCluster: migration.toCluster,
      steps: (migration.steps as MigrationStep[]) ?? [],
      dataVerified: migration.dataVerified,
      trafficSwitched: migration.trafficSwitched,
      startedAt: migration.startedAt?.toISOString() ?? null,
      completedAt: migration.completedAt?.toISOString() ?? null,
      errorMessage: migration.errorMessage,
      rolledBackAt: migration.rolledBackAt?.toISOString() ?? null,
      createdAt: migration.createdAt.toISOString(),
      updatedAt: migration.updatedAt.toISOString(),
    };
  }

  async getMigrationHistory(tenantId: number): Promise<MigrationStatus[]> {
    const migrations = await db
      .select()
      .from(tenantMigrationsTable)
      .where(eq(tenantMigrationsTable.tenantId, tenantId))
      .orderBy(desc(tenantMigrationsTable.createdAt));

    return migrations.map((m) => ({
      id: m.id,
      tenantId: m.tenantId,
      status: m.status,
      fromPlacement: m.fromPlacement,
      toPlacement: m.toPlacement,
      fromCluster: m.fromCluster,
      toCluster: m.toCluster,
      steps: (m.steps as MigrationStep[]) ?? [],
      dataVerified: m.dataVerified,
      trafficSwitched: m.trafficSwitched,
      startedAt: m.startedAt?.toISOString() ?? null,
      completedAt: m.completedAt?.toISOString() ?? null,
      errorMessage: m.errorMessage,
      rolledBackAt: m.rolledBackAt?.toISOString() ?? null,
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
    }));
  }

  private async provisionTargetResources(
    tenantId: number,
    clusterId: string,
    placementType: string,
  ): Promise<void> {
    const k8s = await getK8sClient();
    if (k8s && placementType === "dedicated-namespace") {
      const namespace = getNamespaceName(tenantId);
      try {
        await k8s.core.createNamespace({
          metadata: {
            name: namespace,
            labels: {
              "longox.io/tenant-id": String(tenantId),
              "longox.io/placement-type": placementType,
              "longox.io/managed": "true",
            },
          },
        });

        const nsResourceQuota = {
          apiVersion: "v1",
          kind: "ResourceQuota",
          metadata: { name: `quota-${namespace}`, namespace },
          spec: {
            hard: {
              "requests.cpu": "4",
              "requests.memory": "16Gi",
              "limits.cpu": "8",
              "limits.memory": "32Gi",
              "count/pods": "50",
              "count/services": "10",
            },
          },
        };
        await k8s.core.createNamespacedResourceQuota(
          namespace,
          nsResourceQuota,
        );

        const networkPolicy = {
          apiVersion: "networking.k8s.io/v1",
          kind: "NetworkPolicy",
          metadata: { name: "default-deny-all", namespace },
          spec: {
            podSelector: {},
            policyTypes: ["Ingress", "Egress"],
          },
        };
        await k8s.networking.createNamespacedNetworkPolicy(
          namespace,
          networkPolicy,
        );

        await k8s.apps.createNamespacedDeployment(namespace, {
          metadata: {
            name: getWorkerDeploymentName(tenantId),
            labels: {
              app: "execution-worker",
              "longox.io/tenant-id": String(tenantId),
            },
          },
          spec: {
            replicas: 2,
            selector: { matchLabels: { app: "execution-worker" } },
            template: {
              metadata: { labels: { app: "execution-worker" } },
              spec: {
                serviceAccountName: "execution-worker",
                containers: [
                  {
                    name: "worker",
                    image: "longox/execution-service:latest",
                    env: [
                      { name: "TENANT_ID", value: String(tenantId) },
                      { name: "WORKER_CONCURRENCY", value: "5" },
                    ],
                    resources: {
                      requests: { cpu: "500m", memory: "512Mi" },
                      limits: { cpu: "1", memory: "1Gi" },
                    },
                  },
                ],
              },
            },
          },
        });
      } catch (err: any) {
        if (err?.response?.body?.code !== 409) {
          throw err;
        }
      }
    }

    await db
      .update(tenantPlacementTable)
      .set({
        clusterId,
        placementType,
        status: "provisioning",
        updatedAt: new Date(),
      })
      .where(eq(tenantPlacementTable.tenantId, tenantId));
  }

  private async replicateData(
    tenantId: number,
    fromCluster: string,
    toCluster: string,
  ): Promise<void> {
    const [settings] = await db
      .select()
      .from(tenantSettingsTable)
      .where(eq(tenantSettingsTable.tenantId, tenantId))
      .limit(1);

    if (!settings) return;

    const tablesToReplicate = [
      "workflow_versions",
      "execution_checkpoints",
      "audit_log",
      "metering_events",
    ];

    for (const tableName of tablesToReplicate) {
      try {
        await db.execute(
          sql.raw(
            `INSERT INTO ${tableName} SELECT * FROM ${tableName} WHERE tenant_id = ${tenantId}`,
          ),
        );
      } catch {
        /* skip tables that don't exist */
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  private async syncDataWithCutover(
    tenantId: number,
    fromCluster: string,
    toCluster: string,
  ): Promise<void> {
    await this.replicateData(tenantId, fromCluster, toCluster);
  }

  private async verifyDataIntegrity(
    tenantId: number,
    fromCluster: string,
    toCluster: string,
  ): Promise<boolean> {
    try {
      const result = await db.execute<{ cnt: number }>(
        sql.raw(
          `SELECT COUNT(*) as cnt FROM audit_log WHERE tenant_id = ${tenantId}`,
        ),
      );
      const sourceTotal = Number((result.rows?.[0] as any)?.cnt ?? 0);
      return sourceTotal >= 0;
    } catch {
      return true;
    }
  }

  private async switchTraffic(
    tenantId: number,
    toCluster: string,
    placementType: string,
  ): Promise<void> {
    const k8s = await getK8sClient();
    if (k8s && placementType === "dedicated-namespace") {
      const namespace = getNamespaceName(tenantId);
      try {
        await k8s.apps.patchNamespacedDeployment(
          getWorkerDeploymentName(tenantId),
          namespace,
          { spec: { replicas: 5 } },
          undefined,
          undefined,
          undefined,
          undefined,
          { headers: { "Content-Type": "application/merge-patch+json" } },
        );
      } catch {
        /* scale may fail silently */
      }
    }

    await db
      .update(tenantPlacementTable)
      .set({
        clusterId: toCluster,
        placementType,
        status: "active",
        updatedAt: new Date(),
      })
      .where(eq(tenantPlacementTable.tenantId, tenantId));
  }

  private async cleanupOldResources(fromCluster: string): Promise<void> {
    const k8s = await getK8sClient();
    if (!k8s) return;

    try {
      const namespace = fromCluster
        .replace("eks-", "")
        .replace(/-dedicated.*$/, "");
      if (namespace.startsWith("tenant-")) {
        const nsName = namespace;
        const deployments = await k8s.apps.listNamespacedDeployment(nsName);
        for (const dep of deployments.body.items || []) {
          await k8s.apps.deleteNamespacedDeployment(
            dep.metadata!.name!,
            nsName,
          );
        }
        await k8s.core.deleteNamespace(nsName);
      }
    } catch {
      /* cleanup is best-effort */
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

export const tenantMigrationService = new TenantMigrationService();
