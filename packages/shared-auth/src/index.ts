import jwt from "jsonwebtoken";

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

function getSecret(): string {
  return process.env["JWT_SECRET"] ?? "flow-builder-nexus-dev-secret-change-in-production";
}

function getExpiry(): string {
  return process.env["JWT_EXPIRY"] ?? "24h";
}

export function signToken(user: AuthUser): string {
  return jwt.sign(user, getSecret(), { expiresIn: getExpiry() });
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
