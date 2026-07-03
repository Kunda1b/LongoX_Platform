import jwt from "jsonwebtoken";

// We import `Request` from express for the `TenantContext.fromRequest` /
// `TenantContext.optional` static methods below. Express is a transitive
// dependency through downstream services; to avoid adding a direct dep
// here, we use a type-only import that gets erased at compile time.
import type { Request as ExpressRequest } from "express";

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  tenantId: number | null;
  role: string;
}

export interface TokenPayload extends AuthUser {
  iat?: number;
  exp?: number;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
      tenantId?: number;
    }
  }
}

function getSecret(): string {
  return (
    process.env["JWT_SECRET"] ??
    "flow-builder-nexus-dev-secret-change-in-production"
  );
}

function getExpiry(): string {
  return process.env["JWT_EXPIRY"] ?? "24h";
}

export function signToken(user: AuthUser): string {
  return jwt.sign(user, getSecret(), {
    expiresIn: getExpiry(),
  } as jwt.SignOptions);
}

export function verifyToken(token: string): AuthUser | null {
  try {
    return jwt.verify(token, getSecret()) as AuthUser;
  } catch {
    return null;
  }
}

export function decodeToken(token: string): TokenPayload | null {
  try {
    return jwt.decode(token) as TokenPayload;
  } catch {
    return null;
  }
}

export class TenantContext {
  constructor(public readonly tenantId: number) {}

  static fromRequest(req: ExpressRequest): TenantContext {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new Error("Tenant context not available - authentication required");
    }
    return new TenantContext(tenantId);
  }

  static optional(req: ExpressRequest): TenantContext | null {
    const tenantId = req.user?.tenantId;
    return tenantId ? new TenantContext(tenantId) : null;
  }
}

import type { Request, Response, NextFunction } from "express";

export function tenantContextMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const tenantId = req.user?.tenantId;
  if (tenantId) {
    req.tenantId = tenantId;
  }
  next();
}

export class ForbiddenError extends Error {
  constructor(
    message = "Access denied: insufficient permissions for this tenant",
  ) {
    super(message);
    this.name = "ForbiddenError";
  }
}

export function requireTenant<T extends Request>(
  req: T,
): asserts req is T & { tenantId: number } {
  if (!req.tenantId) {
    throw new ForbiddenError();
  }
}
