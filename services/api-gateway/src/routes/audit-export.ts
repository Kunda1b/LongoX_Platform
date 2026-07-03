import { Router, type IRouter, type Request, type Response } from "express";
import { authorize } from "@longox/shared-rbac";
import { AuditExportService } from "@longox/compliance-service";

const router: IRouter = Router();
const auditExport = new AuditExportService();

router.get(
  "/api/v1/audit/export",
  authorize({ resource: "audit", action: "admin" }),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { format = "json", action, actorId, resourceType, resourceId, dateFrom, dateTo } = req.query as {
        format?: string;
        action?: string;
        actorId?: string;
        resourceType?: string;
        resourceId?: string;
        dateFrom?: string;
        dateTo?: string;
      };

      const filters = {
        action,
        actorId,
        resourceType,
        resourceId,
        dateFrom: dateFrom ? new Date(dateFrom) : undefined,
        dateTo: dateTo ? new Date(dateTo) : undefined,
      };

      let result: string;
      if (format === "csv") {
        result = await auditExport.exportAuditLogsAsCSV(req.tenantId!, filters);
        res.setHeader("Content-Type", "text/csv");
      } else {
        result = await auditExport.exportAuditLogsAsJSON(req.tenantId!, filters);
        res.setHeader("Content-Type", "application/json");
      }

      res.setHeader("Content-Disposition", `attachment; filename=audit-export.${format}`);
      res.send(result);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  },
);

export default router;
