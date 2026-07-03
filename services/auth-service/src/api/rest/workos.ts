/**
 * WorkOS AuthKit + SSO + MFA + SCIM routes for auth-service.
 *
 * Per ADR-007, the auth-service is the authoritative owner of the auth domain.
 * The api-gateway proxies auth traffic here; in dev the gateway serves the
 * same routes directly via `services/api-gateway/src/routes/workos-auth.ts`.
 *
 * These routes delegate to `@longox/shared-auth/workos` which wraps the
 * `@workos-inc/node` SDK. When `WORKOS_API_KEY` is unset (dev), all routes
 * return 503 with a clear message so the dev knows to either set the env
 * var or fall back to the local password routes in `auth.ts`.
 *
 * Endpoints (all under /auth/*):
 *   GET  /auth/workos/url              — return AuthKit login URL
 *   GET  /auth/workos/callback         — exchange code, issue JWT
 *   POST /auth/workos/refresh          — rotate refresh token
 *   GET  /auth/workos/admin-portal     — generate Admin Portal link
 *   POST /auth/workos/mfa/enroll       — start TOTP enroll
 *   POST /auth/workos/mfa/challenge    — issue MFA challenge
 *   POST /auth/workos/mfa/verify       — verify TOTP code
 *   POST /auth/sso                     — SAML/OIDC SSO initiation
 *   POST /auth/scim                    — SCIM 2.0 directory sync webhook
 */

import { Router, type Request, type Response } from "express";
import {
  getAuthKitUrl,
  exchangeAuthKitCode,
  refreshWorkOSToken,
  getAdminPortalLink,
  enrollMfa,
  challengeMfa,
  verifyMfa,
  isWorkOSEnabled,
  verifyScimWebhook,
  type AdminPortalIntent,
  type MfaFactorType,
} from "@longox/shared-auth/workos";
import { issueSession } from "../../infrastructure/auth/jwt";
import type { AuthUser } from "../../domain/user/user.entity";

const router = Router();

/**
 * Middleware: reject all WorkOS routes when WorkOS is not configured.
 * Returns 503 with a clear message so the dev knows to set WORKOS_API_KEY
 * or fall back to the local password routes.
 */
function requireWorkOS(req: Request, res: Response, next: () => void): void {
  if (!isWorkOSEnabled()) {
    res.status(503).json({
      error: {
        code: "WORKOS_NOT_CONFIGURED",
        message:
          "WorkOS is not configured. Set WORKOS_API_KEY and WORKOS_CLIENT_ID to enable SSO, MFA, and SCIM. In dev, use the local password routes at /auth/login instead.",
        correlation_id: req.correlationId ?? null,
      },
    });
    return;
  }
  next();
}

router.use(requireWorkOS);

// ─── AuthKit: login URL + callback ────────────────────────────────────────────

router.get("/auth/workos/url", async (req, res): Promise<void> => {
  const { organization_id, connection_id, state } = req.query as Record<
    string,
    string | undefined
  >;
  try {
    const url = getAuthKitUrl({
      organizationId: organization_id,
      connectionId: connection_id,
      state,
    });
    res.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({
      error: {
        code: "WORKOS_URL_ERROR",
        message,
        correlation_id: req.correlationId ?? null,
      },
    });
  }
});

router.get("/auth/workos/callback", async (req, res): Promise<void> => {
  const { code, state } = req.query as Record<string, string | undefined>;
  if (!code) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Missing code query parameter",
        correlation_id: req.correlationId ?? null,
      },
    });
    return;
  }
  try {
    const session = await exchangeAuthKitCode(code);
    // Map the WorkOS user to the platform's AuthUser shape and issue a
    // platform session (platform is the session authority per ADR-007).
    const wosUser = session.workosUser;
    const authUser: AuthUser = {
      id: 0, // resolved by downstream middleware from the WorkOS user id
      email: wosUser.email,
      name: wosUser.firstName
        ? `${wosUser.firstName} ${wosUser.lastName ?? ""}`.trim()
        : wosUser.email,
      tenantId: null, // resolved from memberships table on first request
      role: "viewer", // default; updated by RBAC middleware
    };
    const platformSession = issueSession(authUser);
    res.json({
      ...platformSession,
      workos_session: session,
      state,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(401).json({
      error: {
        code: "WORKOS_CALLBACK_ERROR",
        message,
        correlation_id: req.correlationId ?? null,
      },
    });
  }
});

// ─── Token refresh ────────────────────────────────────────────────────────────

router.post("/auth/workos/refresh", async (req, res): Promise<void> => {
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
  try {
    const refreshed = await refreshWorkOSToken(refresh_token);
    res.json(refreshed);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(401).json({
      error: {
        code: "WORKOS_REFRESH_ERROR",
        message,
        correlation_id: req.correlationId ?? null,
      },
    });
  }
});

// ─── Admin Portal ─────────────────────────────────────────────────────────────

router.get("/auth/workos/admin-portal", async (req, res): Promise<void> => {
  const { intent, organization_id } = req.query as Record<
    string,
    string | undefined
  >;
  if (!organization_id) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "organization_id is required",
        correlation_id: req.correlationId ?? null,
      },
    });
    return;
  }
  try {
    const link = await getAdminPortalLink({
      intent: (intent ?? "sso") as AdminPortalIntent,
      organizationId: organization_id,
    });
    res.json({ link });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({
      error: {
        code: "WORKOS_ADMIN_PORTAL_ERROR",
        message,
        correlation_id: req.correlationId ?? null,
      },
    });
  }
});

// ─── MFA: enroll / challenge / verify ─────────────────────────────────────────

router.post("/auth/workos/mfa/enroll", async (req, res): Promise<void> => {
  const { workos_user_id, type, phone_number } = req.body as {
    workos_user_id?: string;
    type?: MfaFactorType;
    phone_number?: string;
  };
  if (!workos_user_id) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "workos_user_id is required",
        correlation_id: req.correlationId ?? null,
      },
    });
    return;
  }
  try {
    const factor = await enrollMfa(
      workos_user_id,
      type ?? "totp",
      phone_number,
    );
    res.json(factor);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({
      error: {
        code: "WORKOS_MFA_ENROLL_ERROR",
        message,
        correlation_id: req.correlationId ?? null,
      },
    });
  }
});

router.post("/auth/workos/mfa/challenge", async (req, res): Promise<void> => {
  const { factor_id } = req.body as { factor_id?: string };
  if (!factor_id) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "factor_id is required",
        correlation_id: req.correlationId ?? null,
      },
    });
    return;
  }
  try {
    const challengeId = await challengeMfa(factor_id);
    res.json({ challenge_id: challengeId });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({
      error: {
        code: "WORKOS_MFA_CHALLENGE_ERROR",
        message,
        correlation_id: req.correlationId ?? null,
      },
    });
  }
});

router.post("/auth/workos/mfa/verify", async (req, res): Promise<void> => {
  const { challenge_id, code } = req.body as {
    challenge_id?: string;
    code?: string;
  };
  if (!challenge_id || !code) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "challenge_id and code are required",
        correlation_id: req.correlationId ?? null,
      },
    });
    return;
  }
  try {
    const verified = await verifyMfa({ challengeId: challenge_id, code });
    res.json({ verified });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(401).json({
      error: {
        code: "WORKOS_MFA_VERIFY_ERROR",
        message,
        correlation_id: req.correlationId ?? null,
      },
    });
  }
});

// ─── SSO initiation (SAML/OIDC) ───────────────────────────────────────────────
// Per ADR-007, Enterprise SSO is brokered by WorkOS — the customer IdP is the
// IdP of record. This endpoint returns the WorkOS SSO authorization URL;
// the browser redirects there to authenticate against the customer IdP.

router.post("/auth/sso", async (req, res): Promise<void> => {
  const { connection_id, organization_id, state } = req.body as {
    connection_id?: string;
    organization_id?: string;
    state?: string;
  };
  if (!connection_id && !organization_id) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "connection_id or organization_id is required",
        correlation_id: req.correlationId ?? null,
      },
    });
    return;
  }
  try {
    const url = getAuthKitUrl({
      connectionId: connection_id,
      organizationId: organization_id,
      state,
    });
    res.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({
      error: {
        code: "WORKOS_SSO_ERROR",
        message,
        correlation_id: req.correlationId ?? null,
      },
    });
  }
});

// ─── SCIM 2.0 directory sync webhook ──────────────────────────────────────────
// WorkOS posts directory sync events here. We verify the signature, then
// process the event (create/update/delete user memberships). The actual
// membership sync lives in a follow-up task; this endpoint just verifies
// the webhook and returns 200 so WorkOS doesn't retry.

router.post("/auth/scim", async (req, res): Promise<void> => {
  const signature = req.headers["x-workos-signature"] as string | undefined;
  if (!signature) {
    res.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message: "Missing x-workos-signature header",
        correlation_id: req.correlationId ?? null,
      },
    });
    return;
  }
  // req.body is a Buffer because this route is mounted before express.json()
  // (raw body required for signature verification).
  const rawBody = Buffer.isBuffer(req.body)
    ? req.body.toString("utf8")
    : typeof req.body === "string"
      ? req.body
      : JSON.stringify(req.body);
  try {
    const event = verifyScimWebhook(rawBody, signature);
    // TODO: process the event (create/update memberships). Tracked as a
    // follow-up task; for now we just acknowledge receipt so WorkOS
    // doesn't retry.
    console.log("[auth-service] SCIM event received:", event.event);
    res.status(200).json({ received: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(401).json({
      error: {
        code: "SCIM_SIGNATURE_INVALID",
        message,
        correlation_id: req.correlationId ?? null,
      },
    });
  }
});

export default router;
