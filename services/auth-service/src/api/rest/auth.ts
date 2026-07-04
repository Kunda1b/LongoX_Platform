import { Router, type IRouter } from "express";
import { PostgresUserRepository } from "../../infrastructure/postgres/user-repository";
import { createAuthMiddleware } from "../../infrastructure/auth/middleware";
import {
  LoginCommand,
  type LoginUser,
} from "../../application/commands/login.command";
import { GetCurrentUserQuery } from "../../application/queries/get-current-user.query";
import {
  verifyRefreshToken,
  issueSession,
  ACCESS_TOKEN_TTL_SECONDS,
} from "../../infrastructure/auth/jwt";
import type { AuthUser } from "../../domain/user/user.entity";

const router: IRouter = Router();
const repository = new PostgresUserRepository();
const login = new LoginCommand(repository);
const getCurrentUser = new GetCurrentUserQuery(repository);
const authMiddleware = createAuthMiddleware(repository);

// ─── ADR-007 / §26.8 — Idempotency middleware ────────────────────────────────
// All POST writes must accept `x-idempotency-key` (UUID, 24h TTL per §26.8).
// The middleware validates the header shape and surfaces it on `req.idempotencyKey`
// for downstream dedupe. Full 24h dedupe requires a Redis-backed store; for now
// we validate the header shape and let downstream services opt into dedupe.
function idempotencyHeader(req: any, res: any, next: any): void {
  const key = req.headers["x-idempotency-key"] as string | undefined;
  if (key !== undefined) {
    // UUID v4 shape check — accept any RFC 4122 variant.
    const uuidRe =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRe.test(key)) {
      res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "x-idempotency-key must be a UUID",
          correlation_id: req.correlationId ?? null,
        },
      });
      return;
    }
    req.idempotencyKey = key;
  }
  next();
}

/**
 * POST /api/v1/auth/login
 *
 * ADR-007 response shape:
 *   {
 *     "access_token": "...",
 *     "refresh_token": "...",
 *     "expires_in": 3600,
 *     "token_type": "Bearer",
 *     "tenant_context": { "tenant_id": "...", "role": "..." },
 *     "user": { id, email, name, tenantId, role }
 *   }
 *
 * Accepts `x-idempotency-key` header (UUID, 24h TTL) for replay protection.
 */
router.post(
  "/auth/login",
  idempotencyHeader,
  async (req, res): Promise<void> => {
    const { email, password } = req.body as {
      email?: string;
      password?: string;
    };
    const result = await login.execute({
      email: email ?? "",
      password: password ?? "",
    });
    if (!result.ok) {
      res.status(result.status).json({
        error: {
          code: result.status === 401 ? "UNAUTHORIZED" : "VALIDATION_ERROR",
          message: result.error,
          correlation_id: req.correlationId ?? null,
        },
      });
      return;
    }
    res.json({
      ...result.session,
      user: result.user,
    });
  },
);

router.post("/auth/logout", (_req, res): void => {
  // Token revocation is handled by the gateway JWT plugin + a server-side
  // revocation list (to be wired in P1). For now we return 200 so clients
  // can drop local state.
  res.json({ message: "Logged out successfully" });
});

/**
 * POST /api/v1/auth/refresh
 *
 * Rotates the refresh token (refresh-token rotation per ADR-007). Accepts
 * `{ refresh_token }` body; returns a new session bundle.
 */
router.post(
  "/auth/refresh",
  idempotencyHeader,
  async (req, res): Promise<void> => {
    const { refresh_token } = req.body as { refresh_token?: string };
    if (!refresh_token) {
      res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "refresh_token is required",
          correlation_id: req.correlationId ?? null,
        },
      });
      return;
    }
    const payload = verifyRefreshToken(refresh_token);
    if (!payload) {
      res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Invalid or expired refresh token",
          correlation_id: req.correlationId ?? null,
        },
      });
      return;
    }
    const user = await repository.findById(String(payload.sub));
    if (!user || !user.isActive) {
      res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "User not found or disabled",
          correlation_id: req.correlationId ?? null,
        },
      });
      return;
    }
    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      tenantId: user.tenantId,
      role: user.role,
    };
    res.json(issueSession(authUser));
  },
);

router.get("/auth/me", authMiddleware, async (req, res): Promise<void> => {
  const profile = await getCurrentUser.execute(req.user!.id);
  if (!profile) {
    res
      .status(404)
      .json({ error: { code: "NOT_FOUND", message: "User not found" } });
    return;
  }
  res.json(profile);
});

// Re-export for downstream consumers (e.g. api-gateway route aggregation).
export { ACCESS_TOKEN_TTL_SECONDS };
export type { LoginUser };
export default router;
