import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import type { AuthUser } from "../../domain/user/user.entity";

// ─── ADR-007 / §26.8 — WorkOS as IdP, platform as session authority ──────────
// The platform issues its own access + refresh tokens after WorkOS auth
// succeeds. Access tokens are short-lived (1 hour = 3600s, per OpenAPI skeleton
// `expires_in: 3600`); refresh tokens are rotating and longer-lived.

const JWT_SECRET =
  process.env["JWT_SECRET"] ?? "longox-dev-secret-change-in-production";
const REFRESH_TOKEN_SECRET =
  process.env["REFRESH_TOKEN_SECRET"] ??
  "longox-dev-refresh-secret-change-in-production";

/** Access-token TTL — 1 hour per ADR-007 / OpenAPI skeleton. */
export const ACCESS_TOKEN_TTL_SECONDS = 3600;
/** Refresh-token TTL — 30 days (rotation, with reuse detection). */
export const REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30;
/** Session TTL — total session lifetime cap. */
export const SESSION_TTL_SECONDS = Number(
  process.env["SESSION_TTL_SECONDS"] ?? ACCESS_TOKEN_TTL_SECONDS,
);

const ACCESS_TOKEN_EXPIRY = `${ACCESS_TOKEN_TTL_SECONDS}s`;
const REFRESH_TOKEN_EXPIRY = `${REFRESH_TOKEN_TTL_SECONDS}s`;

export interface SessionTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: "Bearer";
  tenant_context: {
    tenant_id: string | number | null;
    role: string;
  };
}

export function signToken(user: AuthUser): string {
  return jwt.sign(user, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  } as jwt.SignOptions);
}

export function signRefreshToken(user: AuthUser): string {
  return jwt.sign(
    { sub: user.id, jti: randomUUID(), kind: "refresh" },
    REFRESH_TOKEN_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY } as jwt.SignOptions,
  );
}

export function verifyToken(token: string): AuthUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUser;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): { sub: string | number } | null {
  try {
    const payload = jwt.verify(token, REFRESH_TOKEN_SECRET) as { sub?: string | number; kind?: string };
    if (payload.kind !== "refresh") return null;
    return { sub: payload.sub! };
  } catch {
    return null;
  }
}

/**
 * Issue a full session bundle (access + refresh + metadata) per ADR-007.
 * The platform is the session authority — WorkOS authenticates the user;
 * this function mints the platform-issued tokens that downstream services
 * consume via the `Authorization: Bearer <access_token>` header.
 */
export function issueSession(user: AuthUser): SessionTokens {
  return {
    access_token: signToken(user),
    refresh_token: signRefreshToken(user),
    expires_in: ACCESS_TOKEN_TTL_SECONDS,
    token_type: "Bearer",
    tenant_context: {
      tenant_id: user.tenantId,
      role: user.role,
    },
  };
}
