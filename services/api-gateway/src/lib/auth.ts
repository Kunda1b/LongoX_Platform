import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@longox/db";

const JWT_SECRET =
  process.env["JWT_SECRET"] ??
  "flow-builder-nexus-dev-secret-change-in-production";
const JWT_EXPIRY = "24h";
const revokedTokens = new Map<string, number>();

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  tenantId: number | null;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

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
  const expiresAt = decoded?.exp ? decoded.exp * 1000 : Date.now() + 24 * 60 * 60 * 1000;
  cleanupRevokedTokens();
  revokedTokens.set(token, expiresAt);
}

export function isTokenRevoked(token: string): boolean {
  cleanupRevokedTokens();
  return revokedTokens.has(token);
}

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
