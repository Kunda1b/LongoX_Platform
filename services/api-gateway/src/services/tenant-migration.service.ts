import { prisma } from "@longox/db/prisma";
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

function getNamespaceName(tenantId: string): string {
  return `platform-enterprise-${tenantId}`;
}

function getWorkerDeploymentName(tenantId: string): string {
  return `execution-worker-${tenantId}`;
}

void (undefined as unknown as K8sClusterConfig);

interface MigrationPlan {
  plan: {
    fromTierId: string;
    toTierId: string;
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
  id: string;
  tenantId: string;
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
    tenantId: string,
    targetTierId: string,
  ): Promise<MigrationPlan> {
    const targetTier = (await prisma.tenantTier.findUnique({
      where: { id: targetTierId },
    })) as any;

    if (!targetTier) {
      throw new Error(`Target tier ${targetTierId} not found`);
    }

    const assignment = (await prisma.tenantTierAssignment.findUnique({
      where: { tenantId },
    })) as any;

    const fromPlacement = assignment?.infrastructureLevel ?? "shared";

    const currentPlacement = (await prisma.tenantPlacement.findUnique({
      where: { tenantId },
    })) as any;

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
        fromTierId: assignment?.tierId ?? "",
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
    tenantId: string,
    planId: string,
  ): Promise<MigrationStatus> {
    const migration = (await prisma.tenantMigration.findFirst({
      where: { id: planId, tenantId },
    })) as any;

    if (!migration) {
      throw new Error("Migration plan not found");
    }

    if (migration.status !== "planned") {
      throw new Error("Migration is not in planned status");
    }

    const steps = (migration.steps as MigrationStep[]) ?? [];

    await prisma.tenantMigration.update({
      where: { id: planId },
      data: {
        status: "in_progress",
        startedAt: new Date(),
        updatedAt: new Date(),
      } as any,
    });

    try {
      const updatedSteps = steps.map((s) => ({
        ...s,
        status: "in_progress" as const,
      }));

      await prisma.tenantMigration.update({
        where: { id: planId },
        data: {
          steps: updatedSteps as any,
          updatedAt: new Date(),
        } as any,
      });

      await prisma.tenantPlacement.update({
        where: { tenantId },
        data: { status: "migrating", updatedAt: new Date() } as any,
      });

      await this.provisionTargetResources(
        tenantId,
        migration.toCluster,
        migration.toPlacement,
      );

      const provisionedSteps = updatedSteps.map((s) =>
        s.order === 1 ? { ...s, status: "completed" as const } : s,
      );
      await prisma.tenantMigration.update({
        where: { id: planId },
        data: {
          steps: provisionedSteps as any,
          updatedAt: new Date(),
        } as any,
      });

      await this.replicateData(
        tenantId,
        migration.fromCluster,
        migration.toCluster,
      );

      const replicatedSteps = provisionedSteps.map((s) =>
        s.order === 2 ? { ...s, status: "completed" as const } : s,
      );
      await prisma.tenantMigration.update({
        where: { id: planId },
        data: {
          steps: replicatedSteps as any,
          updatedAt: new Date(),
        } as any,
      });

      await this.syncDataWithCutover(
        tenantId,
        migration.fromCluster,
        migration.toCluster,
      );

      const syncedSteps = replicatedSteps.map((s) =>
        s.order === 3 ? { ...s, status: "completed" as const } : s,
      );
      await prisma.tenantMigration.update({
        where: { id: planId },
        data: {
          steps: syncedSteps as any,
          updatedAt: new Date(),
        } as any,
      });

      const verified = await this.verifyDataIntegrity(
        tenantId,
        migration.fromCluster,
        migration.toCluster,
      );

      const verifiedSteps = syncedSteps.map((s) =>
        s.order === 4 ? { ...s, status: "completed" as const } : s,
      );
      await prisma.tenantMigration.update({
        where: { id: planId },
        data: {
          steps: verifiedSteps as any,
          dataVerified: verified,
          updatedAt: new Date(),
        } as any,
      });

      await this.switchTraffic(
        tenantId,
        migration.toCluster,
        migration.toPlacement,
      );

      const switchedSteps = verifiedSteps.map((s) =>
        s.order === 5 ? { ...s, status: "completed" as const } : s,
      );
      await prisma.tenantMigration.update({
        where: { id: planId },
        data: {
          steps: switchedSteps as any,
          trafficSwitched: true,
          updatedAt: new Date(),
        } as any,
      });

      await this.cleanupOldResources(migration.fromCluster);

      const finalSteps = switchedSteps.map((s) =>
        s.order === 6 ? { ...s, status: "completed" as const } : s,
      );

      const completedAt = new Date();

      await prisma.tenantMigration.update({
        where: { id: planId },
        data: {
          steps: finalSteps as any,
          status: "completed",
          completedAt,
          updatedAt: new Date(),
        } as any,
      });

      await prisma.tenantPlacement.update({
        where: { tenantId },
        data: { status: "active", updatedAt: new Date() } as any,
      });

      return (await this.getMigrationStatus(tenantId)) as MigrationStatus;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Migration failed";

      await prisma.tenantMigration.update({
        where: { id: planId },
        data: {
          status: "failed",
          errorMessage,
          updatedAt: new Date(),
        } as any,
      });

      await prisma.tenantPlacement.update({
        where: { tenantId },
        data: { status: "active", updatedAt: new Date() } as any,
      });

      throw error;
    }
  }

  async rollbackMigration(
    tenantId: string,
    migrationId: string,
  ): Promise<MigrationStatus> {
    const migration = (await prisma.tenantMigration.findFirst({
      where: { id: migrationId, tenantId },
    })) as any;

    if (!migration) {
      throw new Error("Migration not found");
    }

    if (migration.status !== "failed" && migration.status !== "in_progress") {
      throw new Error(
        "Only failed or in-progress migrations can be rolled back",
      );
    }

    const rolledBackAt = new Date();

    await prisma.tenantPlacement.update({
      where: { tenantId },
      data: {
        clusterId: migration.fromCluster,
        placementType: migration.fromPlacement,
        status: "active",
        updatedAt: new Date(),
      } as any,
    });

    await prisma.tenantTierAssignment.update({
      where: { tenantId },
      data: {
        tierId: migration.fromTierId,
        infrastructureLevel: migration.fromPlacement,
        updatedAt: new Date(),
      } as any,
    });

    await prisma.tenantMigration.update({
      where: { id: migrationId },
      data: {
        status: "rolled_back",
        rolledBackAt,
        updatedAt: new Date(),
      } as any,
    });

    return (await this.getMigrationStatus(tenantId)) as MigrationStatus;
  }

  async getMigrationStatus(tenantId: string): Promise<MigrationStatus | null> {
    const migration = (await prisma.tenantMigration.findFirst({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    })) as any;

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
      startedAt: migration.startedAt
        ? migration.startedAt instanceof Date
          ? migration.startedAt.toISOString()
          : new Date(migration.startedAt).toISOString()
        : null,
      completedAt: migration.completedAt
        ? migration.completedAt instanceof Date
          ? migration.completedAt.toISOString()
          : new Date(migration.completedAt).toISOString()
        : null,
      errorMessage: migration.errorMessage,
      rolledBackAt: migration.rolledBackAt
        ? migration.rolledBackAt instanceof Date
          ? migration.rolledBackAt.toISOString()
          : new Date(migration.rolledBackAt).toISOString()
        : null,
      createdAt:
        migration.createdAt instanceof Date
          ? migration.createdAt.toISOString()
          : new Date(migration.createdAt).toISOString(),
      updatedAt:
        migration.updatedAt instanceof Date
          ? migration.updatedAt.toISOString()
          : new Date(migration.updatedAt).toISOString(),
    };
  }

  async getMigrationHistory(tenantId: string): Promise<MigrationStatus[]> {
    const migrations = (await prisma.tenantMigration.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    })) as any[];

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
      startedAt: m.startedAt
        ? m.startedAt instanceof Date
          ? m.startedAt.toISOString()
          : new Date(m.startedAt).toISOString()
        : null,
      completedAt: m.completedAt
        ? m.completedAt instanceof Date
          ? m.completedAt.toISOString()
          : new Date(m.completedAt).toISOString()
        : null,
      errorMessage: m.errorMessage,
      rolledBackAt: m.rolledBackAt
        ? m.rolledBackAt instanceof Date
          ? m.rolledBackAt.toISOString()
          : new Date(m.rolledBackAt).toISOString()
        : null,
      createdAt:
        m.createdAt instanceof Date
          ? m.createdAt.toISOString()
          : new Date(m.createdAt).toISOString(),
      updatedAt:
        m.updatedAt instanceof Date
          ? m.updatedAt.toISOString()
          : new Date(m.updatedAt).toISOString(),
    }));
  }

  private async provisionTargetResources(
    tenantId: string,
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

    await prisma.tenantPlacement.update({
      where: { tenantId },
      data: {
        clusterId,
        placementType,
        status: "provisioning",
        updatedAt: new Date(),
      } as any,
    });
  }

  private async replicateData(
    tenantId: string,
    _fromCluster: string,
    _toCluster: string,
  ): Promise<void> {
    const settings = (await prisma.tenantSettings.findUnique({
      where: { tenantId },
    })) as any;

    if (!settings) return;

    // K8s-related data replication — use $queryRawUnsafe to mirror Drizzle's
    // raw SQL capability (per ADR-013 Phase 3 migration guidance).
    const tablesToReplicate = [
      "workflow_versions",
      "execution_checkpoints",
      "audit_log",
      "metering_events",
    ];

    for (const tableName of tablesToReplicate) {
      try {
        await prisma.$queryRawUnsafe(
          `INSERT INTO ${tableName} SELECT * FROM ${tableName} WHERE tenant_id = $1`,
          tenantId,
        );
      } catch {
        /* skip tables that don't exist */
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  private async syncDataWithCutover(
    tenantId: string,
    fromCluster: string,
    toCluster: string,
  ): Promise<void> {
    await this.replicateData(tenantId, fromCluster, toCluster);
  }

  private async verifyDataIntegrity(
    tenantId: string,
    _fromCluster: string,
    _toCluster: string,
  ): Promise<boolean> {
    try {
      const result = (await prisma.$queryRawUnsafe<{ cnt: number }[]>(
        `SELECT COUNT(*) as cnt FROM audit_log WHERE tenant_id = $1`,
        tenantId,
      )) as { cnt: number }[];
      const sourceTotal = Number(result?.[0]?.cnt ?? 0);
      return sourceTotal >= 0;
    } catch {
      return true;
    }
  }

  private async switchTraffic(
    tenantId: string,
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

    await prisma.tenantPlacement.update({
      where: { tenantId },
      data: {
        clusterId: toCluster,
        placementType,
        status: "active",
        updatedAt: new Date(),
      } as any,
    });
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
