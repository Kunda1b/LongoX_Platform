import { prisma } from "@longox/db/prisma";

interface PlacementResult {
  clusterId: string;
  namespace: string | null;
  regionId: string;
  regionName: string;
  placementType: string;
  isolationGroup: string | null;
  networkCidr: string | null;
}

interface AvailableRegion {
  id: string;
  regionId: string;
  name: string;
}

export class TenantPlacementService {
  async determinePlacement(tenantId: string, tierId: string): Promise<PlacementResult> {
    const tier = (await prisma.tenantTier.findUnique({
      where: { id: tierId },
    })) as any;

    if (!tier) {
      throw new Error(`Tier ${tierId} not found`);
    }

    const region = await this.getRegionForTenant(tenantId, tier);
    const placement = await this.getClusterForTenant(tenantId, region.id, tierId);

    switch (tier.infrastructureLevel) {
      case "shared":
        return this.placeInShared(tenantId, region, placement);
      case "dedicated-namespace":
        return this.assignDedicatedNamespace(tenantId, placement.clusterId, region);
      case "dedicated-cluster":
        return this.assignDedicatedCluster(tenantId, region);
      default:
        throw new Error(`Unknown infrastructure level: ${tier.infrastructureLevel}`);
    }
  }

  async getPlacement(tenantId: string): Promise<PlacementResult | null> {
    const placement = (await prisma.tenantPlacement.findUnique({
      where: { tenantId },
    })) as any;

    if (!placement) return null;

    const region = (await prisma.region.findUnique({
      where: { id: placement.regionId },
    })) as any;

    return {
      clusterId: placement.clusterId,
      namespace: placement.namespace,
      regionId: placement.regionId,
      regionName: region?.name ?? "unknown",
      placementType: (placement as any).placementType,
      isolationGroup: (placement as any).isolationGroup,
      networkCidr: (placement as any).networkCidr,
    };
  }

  async getAvailableRegions(tierId: string): Promise<AvailableRegion[]> {
    const tier = (await prisma.tenantTier.findUnique({
      where: { id: tierId },
    })) as any;

    if (!tier) return [];

    const allowedRegionIds: string[] = tier.regionsAllowed ?? [];

    const allRegions = (await prisma.region.findMany({
      where: { isActive: true } as any,
    })) as any[];

    if (allowedRegionIds.length === 0) {
      return allRegions.map((r) => ({ id: r.id, regionId: r.regionId, name: r.name }));
    }

    return allRegions
      .filter((r) => allowedRegionIds.includes(r.regionId))
      .map((r) => ({ id: r.id, regionId: r.regionId, name: r.name }));
  }

  async getClusterForTenant(
    tenantId: string,
    regionId: string,
    tierId: string,
  ): Promise<{ clusterId: string; region: any }> {
    const region = (await prisma.region.findUnique({
      where: { id: regionId },
    })) as any;

    if (!region) {
      throw new Error(`Region ${regionId} not found`);
    }

    const tier = (await prisma.tenantTier.findUnique({
      where: { id: tierId },
    })) as any;

    if (!tier) {
      throw new Error(`Tier ${tierId} not found`);
    }

    void tenantId;
    const clusterId = `eks-${region.regionId}-${tier.infrastructureLevel === "shared" ? "shared" : "dedicated"}`;

    return { clusterId, region };
  }

  async assignDedicatedNamespace(
    tenantId: string,
    clusterId: string,
    region: any,
  ): Promise<PlacementResult> {
    const namespace = `tenant-${tenantId}-ns`;

    const existing = (await prisma.tenantPlacement.findUnique({
      where: { tenantId },
    })) as any;

    if (existing) {
      await prisma.tenantPlacement.update({
        where: { tenantId },
        data: {
          placementType: "dedicated-namespace",
          clusterId,
          namespace,
          region: region.id,
          isolationGroup: `ig-${clusterId}`,
          status: "active",
          provisionedAt: new Date(),
          updatedAt: new Date(),
        } as any,
      });
    } else {
      await prisma.tenantPlacement.create({
        data: {
          tenantId,
          placementType: "dedicated-namespace",
          clusterId,
          namespace,
          region: region.id,
          isolationGroup: `ig-${clusterId}`,
          status: "active",
          provisionedAt: new Date(),
        } as any,
      });
    }

    return {
      clusterId,
      namespace,
      regionId: region.id,
      regionName: region.name,
      placementType: "dedicated-namespace",
      isolationGroup: `ig-${clusterId}`,
      networkCidr: null,
    };
  }

  async assignDedicatedCluster(
    tenantId: string,
    region: any,
  ): Promise<PlacementResult> {
    const clusterId = `eks-${region.regionId}-dedicated-${tenantId}`;
    const tenantHash = Array.from(tenantId).reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) | 0, 0);
    const networkCidr = `10.${Math.abs(tenantHash) % 256}.0.0/16`;

    const existing = (await prisma.tenantPlacement.findUnique({
      where: { tenantId },
    })) as any;

    if (existing) {
      await prisma.tenantPlacement.update({
        where: { tenantId },
        data: {
          placementType: "dedicated-cluster",
          clusterId,
          region: region.id,
          networkCidr,
          isolationGroup: `ig-${clusterId}`,
          status: "active",
          provisionedAt: new Date(),
          updatedAt: new Date(),
        } as any,
      });
    } else {
      await prisma.tenantPlacement.create({
        data: {
          tenantId,
          placementType: "dedicated-cluster",
          clusterId,
          region: region.id,
          networkCidr,
          isolationGroup: `ig-${clusterId}`,
          status: "active",
          provisionedAt: new Date(),
        } as any,
      });
    }

    return {
      clusterId,
      namespace: null,
      regionId: region.id,
      regionName: region.name,
      placementType: "dedicated-cluster",
      isolationGroup: `ig-${clusterId}`,
      networkCidr,
    };
  }

  private async placeInShared(
    tenantId: string,
    region: any,
    placement: { clusterId: string },
  ): Promise<PlacementResult> {
    const existing = (await prisma.tenantPlacement.findUnique({
      where: { tenantId },
    })) as any;

    if (existing) {
      await prisma.tenantPlacement.update({
        where: { tenantId },
        data: {
          placementType: "shared",
          clusterId: placement.clusterId,
          namespace: "shared",
          region: region.id,
          status: "active",
          provisionedAt: new Date(),
          updatedAt: new Date(),
        } as any,
      });
    } else {
      await prisma.tenantPlacement.create({
        data: {
          tenantId,
          placementType: "shared",
          clusterId: placement.clusterId,
          namespace: "shared",
          region: region.id,
          status: "active",
          provisionedAt: new Date(),
        } as any,
      });
    }

    return {
      clusterId: placement.clusterId,
      namespace: "shared",
      regionId: region.id,
      regionName: region.name,
      placementType: "shared",
      isolationGroup: null,
      networkCidr: null,
    };
  }

  private async getRegionForTenant(
    _tenantId: string,
    tier: any,
  ): Promise<any> {
    const allowedRegionIds: string[] = tier.regionsAllowed ?? [];
    const allRegions = (await prisma.region.findMany({
      where: { isActive: true } as any,
      orderBy: { priority: "asc" } as any,
    })) as any[];

    let region = allRegions[0];
    if (allowedRegionIds.length > 0) {
      const matched = allRegions.find((r) => allowedRegionIds.includes(r.regionId));
      if (matched) region = matched;
    }

    if (!region) {
      throw new Error("No active region available for tenant placement");
    }

    return region;
  }
}

export const tenantPlacementService = new TenantPlacementService();
