/**
 * Augment Express.Request with RBAC and correlation fields.
 * These are also declared in auth.ts — this file ensures the types are
 * available in packages that depend on shared-rbac but not api-gateway.
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        tenantId: string | null;
        role: string;
      };
      tenantId?: string;
      correlationId?: string;
    }
  }
}

export {};
