/**
 * Evidence retention service.
 *
 * Migrated from Drizzle to Prisma per ADR-013 Phase 3. Uses
 * `prisma.complianceEvidence` delegate with `as any` casts for legacy
 * date-string columns (`retentionUntil` is a Date in Prisma but the
 * original code wrote an ISO date string).
 */

import { createHash } from "node:crypto";
import { prisma } from "@longox/db/prisma";

const DEFAULT_RETENTION_DAYS: Record<string, number> = {
  audit_log: 365,
  security_incident: 730,
  compliance_report: 1095,
  gdpr_request: 1095,
  data_export: 90,
  policy_acceptance: 1825,
};

export interface EvidenceFilters {
  evidenceType?: string;
  source?: string;
  severity?: string;
  from?: Date;
  to?: Date;
}

export class EvidenceRetentionService {
  private computeHash(payload: unknown): string {
    return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
  }

  async retainEvidence(
    eventType: string,
    data: {
      title: string;
      description?: string;
      payload: unknown;
      source: string;
      severity?: string;
    },
    metadata?: { tenantId: string },
  ) {
    const payload = data.payload;
    const hash = this.computeHash(payload);
    const retentionDays = DEFAULT_RETENTION_DAYS[eventType] ?? 365;
    const retentionUntil = new Date();
    retentionUntil.setDate(retentionUntil.getDate() + retentionDays);

    const evidence = await prisma.complianceEvidence.create({
      data: {
        tenantId: metadata?.tenantId ?? "",
        evidenceType: eventType,
        title: data.title,
        description: data.description ?? null,
        payload: payload as Record<string, unknown>,
        hash,
        source: data.source,
        severity: data.severity ?? "info",
        retentionUntil,
        expiresAt: retentionUntil,
      } as any,
    });
    return evidence;
  }

  async verifyEvidence(id: string) {
    const evidence = await prisma.complianceEvidence.findUnique({
      where: { id },
    });

    if (!evidence) throw new Error("Evidence not found");

    const computedHash = this.computeHash((evidence as any).payload);
    return {
      id: (evidence as any).id,
      hash: (evidence as any).hash,
      computedHash,
      valid: (evidence as any).hash === computedHash,
      createdAt: (evidence as any).createdAt,
    };
  }

  async getEvidence(id: string) {
    const evidence = await prisma.complianceEvidence.findUnique({
      where: { id },
    });

    if (!evidence) throw new Error("Evidence not found");
    return evidence;
  }

  async queryEvidence(filters: EvidenceFilters) {
    const where: Record<string, unknown> = {};

    if (filters.evidenceType) where.evidenceType = filters.evidenceType;
    if (filters.source) where.source = filters.source;
    if (filters.severity) where.severity = filters.severity;
    if (filters.from && filters.to) {
      where.createdAt = { gte: filters.from, lte: filters.to };
    } else if (filters.from) {
      where.createdAt = { gte: filters.from };
    } else if (filters.to) {
      where.createdAt = { lte: filters.to };
    }

    const results = await prisma.complianceEvidence.findMany({
      where: where as any,
      orderBy: { createdAt: "desc" },
    });

    return results;
  }

  getRetentionPolicy() {
    return { ...DEFAULT_RETENTION_DAYS };
  }

  async purgeExpiredEvidence() {
    const now = new Date();
    const expired = await prisma.complianceEvidence.findMany({
      where: { expiresAt: { lte: now } } as any,
      select: { id: true },
    });

    if (expired.length === 0) return { purgedCount: 0 };

    const result = await prisma.complianceEvidence.deleteMany({
      where: { expiresAt: { lte: now } } as any,
    });

    return { purgedCount: Number(result.count) };
  }
}
