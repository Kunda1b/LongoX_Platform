import { and, eq, desc, gte, lte, inArray } from "drizzle-orm";
import { createHash } from "node:crypto";
import {
  db,
  securityIncidentsTable,
  securityIncidentEvidenceTable,
} from "@longox/db";

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
    tenantId: number,
    type: string,
    severity: string,
    description: string,
    metadata?: { title?: string; affectedResources?: string[]; extra?: Record<string, unknown> },
  ) {
    const [incident] = await db
      .insert(securityIncidentsTable)
      .values({
        tenantId,
        incidentType: type,
        severity,
        status: "open",
        title: metadata?.title ?? type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        description,
        detectedBy: "system",
        affectedResources: (metadata?.affectedResources ?? []) as unknown as Record<string, unknown>[],
        metadata: (metadata?.extra ?? {}) as Record<string, unknown>,
      })
      .returning();
    return incident;
  }

  async updateIncident(id: number, updates: { status?: string; title?: string; description?: string; metadata?: Record<string, unknown> }) {
    const [incident] = await db
      .update(securityIncidentsTable)
      .set({
        ...(updates.status && { status: updates.status }),
        ...(updates.title && { title: updates.title }),
        ...(updates.description && { description: updates.description }),
        ...(updates.metadata && { metadata: updates.metadata }),
      })
      .where(eq(securityIncidentsTable.id, id))
      .returning();

    if (!incident) throw new Error("Incident not found");
    return incident;
  }

  async resolveIncident(id: number, resolution: string, resolvedBy: number) {
    const [incident] = await db
      .update(securityIncidentsTable)
      .set({
        status: "resolved",
        resolution,
        resolvedBy,
        resolvedAt: new Date(),
      })
      .where(eq(securityIncidentsTable.id, id))
      .returning();

    if (!incident) throw new Error("Incident not found");
    return incident;
  }

  async addEvidence(incidentId: number, evidenceData: { evidenceType: string; data: unknown }) {
    const hash = createHash("sha256")
      .update(JSON.stringify(evidenceData.data))
      .digest("hex");

    const [evidence] = await db
      .insert(securityIncidentEvidenceTable)
      .values({
        incidentId,
        evidenceType: evidenceData.evidenceType,
        data: evidenceData.data as Record<string, unknown>,
        hash,
      })
      .returning();
    return evidence;
  }

  async getIncident(id: number) {
    const [incident] = await db
      .select()
      .from(securityIncidentsTable)
      .where(eq(securityIncidentsTable.id, id));

    if (!incident) throw new Error("Incident not found");

    const evidence = await db
      .select()
      .from(securityIncidentEvidenceTable)
      .where(eq(securityIncidentEvidenceTable.incidentId, id))
      .orderBy(desc(securityIncidentEvidenceTable.createdAt));

    return { incident, evidence };
  }

  async queryIncidents(tenantId: number, filters: IncidentFilters) {
    const conditions = [eq(securityIncidentsTable.tenantId, tenantId)];

    if (filters.status) {
      conditions.push(eq(securityIncidentsTable.status, filters.status));
    }
    if (filters.severity) {
      conditions.push(eq(securityIncidentsTable.severity, filters.severity));
    }
    if (filters.incidentType) {
      conditions.push(eq(securityIncidentsTable.incidentType, filters.incidentType));
    }
    if (filters.detectedBy) {
      conditions.push(eq(securityIncidentsTable.detectedBy, filters.detectedBy));
    }
    if (filters.from) {
      conditions.push(gte(securityIncidentsTable.detectedAt, filters.from));
    }
    if (filters.to) {
      conditions.push(lte(securityIncidentsTable.detectedAt, filters.to));
    }

    const incidents = await db
      .select()
      .from(securityIncidentsTable)
      .where(and(...conditions))
      .orderBy(desc(securityIncidentsTable.detectedAt));

    return incidents;
  }

  async getOpenIncidents(tenantId: number) {
    const incidents = await db
      .select()
      .from(securityIncidentsTable)
      .where(
        and(
          eq(securityIncidentsTable.tenantId, tenantId),
          inArray(securityIncidentsTable.status, ["open", "investigating"]),
        ),
      )
      .orderBy(desc(securityIncidentsTable.detectedAt));

    return incidents;
  }

  async createFromDetection(
    detectionRule: { name: string; type: string; severity: string },
    matchData: { tenantId: number; description: string; affectedResources?: string[]; metadata?: Record<string, unknown> },
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

    await this.addEvidence(incident.id, {
      evidenceType: "detection_match",
      data: { rule: detectionRule, match: matchData },
    });

    return incident;
  }
}
