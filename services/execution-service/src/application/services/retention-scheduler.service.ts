import { db, retentionConfigTable } from "@longox/db";
import { RetentionPolicyService } from "./retention-policy.service";
import { PartitionManagerService } from "./partition-manager.service";
import { ArchiveExportService } from "./archive-export.service";

export class RetentionSchedulerService {
  private policyService: RetentionPolicyService;
  private partitionManager: PartitionManagerService;
  private archiveService: ArchiveExportService;

  constructor(
    policyService?: RetentionPolicyService,
    partitionManager?: PartitionManagerService,
    archiveService?: ArchiveExportService,
  ) {
    this.policyService = policyService ?? new RetentionPolicyService();
    this.partitionManager = partitionManager ?? new PartitionManagerService();
    this.archiveService = archiveService ?? new ArchiveExportService();
  }

  async runDaily(): Promise<void> {
    const tenants = await db
      .select()
      .from(retentionConfigTable);

    for (const tenant of tenants) {
      try {
        await this.processTenant(tenant.tenantId);
      } catch (err) {
        console.error(
          `[RetentionScheduler] Error processing tenant ${tenant.tenantId}:`,
          err,
        );
      }
    }
  }

  async runManual(
    tenantId: string,
    action: "archive" | "purge" | "export",
  ): Promise<void> {
    switch (action) {
      case "archive":
        await this.archiveTenantData(tenantId);
        break;
      case "purge":
        await this.purgeTenantData(tenantId);
        break;
      case "export":
        await this.runManual(tenantId, "archive");
        break;
    }
  }

  private async processTenant(tenantId: string): Promise<void> {
    const expiredPartitions =
      await this.partitionManager.getExpiredPartitions(tenantId);

    for (const partition of expiredPartitions) {
      const policy = await this.policyService.getPolicy(tenantId);

      if (policy.archiveEnabled) {
        await this.partitionManager.detachPartition(partition.partitionName);

        const dateMatch = partition.partitionName.match(/_(\d{4})(\d{2})$/);
        if (dateMatch) {
          const year = parseInt(dateMatch[1], 10);
          const month = parseInt(dateMatch[2], 10) - 1;
          const startDate = new Date(year, month, 1);
          const endDate = new Date(year, month + 1, 1);

          await this.archiveService.exportToParquet(
            partition.tableName,
            startDate,
            endDate,
            tenantId,
          );
        }
      }

      const { coldExpiresAt } =
        await this.policyService.getExpirationDates(tenantId);
      const dateMatch = partition.partitionName.match(/_(\d{4})(\d{2})$/);

      if (dateMatch) {
        const year = parseInt(dateMatch[1], 10);
        const month = parseInt(dateMatch[2], 10) - 1;
        const partitionDate = new Date(year, month, 1);

        if (partitionDate < coldExpiresAt) {
          await this.partitionManager.dropPartition(partition.partitionName);
        }
      }
    }
  }

  private async archiveTenantData(tenantId: string): Promise<void> {
    const expiredPartitions =
      await this.partitionManager.getExpiredPartitions(tenantId);

    for (const partition of expiredPartitions) {
      await this.partitionManager.detachPartition(partition.partitionName);

      const dateMatch = partition.partitionName.match(/_(\d{4})(\d{2})$/);
      if (dateMatch) {
        const year = parseInt(dateMatch[1], 10);
        const month = parseInt(dateMatch[2], 10) - 1;
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 1);

        await this.archiveService.exportToParquet(
          partition.tableName,
          startDate,
          endDate,
          tenantId,
        );
      }
    }
  }

  private async purgeTenantData(tenantId: string): Promise<void> {
    const expiredPartitions =
      await this.partitionManager.getExpiredPartitions(tenantId);

    for (const partition of expiredPartitions) {
      await this.partitionManager.detachPartition(partition.partitionName);
      await this.partitionManager.dropPartition(partition.partitionName);
    }
  }
}
