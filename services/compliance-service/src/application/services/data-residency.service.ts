import { eq } from "drizzle-orm";
import { db, tenantsTable, regionsTable, regionPoliciesTable } from "@longox/db";

export class DataResidencyService {
  async getTenantRegion(tenantId: string) {
    const [tenant] = await db
      .select()
      .from(tenantsTable)
      .where(eq(tenantsTable.id, tenantId));

    if (!tenant) throw new Error("Tenant not found");

    const region = tenant.primaryRegion
      ? await db
          .select()
          .from(regionsTable)
          .where(eq(regionsTable.regionId, tenant.primaryRegion))
          .then((r) => r[0] ?? null)
      : null;

    return {
      tenantId,
      primaryRegion: tenant.primaryRegion,
      allowedRegions: tenant.allowedRegions,
      dataResidencyRequired: tenant.dataResidencyRequired,
      regionDetails: region,
    };
  }

  async setTenantRegion(tenantId: string, regionId: string) {
    const [region] = await db
      .select()
      .from(regionsTable)
      .where(eq(regionsTable.regionId, regionId));

    if (!region) throw new Error(`Region ${regionId} not found`);

    const [tenant] = await db
      .update(tenantsTable)
      .set({
        primaryRegion: regionId,
        dataResidencyRequired: true,
      })
      .where(eq(tenantsTable.id, tenantId))
      .returning();

    return tenant;
  }

  async validateDataAccess(tenantId: string, requestingRegion: string) {
    const [tenant] = await db
      .select()
      .from(tenantsTable)
      .where(eq(tenantsTable.id, tenantId));

    if (!tenant) throw new Error("Tenant not found");

    if (!tenant.dataResidencyRequired) {
      return { allowed: true, reason: "Data residency not enforced" };
    }

    const allowed = tenant.allowedRegions.includes(requestingRegion) || tenant.primaryRegion === requestingRegion;

    return {
      allowed,
      reason: allowed ? "Region is permitted" : `Region ${requestingRegion} is not in allowed regions`,
      primaryRegion: tenant.primaryRegion,
      allowedRegions: tenant.allowedRegions,
    };
  }

  async getRegionPolicies(regionId: string) {
    const policies = await db
      .select()
      .from(regionPoliciesTable)
      .where(eq(regionPoliciesTable.region, regionId));

    const region = await db
      .select()
      .from(regionsTable)
      .where(eq(regionsTable.regionId, regionId))
      .then((r) => r[0] ?? null);

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
      regionName: region.name,
      dataResidencyCompliant: region.dataResidencyCompliant,
      policies: policies.map((p) => ({
        id: p.id,
        name: p.name,
        tier: p.tier,
        replicationFactor: p.replicationFactor,
      })),
      applicableFrameworks: frameworks,
    };
  }

  async enforceDataResidency(tenantId: string, dataType: string, data: unknown) {
    const [tenant] = await db
      .select()
      .from(tenantsTable)
      .where(eq(tenantsTable.id, tenantId));

    if (!tenant) throw new Error("Tenant not found");

    const storageRegion = tenant.primaryRegion ?? "default";
    const isCompliant = !tenant.dataResidencyRequired || (tenant.allowedRegions.includes(storageRegion) || storageRegion === tenant.primaryRegion);

    return {
      tenantId,
      dataType,
      storageRegion,
      isCompliant,
      dataResidencyRequired: tenant.dataResidencyRequired,
      storedInCorrectRegion: isCompliant,
    };
  }

  async getComplianceRequirements(tenantId: string) {
    const [tenant] = await db
      .select()
      .from(tenantsTable)
      .where(eq(tenantsTable.id, tenantId));

    if (!tenant) throw new Error("Tenant not found");

    const regionPolicies = tenant.primaryRegion
      ? await this.getRegionPolicies(tenant.primaryRegion)
      : null;

    const planTier = tenant.plan;

    const requirements: Record<string, string[]> = {
      free: ["GDPR (if EU residents)", "Data protection"],
      pro: ["GDPR", "SOC2", "Data residency", "Audit logging (90 days)"],
      enterprise: ["GDPR", "SOC2", "HIPAA readiness", "Data residency", "Audit logging (365 days)", "SSO", "Encryption at rest"],
    };

    return {
      tenantId,
      plan: planTier,
      primaryRegion: tenant.primaryRegion,
      dataResidencyRequired: tenant.dataResidencyRequired,
      regionPolicies,
      applicableRequirements: requirements[planTier] ?? requirements.free,
    };
  }
}
