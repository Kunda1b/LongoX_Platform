import { eq, and } from "drizzle-orm";
import { db, tenantTiersTable, tenantPlacementTable, tenantTierAssignmentsTable, regionsTable } from "@longox/db";

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
  async determinePlacement(tenantId: string, tierId: number): Promise<PlacementResult> {
    const [tier] = await db
      .select()
      .from(tenantTiersTable)
      .where(eq(tenantTiersTable.id, tierId))
      .limit(1);

    if (!tier) {
      throw new Error(`Tier ${tierId} not found`);
    }

    const [assignment] = await db
      .select()
      .from(tenantTierAssignmentsTable)
      .where(eq(tenantTierAssignmentsTable.tenantId, tenantId))
      .limit(1);

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
    const [placement] = await db
      .select()
      .from(tenantPlacementTable)
      .where(eq(tenantPlacementTable.tenantId, tenantId))
      .limit(1);

    if (!placement) return null;

    const [region] = await db
      .select()
      .from(regionsTable)
      .where(eq(regionsTable.id, placement.regionId))
      .limit(1);

    return {
      clusterId: placement.clusterId,
      namespace: placement.namespace,
      regionId: placement.regionId,
      regionName: region?.name ?? "unknown",
      placementType: placement.placementType,
      isolationGroup: placement.isolationGroup,
      networkCidr: placement.networkCidr,
    };
  }

  async getAvailableRegions(tierId: number): Promise<AvailableRegion[]> {
    const [tier] = await db
      .select()
      .from(tenantTiersTable)
      .where(eq(tenantTiersTable.id, tierId))
      .limit(1);

    if (!tier) return [];

    const allowedRegionIds = tier.regionsAllowed;

    if (allowedRegionIds.length === 0) {
      const allRegions = await db
        .select()
        .from(regionsTable)
        .where(eq(regionsTable.isActive, true));
      return allRegions.map((r) => ({ id: r.id, regionId: r.regionId, name: r.name }));
    }

    const regions = await db
      .select()
      .from(regionsTable)
      .where(and(eq(regionsTable.isActive, true)));

    return regions
      .filter((r) => allowedRegionIds.includes(r.regionId))
      .map((r) => ({ id: r.id, regionId: r.regionId, name: r.name }));
  }

  async getClusterForTenant(
    tenantId: string,
    regionId: string,
    tierId: number,
  ): Promise<{ clusterId: string; region: typeof regionsTable.$inferSelect }> {
    const [region] = await db
      .select()
      .from(regionsTable)
      .where(eq(regionsTable.id, regionId))
      .limit(1);

    if (!region) {
      throw new Error(`Region ${regionId} not found`);
    }

    const [tier] = await db
      .select()
      .from(tenantTiersTable)
      .where(eq(tenantTiersTable.id, tierId))
      .limit(1);

    if (!tier) {
      throw new Error(`Tier ${tierId} not found`);
    }

    const clusterId = `eks-${region.regionId}-${tier.infrastructureLevel === "shared" ? "shared" : "dedicated"}`;

    return { clusterId, region };
  }

  async assignDedicatedNamespace(
    tenantId: string,
    clusterId: string,
    region: typeof regionsTable.$inferSelect,
  ): Promise<PlacementResult> {
    const namespace = `tenant-${tenantId}-ns`;

    const [existing] = await db
      .select()
      .from(tenantPlacementTable)
      .where(eq(tenantPlacementTable.tenantId, tenantId))
      .limit(1);

    if (existing) {
      await db
        .update(tenantPlacementTable)
        .set({
          placementType: "dedicated-namespace",
          clusterId,
          namespace,
          regionId: region.id,
          isolationGroup: `ig-${clusterId}`,
          status: "active",
          provisionedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(tenantPlacementTable.tenantId, tenantId));
    } else {
      await db.insert(tenantPlacementTable).values({
        tenantId,
        placementType: "dedicated-namespace",
        clusterId,
        namespace,
        regionId: region.id,
        isolationGroup: `ig-${clusterId}`,
        status: "active",
        provisionedAt: new Date(),
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
    region: typeof regionsTable.$inferSelect,
  ): Promise<PlacementResult> {
    const clusterId = `eks-${region.regionId}-dedicated-${tenantId}`;
    const networkCidr = `10.${(tenantId % 256)}.0.0/16`;

    const [existing] = await db
      .select()
      .from(tenantPlacementTable)
      .where(eq(tenantPlacementTable.tenantId, tenantId))
      .limit(1);

    if (existing) {
      await db
        .update(tenantPlacementTable)
        .set({
          placementType: "dedicated-cluster",
          clusterId,
          regionId: region.id,
          networkCidr,
          isolationGroup: `ig-${clusterId}`,
          status: "active",
          provisionedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(tenantPlacementTable.tenantId, tenantId));
    } else {
      await db.insert(tenantPlacementTable).values({
        tenantId,
        placementType: "dedicated-cluster",
        clusterId,
        regionId: region.id,
        networkCidr,
        isolationGroup: `ig-${clusterId}`,
        status: "active",
        provisionedAt: new Date(),
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
    region: typeof regionsTable.$inferSelect,
    placement: { clusterId: string },
  ): Promise<PlacementResult> {
    const [existing] = await db
      .select()
      .from(tenantPlacementTable)
      .where(eq(tenantPlacementTable.tenantId, tenantId))
      .limit(1);

    if (existing) {
      await db
        .update(tenantPlacementTable)
        .set({
          placementType: "shared",
          clusterId: placement.clusterId,
          namespace: "shared",
          regionId: region.id,
          status: "active",
          provisionedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(tenantPlacementTable.tenantId, tenantId));
    } else {
      await db.insert(tenantPlacementTable).values({
        tenantId,
        placementType: "shared",
        clusterId: placement.clusterId,
        namespace: "shared",
        regionId: region.id,
        status: "active",
        provisionedAt: new Date(),
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
    tenantId: string,
    tier: typeof tenantTiersTable.$inferSelect,
  ): Promise<typeof regionsTable.$inferSelect> {
    const [assignment] = await db
      .select()
      .from(tenantTierAssignmentsTable)
      .where(eq(tenantTierAssignmentsTable.tenantId, tenantId))
      .limit(1);

    const allowedRegionIds = tier.regionsAllowed;
    let query = db.select().from(regionsTable).where(eq(regionsTable.isActive, true));

    const allRegions = await query.orderBy(regionsTable.priority);

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
