/**
 * Release rollback service.
 *
 * Migrated from Drizzle to Prisma per ADR-013 Phase 3.
 * Uses `prisma.releaseSnapshot` delegate with `as any` casts for legacy
 * columns. Raw SQL on `_migrations` uses `prisma.$queryRawUnsafe()`.
 */

import { prisma } from "@longox/db/prisma";
import * as crypto from "node:crypto";
import { execSync } from "node:child_process";

interface RollbackPlan {
  steps: RollbackStep[];
  risks: string[];
  estimatedDowntime: string;
  dataMigrationRequired: boolean;
}

interface RollbackStep {
  order: number;
  action: string;
  command?: string;
  automated: boolean;
  estimatedDuration: string;
}

interface ReleaseState {
  service: string;
  version: string;
  helmRevision: number;
  configChecksum: string;
  migrationVersion: number;
}

export class ReleaseRollbackService {
  async createReleaseSnapshot(service: string, version: string): Promise<any> {
    const helmRevision = await this.getCurrentHelmRevision(service);
    const configChecksum = await this.computeConfigChecksum(service);
    const migrationVersion = await this.getCurrentMigrationVersion(service);

    const snapshot = await prisma.releaseSnapshot.create({
      data: {
        serviceName: service,
        version,
        chartVersion: process.env.HELM_CHART_VERSION ?? "unknown",
        helmRevision,
        configChecksum,
        migrationVersion,
        snapshotData: {
          capturedAt: new Date().toISOString(),
          environment: process.env.NODE_ENV ?? "development",
          helmReleaseStatus: await this.getHelmReleaseStatus(service),
          currentReplicaCount: await this.getCurrentReplicaCount(service),
        },
      } as any,
    });

    return snapshot;
  }

  async planRollback(
    service: string,
    targetVersion: string,
  ): Promise<RollbackPlan> {
    const currentSnapshot = await this.getLatestSnapshot(service);
    if (!currentSnapshot) {
      throw new Error(`No release snapshot found for service: ${service}`);
    }

    const targetSnapshot = await this.getSnapshotByVersion(
      service,
      targetVersion,
    );
    if (!targetSnapshot) {
      throw new Error(
        `No snapshot found for ${service} at version ${targetVersion}`,
      );
    }

    const steps: RollbackStep[] = [];
    const risks: string[] = [];
    let dataMigrationRequired = false;

    steps.push({
      order: 1,
      action: `Scale down ${service} v${currentSnapshot.version}`,
      command: `kubectl scale deployment/${service} --replicas=0`,
      automated: true,
      estimatedDuration: "30s",
    });

    if (
      currentSnapshot.migrationVersion != null &&
      targetSnapshot.migrationVersion != null
    ) {
      if (currentSnapshot.migrationVersion > targetSnapshot.migrationVersion) {
        const migrationsToReverse =
          currentSnapshot.migrationVersion - targetSnapshot.migrationVersion;
        steps.push({
          order: 2,
          action: `Reverse ${migrationsToReverse} database migration(s) from v${currentSnapshot.migrationVersion} to v${targetSnapshot.migrationVersion}`,
          command: `npm run migrate:down -- --steps=${migrationsToReverse}`,
          automated: true,
          estimatedDuration: `${migrationsToReverse * 10}s`,
        });
        dataMigrationRequired = migrationsToReverse > 1;
        risks.push(
          `Rolling back ${migrationsToReverse} migration(s) — data loss possible if migrations included destructive changes`,
        );
      }
    }

    if (currentSnapshot.configChecksum !== targetSnapshot.configChecksum) {
      steps.push({
        order: 3,
        action: "Restore previous configuration from snapshot",
        command: `kubectl apply -f configs/${service}/v${targetVersion}/configmap.yaml`,
        automated: true,
        estimatedDuration: "10s",
      });
      risks.push(
        "Configuration has changed — restored from snapshot; verify all settings",
      );
    }

    steps.push({
      order: 4,
      action: `Roll back Helm release for ${service} to chart revision ${targetSnapshot.helmRevision}`,
      command: `helm rollback ${service} ${targetSnapshot.helmRevision}`,
      automated: true,
      estimatedDuration: "60s",
    });

    if (
      currentSnapshot.helmRevision != null &&
      targetSnapshot.helmRevision != null
    ) {
      const revisionDiff =
        currentSnapshot.helmRevision - targetSnapshot.helmRevision;
      if (revisionDiff > 2) {
        risks.push(
          `Skipping ${revisionDiff - 1} intermediate revision(s) — may skip dependent changes`,
        );
      }
    }

    steps.push({
      order: 5,
      action: `Scale up ${service} v${targetVersion}`,
      command: `kubectl scale deployment/${service} --replicas=${(targetSnapshot.snapshotData as any)?.currentReplicaCount ?? 1}`,
      automated: true,
      estimatedDuration: "60s",
    });

    steps.push({
      order: 6,
      action: "Run post-rollback health checks",
      command: `kubectl rollout status deployment/${service} --timeout=120s`,
      automated: true,
      estimatedDuration: "120s",
    });

    steps.push({
      order: 7,
      action: "Verify API compatibility and run smoke tests",
      command: "npm run test:smoke -- --service=" + service,
      automated: false,
      estimatedDuration: "180s",
    });

    return {
      steps,
      risks,
      estimatedDowntime: "5-10 minutes",
      dataMigrationRequired,
    };
  }

  async executeRollback(service: string, targetVersion: string): Promise<any> {
    const plan = await this.planRollback(service, targetVersion);
    const currentSnapshot = await this.getLatestSnapshot(service);
    if (!currentSnapshot) {
      throw new Error(`No release snapshot found for service: ${service}`);
    }

    for (const step of plan.steps) {
      if (step.automated && step.command) {
        try {
          execSync(step.command, { stdio: "pipe", timeout: 300000 });
        } catch {
          console.warn(
            `Rollback step ${step.order} ("${step.action}") failed — continuing`,
          );
        }
      }
    }

    await prisma.releaseSnapshot.update({
      where: { id: currentSnapshot.id },
      data: {
        rolledBackAt: new Date(),
        rolledBackToVersion: targetVersion,
      } as any,
    });

    const record = await prisma.releaseSnapshot.create({
      data: {
        serviceName: service,
        version: targetVersion,
        chartVersion: currentSnapshot.chartVersion,
        helmRevision: currentSnapshot.helmRevision,
        configChecksum: currentSnapshot.configChecksum,
        migrationVersion: currentSnapshot.migrationVersion,
        snapshotData: {
          ...(currentSnapshot.snapshotData as Record<string, unknown>),
          rollbackEvent: true,
          rolledBackFrom: currentSnapshot.version,
          rolledBackAt: new Date().toISOString(),
          planSummary: plan,
        },
      } as any,
    });

    await this.runPostRollbackIntegrityChecks(service);

    return record;
  }

  async getRollbackHistory(service: string): Promise<any[]> {
    return prisma.releaseSnapshot.findMany({
      where: {
        serviceName: service,
        rolledBackAt: null,
      } as any,
      orderBy: { createdAt: "desc" },
    });
  }

  async getRollbackStatus(rollbackId: string): Promise<any | null> {
    const record = await prisma.releaseSnapshot.findUnique({
      where: { id: String(rollbackId) },
    });
    return record ?? null;
  }

  async cancelRollback(rollbackId: string): Promise<{ cancelled: boolean }> {
    const record = await prisma.releaseSnapshot.findUnique({
      where: { id: String(rollbackId) },
    });

    if (!record) {
      throw new Error(`Rollback ${rollbackId} not found`);
    }

    if (record.rolledBackAt) {
      throw new Error(`Rollback ${rollbackId} has already been completed`);
    }

    return { cancelled: true };
  }

  private async getLatestSnapshot(service: string): Promise<any | null> {
    const snapshots = await prisma.releaseSnapshot.findMany({
      where: { serviceName: service } as any,
      orderBy: { createdAt: "desc" },
      take: 1,
    });
    return snapshots[0] ?? null;
  }

  private async getSnapshotByVersion(
    service: string,
    version: string,
  ): Promise<any | null> {
    const snapshots = await prisma.releaseSnapshot.findMany({
      where: {
        serviceName: service,
        version,
      } as any,
      take: 1,
    });
    return snapshots[0] ?? null;
  }

  private getCurrentHelmRevision(service: string): number {
    try {
      const output = execSync(`helm list -o json --filter "^${service}$"`, {
        encoding: "utf-8",
        timeout: 10000,
      });
      const releases = JSON.parse(output);
      if (releases.length > 0) {
        return releases[0].revision;
      }
    } catch {
      console.warn(`Could not get Helm revision for ${service}`);
    }
    return 0;
  }

  private async computeConfigChecksum(service: string): Promise<string> {
    const hash = crypto.createHash("sha256");
    try {
      const output = execSync(
        `kubectl get configmap ${service}-config -o json 2>/dev/null`,
        {
          encoding: "utf-8",
          timeout: 10000,
        },
      );
      hash.update(output);
    } catch {
      hash.update(service + Date.now());
    }
    return hash.digest("hex");
  }

  private async getCurrentMigrationVersion(service: string): Promise<number> {
    try {
      // Use a parameterized query to avoid SQL injection from the `service` argument.
      const result: any[] = await prisma.$queryRawUnsafe(
        `SELECT MAX(version) as version FROM _migrations WHERE service = $1`,
        service,
      );
      return Number(result[0]?.version ?? 0);
    } catch {
      return 0;
    }
  }

  private async getHelmReleaseStatus(service: string): Promise<string> {
    try {
      const output = execSync(`helm status ${service} -o json`, {
        encoding: "utf-8",
        timeout: 10000,
      });
      const status = JSON.parse(output);
      return status.info?.status ?? "unknown";
    } catch {
      return "unknown";
    }
  }

  private async getCurrentReplicaCount(service: string): Promise<number> {
    try {
      const output = execSync(
        `kubectl get deployment/${service} -o jsonpath='{.spec.replicas}' 2>/dev/null`,
        { encoding: "utf-8", timeout: 10000 },
      );
      return Number(output) || 1;
    } catch {
      return 1;
    }
  }

  private async runPostRollbackIntegrityChecks(service: string): Promise<void> {
    try {
      execSync(`kubectl rollout status deployment/${service} --timeout=120s`, {
        stdio: "pipe",
        timeout: 130000,
      });
      console.log(`Post-rollback health check passed for ${service}`);
    } catch (err) {
      console.error(`Post-rollback health check failed for ${service}:`, err);
    }
  }
}
