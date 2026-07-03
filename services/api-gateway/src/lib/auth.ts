// DEV-ONLY: Kong handles JWT validation in production per ADR-006

import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@longox/db";
import type { AuthUser } from "@longox/shared-auth";

// Re-export AuthUser so existing `import { AuthUser } from "../lib/auth"` calls
// keep working. The canonical declaration lives in `@longox/shared-auth` so
// that all services share the same `Request.user` shape (avoids TS2717
// "subsequent property declarations must have the same type" when multiple
// packages augment Express.Request).
export type { AuthUser };

const JWT_SECRET =
  process.env["JWT_SECRET"] ??
  "flow-builder-nexus-dev-secret-change-in-production";
const JWT_EXPIRY = "24h";

const revokedTokens = new Map<string, number>();

// NOTE: We deliberately do NOT re-declare `Express.Request.user` here.
// `packages/shared-auth/src/index.ts` is the canonical declaration site
// for `Request.user?: AuthUser`. Re-declaring it here with the same shape
// would still trigger TS2717 because TypeScript merges global declarations
// and rejects duplicate property declarations even when identical.
// We only add `correlationId` here; `user` is inherited from shared-auth.
declare global {
  namespace Express {
    interface Request {
      correlationId?: string;
    }
  }
}

// ─── Token operations ─────────────────────────────────────────────────────────

export function signToken(user: AuthUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

export function verifyToken(token: string): AuthUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUser;
  } catch {
    return null;
  }
}

function cleanupRevokedTokens(): void {
  const now = Date.now();
  for (const [token, expiresAt] of revokedTokens.entries()) {
    if (expiresAt <= now) revokedTokens.delete(token);
  }
}

export function getBearerToken(req: Request): string | null {
  const header = req.headers["authorization"];
  return header?.startsWith("Bearer ") ? header.slice(7) : null;
}

export function revokeToken(token: string): void {
  const decoded = jwt.decode(token) as { exp?: number } | null;
  const expiresAt = decoded?.exp
    ? decoded.exp * 1000
    : Date.now() + 24 * 60 * 60 * 1000;
  cleanupRevokedTokens();
  revokedTokens.set(token, expiresAt);
}

export function isTokenRevoked(token: string): boolean {
  cleanupRevokedTokens();
  return revokedTokens.has(token);
}

// ─── Auth middleware ──────────────────────────────────────────────────────────

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const token = getBearerToken(req);

  if (!token) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  if (isTokenRevoked(token)) {
    res.status(401).json({ error: "Token has been revoked" });
    return;
  }

  const user = verifyToken(token);
  if (!user) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  // Verify the user account is still active in our database.
  // This catches deactivated users even if their token has not expired.
  const [dbUser] = await db
    .select({ id: usersTable.id, isActive: usersTable.isActive })
    .from(usersTable)
    .where(eq(usersTable.id, user.id))
    .limit(1);

  if (!dbUser || !dbUser.isActive) {
    res.status(401).json({ error: "Account disabled or not found" });
    return;
  }

  req.user = user;
  next();
}
