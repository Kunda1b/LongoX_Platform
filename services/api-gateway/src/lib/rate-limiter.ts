import type { Request, Response, NextFunction } from "express";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests = 100, windowMs = 60_000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  middleware() {
    return (req: Request, res: Response, next: NextFunction): void => {
      const key = req.ip ?? req.socket.remoteAddress ?? "unknown";
      const now = Date.now();
      let entry = this.store.get(key);

      if (!entry || now > entry.resetAt) {
        entry = { count: 0, resetAt: now + this.windowMs };
        this.store.set(key, entry);
      }

      entry.count++;

      res.setHeader("X-RateLimit-Limit", this.maxRequests);
      res.setHeader("X-RateLimit-Remaining", Math.max(0, this.maxRequests - entry.count));
      res.setHeader("X-RateLimit-Reset", Math.ceil(entry.resetAt / 1000));

      if (entry.count > this.maxRequests) {
        res.status(429).json({ error: "Too many requests", retryAfter: Math.ceil((entry.resetAt - now) / 1000) });
        return;
      }

      next();
    };
  }

  // Create a tenant-aware rate limiter
  tenantMiddleware(maxPerTenant = 200, windowMs = 60_000) {
    const tenantStore = new Map<string, RateLimitEntry>();

    return (req: Request, res: Response, next: NextFunction): void => {
      const tenantId = (req as any).user?.tenantId ?? req.ip ?? "anonymous";
      const key = `tenant:${tenantId}`;
      const now = Date.now();
      let entry = tenantStore.get(key);

      if (!entry || now > entry.resetAt) {
        entry = { count: 0, resetAt: now + windowMs };
        tenantStore.set(key, entry);
      }

      entry.count++;

      if (entry.count > maxPerTenant) {
        res.status(429).json({ error: "Tenant rate limit exceeded", retryAfter: Math.ceil((entry.resetAt - now) / 1000) });
        return;
      }

      next();
    };
  }

  clearExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetAt) this.store.delete(key);
    }
  }
}

export const apiRateLimiter = new RateLimiter(100, 60_000);
export const tenantRateLimiter = new RateLimiter(200, 60_000);
