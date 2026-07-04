/**
 * Data residency service.
 *
 * Migrated from Drizzle to Prisma per ADR-013 Phase 3. Uses
 * `prisma.tenant`, `prisma.region`, and `prisma.regionPolicy` delegates.
 * `as any` casts handle legacy `plan` column on Tenant (Prisma uses
 * `planId`) and other compatibility fields.
 */

import { prisma } from "@longox/db/prisma";

export class DataResidencyService {
  async getTenantRegion(tenantId: string) {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });

    if (!tenant) throw new Error("Tenant not found");

    let region: any = null;
    if (tenant.primaryRegion) {
      region = await prisma.region.findFirst({
        where: { regionId: tenant.primaryRegion },
      });
    }

    return {
      tenantId,
      primaryRegion: (tenant as any).primaryRegion,
      allowedRegions: (tenant as any).allowedRegions,
      dataResidencyRequired: (tenant as any).dataResidencyRequired,
      regionDetails: region,
    };
  }

  async setTenantRegion(tenantId: string, regionId: string) {
    const region = await prisma.region.findFirst({
      where: { regionId },
    });

    if (!region) throw new Error(`Region ${regionId} not found`);

    const tenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        primaryRegion: regionId,
        dataResidencyRequired: true,
      } as any,
    });

    return tenant;
  }

  async validateDataAccess(tenantId: string, requestingRegion: string) {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });

    if (!tenant) throw new Error("Tenant not found");

    if (!(tenant as any).dataResidencyRequired) {
      return { allowed: true, reason: "Data residency not enforced" };
    }

    const allowedRegions: string[] = (tenant as any).allowedRegions ?? [];
    const allowed =
      allowedRegions.includes(requestingRegion) ||
      (tenant as any).primaryRegion === requestingRegion;

    return {
      allowed,
      reason: allowed ? "Region is permitted" : `Region ${requestingRegion} is not in allowed regions`,
      primaryRegion: (tenant as any).primaryRegion,
      allowedRegions,
    };
  }

  async getRegionPolicies(regionId: string) {
    const policies = await prisma.regionPolicy.findMany({
      where: { region: regionId },
    });

    const region = await prisma.region.findFirst({
      where: { regionId },
    });

    if (!region) throw new Error(`Region ${regionId} not found`);

    const complianceFrameworks: Record<string, string[]> = {
      eu: ["GDPR", "eIDAS"],
      us: ["SOC2", "HIPAA"],
      apac: ["PDPB", "PIPL"],
      default: ["SOC2"],
    };

    const frameworks = complianceFrameworks[regionId] ?? complianceFrameworks.default;

    return {
      region: regionId,
      regionName: (region as any).name,
      dataResidencyCompliant: (region as any).dataResidencyCompliant,
      policies: policies.map((p: any) => ({
        id: p.id,
        name: p.name,
        tier: p.tier,
        replicationFactor: p.replicationFactor,
      })),
      applicableFrameworks: frameworks,
    };
  }

  async enforceDataResidency(tenantId: string, dataType: string, _data: unknown) {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });

    if (!tenant) throw new Error("Tenant not found");

    const storageRegion = (tenant as any).primaryRegion ?? "default";
    const allowedRegions: string[] = (tenant as any).allowedRegions ?? [];
    const isCompliant =
      !(tenant as any).dataResidencyRequired ||
      allowedRegions.includes(storageRegion) ||
      storageRegion === (tenant as any).primaryRegion;

    return {
      tenantId,
      dataType,
      storageRegion,
      isCompliant,
      dataResidencyRequired: (tenant as any).dataResidencyRequired,
      storedInCorrectRegion: isCompliant,
    };
  }

  async getComplianceRequirements(tenantId: string) {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });

    if (!tenant) throw new Error("Tenant not found");

    const regionPolicies = (tenant as any).primaryRegion
      ? await this.getRegionPolicies((tenant as any).primaryRegion)
      : null;

    const planTier = (tenant as any).plan ?? "free";

    const requirements: Record<string, string[]> = {
      free: ["GDPR (if EU residents)", "Data protection"],
      pro: ["GDPR", "SOC2", "Data residency", "Audit logging (90 days)"],
      enterprise: ["GDPR", "SOC2", "HIPAA readiness", "Data residency", "Audit logging (365 days)", "SSO", "Encryption at rest"],
    };

    return {
      tenantId,
      plan: planTier,
      primaryRegion: (tenant as any).primaryRegion,
      dataResidencyRequired: (tenant as any).dataResidencyRequired,
      regionPolicies,
      applicableRequirements: requirements[planTier] ?? requirements.free,
    };
  }
}
