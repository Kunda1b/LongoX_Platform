import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, gdprRequestsTable, auditExportsTable, complianceEvidenceTable, securityIncidentsTable, securityIncidentEvidenceTable } from "@longox/db";
import { authorize } from "@longox/shared-rbac";
import { GdprService } from "../application/services/gdpr.service";
import { AuditExportService } from "../application/services/audit-export.service";
import { EvidenceRetentionService } from "../application/services/evidence-retention.service";
import { SecurityIncidentService } from "../application/services/security-incident.service";
import { DataResidencyService } from "../application/services/data-residency.service";

const router: IRouter = Router();

const gdpr = new GdprService();
const auditExport = new AuditExportService();
const evidence = new EvidenceRetentionService();
const securityIncidents = new SecurityIncidentService();
const residency = new DataResidencyService();

router.post(
  "/compliance/gdpr/export",
  authorize({ resource: "compliance", action: "read" }),
  async (req, res): Promise<void> => {
    try {
      const request = await gdpr.createExportRequest(String(req.user!.id), req.tenantId!);
      const fulfillment = await gdpr.fulfillExportRequest(request.id);
      res.status(201).json(fulfillment);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  },
);

router.get(
  "/compliance/gdpr/exports",
  authorize({ resource: "compliance", action: "read" }),
  async (req, res): Promise<void> => {
    const requests = await db
      .select()
      .from(gdprRequestsTable)
      .where(
        and(
          eq(gdprRequestsTable.tenantId, req.tenantId!),
          eq(gdprRequestsTable.requestType, "export"),
        ),
      )
      .orderBy(desc(gdprRequestsTable.requestedAt));
    res.json(requests);
  },
);

router.get(
  "/compliance/gdpr/exports/:id",
  authorize({ resource: "compliance", action: "read" }),
  async (req, res): Promise<void> => {
    try {
      const data = await gdpr.exportUserData(String(req.user!.id), req.tenantId!);
      res.json(data);
    } catch (error) {
      res.status(404).json({ error: (error as Error).message });
    }
  },
);

router.post(
  "/compliance/gdpr/deletion",
  authorize({ resource: "compliance", action: "admin" }),
  async (req, res): Promise<void> => {
    try {
      const { userId, reason } = req.body as { userId?: string; reason?: string };
      if (!userId || !reason) {
        res.status(400).json({ error: "userId and reason are required" });
        return;
      }
      const request = await gdpr.createDeletionRequest(userId, req.tenantId!, reason);
      res.status(201).json(request);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  },
);

router.get(
  "/compliance/gdpr/deletions",
  authorize({ resource: "compliance", action: "read" }),
  async (req, res): Promise<void> => {
    const requests = await db
      .select()
      .from(gdprRequestsTable)
      .where(
        and(
          eq(gdprRequestsTable.tenantId, req.tenantId!),
          eq(gdprRequestsTable.requestType, "deletion"),
        ),
      )
      .orderBy(desc(gdprRequestsTable.requestedAt));
    res.json(requests);
  },
);

router.post(
  "/compliance/gdpr/deletions/:id/cancel",
  authorize({ resource: "compliance", action: "admin" }),
  async (req, res): Promise<void> => {
    try {
      const result = await gdpr.cancelDeletionRequest(String(req.params.id));
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  },
);

router.post(
  "/compliance/audit/export",
  authorize({ resource: "audit", action: "admin" }),
  async (req, res): Promise<void> => {
    try {
      const { format = "json", dateFrom, dateTo, ...filters } = req.body as {
        format?: string;
        dateFrom?: string;
        dateTo?: string;
        [key: string]: unknown;
      };
      const from = dateFrom ? new Date(dateFrom) : new Date(Date.now() - 30 * 86400000);
      const to = dateTo ? new Date(dateTo) : new Date();

      let result: string;
      if (format === "csv") {
        result = await auditExport.exportToCsv(req.tenantId!, from, to);
      } else {
        result = await auditExport.exportToJson(req.tenantId!, from, to);
      }

      const [exportRecord] = await db
        .insert(auditExportsTable)
        .values({
          tenantId: req.tenantId!,
          format: format === "csv" ? "csv" : "json",
          status: "completed",
          dateFrom: from.toISOString().split("T")[0],
          dateTo: to.toISOString().split("T")[0],
          filterCriteria: filters as Record<string, unknown>,
          rowCount: 0,
          fileSizeBytes: Buffer.byteLength(result),
          storagePath: `audit-exports/${req.tenantId!}/${Date.now()}.${format}`,
          createdBy: String(req.user!.id),
          completedAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 86400000),
        })
        .returning();

      res.setHeader("Content-Type", format === "csv" ? "text/csv" : "application/json");
      res.setHeader("Content-Disposition", `attachment; filename=audit-export.${format}`);
      res.send(result);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  },
);

router.get(
  "/compliance/audit/exports",
  authorize({ resource: "audit", action: "read" }),
  async (req, res): Promise<void> => {
    const exports = await auditExport.getExportHistory(req.tenantId!);
    res.json(exports);
  },
);

router.get(
  "/compliance/audit/exports/:id/download",
  authorize({ resource: "audit", action: "read" }),
  async (req, res): Promise<void> => {
    const [exportRecord] = await db
      .select()
      .from(auditExportsTable)
      .where(
        and(
          eq(auditExportsTable.id, String(req.params.id)),
          eq(auditExportsTable.tenantId, req.tenantId!),
        ),
      );

    if (!exportRecord) {
      res.status(404).json({ error: "Export not found" });
      return;
    }

    res.json({ downloadUrl: exportRecord.storagePath, format: exportRecord.format });
  },
);

router.post(
  "/compliance/evidence",
  authorize({ resource: "compliance", action: "write" }),
  async (req, res): Promise<void> => {
    try {
      const { evidenceType, title, description, payload, source, severity } = req.body as {
        evidenceType: string;
        title: string;
        description?: string;
        payload: unknown;
        source: string;
        severity?: string;
      };
      const record = await evidence.retainEvidence(
        evidenceType,
        { title, description, payload, source, severity },
        { tenantId: req.tenantId! },
      );
      res.status(201).json(record);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  },
);

router.get(
  "/compliance/evidence",
  authorize({ resource: "compliance", action: "read" }),
  async (req, res): Promise<void> => {
    const results = await evidence.queryEvidence({
      evidenceType: req.query.evidenceType as string | undefined,
      source: req.query.source as string | undefined,
      severity: req.query.severity as string | undefined,
      from: req.query.from ? new Date(req.query.from as string) : undefined,
      to: req.query.to ? new Date(req.query.to as string) : undefined,
    });
    res.json(results);
  },
);

router.get(
  "/compliance/evidence/:id",
  authorize({ resource: "compliance", action: "read" }),
  async (req, res): Promise<void> => {
    try {
      const record = await evidence.getEvidence(String(req.params.id));
      res.json(record);
    } catch (error) {
      res.status(404).json({ error: (error as Error).message });
    }
  },
);

router.get(
  "/compliance/evidence/:id/verify",
  authorize({ resource: "compliance", action: "read" }),
  async (req, res): Promise<void> => {
    try {
      const result = await evidence.verifyEvidence(String(req.params.id));
      res.json(result);
    } catch (error) {
      res.status(404).json({ error: (error as Error).message });
    }
  },
);

router.post(
  "/compliance/security-incidents",
  authorize({ resource: "compliance", action: "write" }),
  async (req, res): Promise<void> => {
    try {
      const { incidentType, severity, description, metadata } = req.body as {
        incidentType: string;
        severity: string;
        description: string;
        metadata?: { title?: string; affectedResources?: string[]; extra?: Record<string, unknown> };
      };
      const incident = await securityIncidents.createIncident(
        req.tenantId!,
        incidentType,
        severity,
        description,
        metadata,
      );
      res.status(201).json(incident);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  },
);

router.get(
  "/compliance/security-incidents",
  authorize({ resource: "compliance", action: "read" }),
  async (req, res): Promise<void> => {
    const results = await securityIncidents.queryIncidents(req.tenantId!, {
      status: req.query.status as string | undefined,
      severity: req.query.severity as string | undefined,
      incidentType: req.query.incidentType as string | undefined,
      detectedBy: req.query.detectedBy as string | undefined,
      from: req.query.from ? new Date(req.query.from as string) : undefined,
      to: req.query.to ? new Date(req.query.to as string) : undefined,
    });
    res.json(results);
  },
);

router.get(
  "/compliance/security-incidents/:id",
  authorize({ resource: "compliance", action: "read" }),
  async (req, res): Promise<void> => {
    try {
      const detail = await securityIncidents.getIncident(String(req.params.id));
      res.json(detail);
    } catch (error) {
      res.status(404).json({ error: (error as Error).message });
    }
  },
);

router.patch(
  "/compliance/security-incidents/:id",
  authorize({ resource: "compliance", action: "write" }),
  async (req, res): Promise<void> => {
    try {
      const incident = await securityIncidents.updateIncident(
        String(req.params.id),
        req.body as { status?: string; title?: string; description?: string; metadata?: Record<string, unknown> },
      );
      res.json(incident);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  },
);

router.post(
  "/compliance/security-incidents/:id/resolve",
  authorize({ resource: "compliance", action: "admin" }),
  async (req, res): Promise<void> => {
    try {
      const { resolution } = req.body as { resolution: string };
      if (!resolution) {
        res.status(400).json({ error: "resolution is required" });
        return;
      }
      const incident = await securityIncidents.resolveIncident(
        String(req.params.id),
        resolution,
        String(req.user!.id),
      );
      res.json(incident);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  },
);

router.post(
  "/compliance/security-incidents/:id/evidence",
  authorize({ resource: "compliance", action: "write" }),
  async (req, res): Promise<void> => {
    try {
      const { evidenceType, data } = req.body as { evidenceType: string; data: unknown };
      const record = await securityIncidents.addEvidence(String(req.params.id), { evidenceType, data });
      res.status(201).json(record);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  },
);

router.get(
  "/compliance/residency",
  authorize({ resource: "compliance", action: "read" }),
  async (req, res): Promise<void> => {
    try {
      const region = await residency.getTenantRegion(req.tenantId!);
      res.json(region);
    } catch (error) {
      res.status(404).json({ error: (error as Error).message });
    }
  },
);

router.put(
  "/compliance/residency",
  authorize({ resource: "compliance", action: "admin" }),
  async (req, res): Promise<void> => {
    try {
      const { regionId } = req.body as { regionId: string };
      if (!regionId) {
        res.status(400).json({ error: "regionId is required" });
        return;
      }
      const tenant = await residency.setTenantRegion(req.tenantId!, regionId);
      res.json(tenant);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  },
);

router.get(
  "/compliance/residency/policies",
  authorize({ resource: "compliance", action: "read" }),
  async (req, res): Promise<void> => {
    try {
      const regionInfo = await residency.getTenantRegion(req.tenantId!);
      if (!regionInfo.primaryRegion) {
        res.json({ region: null, policies: [], applicableFrameworks: [] });
        return;
      }
      const policies = await residency.getRegionPolicies(regionInfo.primaryRegion);
      res.json(policies);
    } catch (error) {
      res.status(404).json({ error: (error as Error).message });
    }
  },
);

router.get(
  "/compliance/requirements",
  authorize({ resource: "compliance", action: "read" }),
  async (req, res): Promise<void> => {
    try {
      const requirements = await residency.getComplianceRequirements(req.tenantId!);
      res.json(requirements);
    } catch (error) {
      res.status(404).json({ error: (error as Error).message });
    }
  },
);

export default router;
