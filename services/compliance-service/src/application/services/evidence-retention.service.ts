import { and, eq, gte, lte, desc } from "drizzle-orm";
import { createHash } from "node:crypto";
import { db, complianceEvidenceTable } from "@longox/db";

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
    return createHash("sha256")
      .update(JSON.stringify(payload))
      .digest("hex");
  }

  async retainEvidence(
    eventType: string,
    data: { title: string; description?: string; payload: unknown; source: string; severity?: string },
    metadata?: { tenantId: string },
  ) {
    const payload = data.payload;
    const hash = this.computeHash(payload);
    const retentionDays = DEFAULT_RETENTION_DAYS[eventType] ?? 365;
    const retentionUntil = new Date();
    retentionUntil.setDate(retentionUntil.getDate() + retentionDays);

    const [evidence] = await db
      .insert(complianceEvidenceTable)
      .values({
        tenantId: metadata?.tenantId ?? 0,
        evidenceType: eventType,
        title: data.title,
        description: data.description ?? null,
        payload: payload as Record<string, unknown>,
        hash,
        source: data.source,
        severity: data.severity ?? "info",
        retentionUntil: retentionUntil.toISOString().split("T")[0],
        expiresAt: retentionUntil,
      })
      .returning();
    return evidence;
  }

  async verifyEvidence(id: string) {
    const [evidence] = await db
      .select()
      .from(complianceEvidenceTable)
      .where(eq(complianceEvidenceTable.id, id));

    if (!evidence) throw new Error("Evidence not found");

    const computedHash = this.computeHash(evidence.payload);
    return {
      id: evidence.id,
      hash: evidence.hash,
      computedHash,
      valid: evidence.hash === computedHash,
      createdAt: evidence.createdAt,
    };
  }

  async getEvidence(id: string) {
    const [evidence] = await db
      .select()
      .from(complianceEvidenceTable)
      .where(eq(complianceEvidenceTable.id, id));

    if (!evidence) throw new Error("Evidence not found");
    return evidence;
  }

  async queryEvidence(filters: EvidenceFilters) {
    const conditions = [];

    if (filters.evidenceType) {
      conditions.push(eq(complianceEvidenceTable.evidenceType, filters.evidenceType));
    }
    if (filters.source) {
      conditions.push(eq(complianceEvidenceTable.source, filters.source));
    }
    if (filters.severity) {
      conditions.push(eq(complianceEvidenceTable.severity, filters.severity));
    }
    if (filters.from) {
      conditions.push(gte(complianceEvidenceTable.createdAt, filters.from));
    }
    if (filters.to) {
      conditions.push(lte(complianceEvidenceTable.createdAt, filters.to));
    }

    const results = await db
      .select()
      .from(complianceEvidenceTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(complianceEvidenceTable.createdAt));

    return results;
  }

  getRetentionPolicy() {
    return { ...DEFAULT_RETENTION_DAYS };
  }

  async purgeExpiredEvidence() {
    const now = new Date();
    const expired = await db
      .select({ id: complianceEvidenceTable.id })
      .from(complianceEvidenceTable)
      .where(
        and(
          lte(complianceEvidenceTable.expiresAt, now),
        ),
      );

    if (expired.length === 0) return { purgedCount: 0 };

    const ids = expired.map((e) => e.id);
    await db
      .delete(complianceEvidenceTable)
      .where(
        and(
          lte(complianceEvidenceTable.expiresAt, now),
        ),
      );

    return { purgedCount: ids.length };
  }
}
