// DEV-ONLY: Kong handles tenant tier routing in production
import type { Request, Response, NextFunction } from "express";
import {
  getTenantTier,
  getRateLimitsForTier,
  getK8sNamespaceForTier,
  getVaultPrefixForTier,
  getRedisIndexForTier,
} from "../services/tier-routing.service";

declare global {
  namespace Express {
    interface Request {
      tenantTier?: number;
      tierRouting?: {
        k8sNamespace: string;
        vaultPrefix: string;
        redisIndex: number;
      };
    }
  }
}

export async function tierEnforcementMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const tenantId = req.tenantId ?? req.user?.tenantId;
  if (!tenantId) {
    next();
    return;
  }

  try {
    const tier = await getTenantTier(tenantId);
    req.tenantTier = tier;

    res.setHeader("x-tenant-tier", String(tier));

    const limits = getRateLimitsForTier(tier);
    res.setHeader("x-rate-limit-limit", String(limits.perMin));
    res.setHeader("x-rate-limit-burst", String(limits.burst));

    req.tierRouting = {
      k8sNamespace: getK8sNamespaceForTier(tier),
      vaultPrefix: getVaultPrefixForTier(tier, tenantId),
      redisIndex: getRedisIndexForTier(tier),
    };

    next();
  } catch {
    next();
  }
}
