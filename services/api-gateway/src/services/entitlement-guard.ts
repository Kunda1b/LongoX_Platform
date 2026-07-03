import type { Request, Response, NextFunction } from "express";

interface EntitlementClient {
  enforce(tenantId: number, resource: string): Promise<void>;
}

const entitlementClient: EntitlementClient = {
  enforce: async (tenantId: number, resource: string): Promise<void> => {
    const { EntitlementService, PlanLimitExceeded } = await import("@longox/billing-service");
    const service = new EntitlementService();
    await service.enforce(tenantId, resource);
  },
};

export function setEntitlementClient(client: EntitlementClient): void {
  Object.assign(entitlementClient, client);
}

export function enforceResourceLimit(resource: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const tenantId = req.tenantId ?? req.user?.tenantId;
    if (!tenantId) {
      next();
      return;
    }
    try {
      await entitlementClient.enforce(tenantId, resource);
      next();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Resource limit exceeded";
      res.status(429).json({ error: message, resource });
    }
  };
}
