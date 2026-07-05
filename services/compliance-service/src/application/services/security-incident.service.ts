/**
 * Security incident service.
 *
 * Migrated from Drizzle to Prisma per ADR-013 Phase 3. Uses
 * `prisma.securityIncident` and `prisma.securityIncidentEvidence` delegates.
 * `as any` casts handle field-shape parity between Drizzle and Prisma.
 */

import { createHash } from "node:crypto";
import { prisma } from "@longox/db/prisma";

export interface IncidentFilters {
  status?: string;
  severity?: string;
  incidentType?: string;
  detectedBy?: string;
  from?: Date;
  to?: Date;
}

export class SecurityIncidentService {
  async createIncident(
    tenantId: string,
    type: string,
    severity: string,
    description: string,
    metadata?: {
      title?: string;
      affectedResources?: string[];
      extra?: Record<string, unknown>;
    },
  ) {
    const incident = await prisma.securityIncident.create({
      data: {
        tenantId,
        incidentType: type,
        severity,
        status: "open",
        title:
          metadata?.title ??
          type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        description,
        detectedBy: "system",
        affectedResources: (metadata?.affectedResources ??
          []) as unknown as Record<string, unknown>[],
        metadata: (metadata?.extra ?? {}) as Record<string, unknown>,
      } as any,
    });
    return incident;
  }

  async updateIncident(
    id: string,
    updates: {
      status?: string;
      title?: string;
      description?: string;
      metadata?: Record<string, unknown>;
    },
  ) {
    const incident = await prisma.securityIncident
      .update({
        where: { id },
        data: {
          ...(updates.status && { status: updates.status }),
          ...(updates.title && { title: updates.title }),
          ...(updates.description && { description: updates.description }),
          ...(updates.metadata && { metadata: updates.metadata }),
        } as any,
      })
      .catch(() => null);

    if (!incident) throw new Error("Incident not found");
    return incident;
  }

  async resolveIncident(id: string, resolution: string, resolvedBy: string) {
    const incident = await prisma.securityIncident
      .update({
        where: { id },
        data: {
          status: "resolved",
          resolution,
          resolvedBy,
          resolvedAt: new Date(),
        } as any,
      })
      .catch(() => null);

    if (!incident) throw new Error("Incident not found");
    return incident;
  }

  async addEvidence(
    incidentId: string,
    evidenceData: { evidenceType: string; data: unknown },
  ) {
    const hash = createHash("sha256")
      .update(JSON.stringify(evidenceData.data))
      .digest("hex");

    const evidence = await prisma.securityIncidentEvidence.create({
      data: {
        incidentId,
        evidenceType: evidenceData.evidenceType,
        data: evidenceData.data as Record<string, unknown>,
        hash,
      } as any,
    });
    return evidence;
  }

  async getIncident(id: string) {
    const incident = await prisma.securityIncident.findUnique({
      where: { id },
    });

    if (!incident) throw new Error("Incident not found");

    const evidence = await prisma.securityIncidentEvidence.findMany({
      where: { incidentId: id },
      orderBy: { createdAt: "desc" },
    });

    return { incident, evidence };
  }

  async queryIncidents(tenantId: string, filters: IncidentFilters) {
    const where: Record<string, unknown> = { tenantId };

    if (filters.status) where.status = filters.status;
    if (filters.severity) where.severity = filters.severity;
    if (filters.incidentType) where.incidentType = filters.incidentType;
    if (filters.detectedBy) where.detectedBy = filters.detectedBy;
    if (filters.from)
      where.detectedAt = {
        gte: filters.from,
        ...(filters.to ? { lte: filters.to } : {}),
      };
    else if (filters.to) where.detectedAt = { lte: filters.to };

    const incidents = await prisma.securityIncident.findMany({
      where: where as any,
      orderBy: { detectedAt: "desc" },
    });

    return incidents;
  }

  async getOpenIncidents(tenantId: string) {
    const incidents = await prisma.securityIncident.findMany({
      where: { tenantId, status: { in: ["open", "investigating"] } } as any,
      orderBy: { detectedAt: "desc" },
    });

    return incidents;
  }

  async createFromDetection(
    detectionRule: { name: string; type: string; severity: string },
    matchData: {
      tenantId: string;
      description: string;
      affectedResources?: string[];
      metadata?: Record<string, unknown>;
    },
  ) {
    const incident = await this.createIncident(
      matchData.tenantId,
      detectionRule.type,
      detectionRule.severity,
      matchData.description,
      {
        title: `Auto-detected: ${detectionRule.name}`,
        affectedResources: matchData.affectedResources,
        extra: { ...matchData.metadata, detectionRule: detectionRule.name },
      },
    );

    await this.addEvidence((incident as any).id, {
      evidenceType: "detection_match",
      data: { rule: detectionRule, match: matchData },
    });

    return incident;
  }
}
