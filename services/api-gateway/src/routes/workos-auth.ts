/**
 * WorkOS AuthKit routes.
 *
 * Mounted only when WORKOS_API_KEY is set (production / staging).
 * Dev/test fixtures continue to use the local password routes in auth.ts.
 *
 * Endpoints:
 *   GET  /auth/workos/url              — return AuthKit login URL
 *   GET  /auth/workos/callback         — exchange code, issue JWT
 *   POST /auth/workos/refresh          — rotate refresh token
 *   GET  /auth/workos/admin-portal     — generate Admin Portal link
 *   POST /auth/workos/mfa/enroll       — start TOTP enroll
 *   POST /auth/workos/mfa/challenge    — issue MFA challenge
 *   POST /auth/workos/mfa/verify       — verify TOTP code
 */

import { Router, type Request, type Response } from "express";
import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import {
  db,
  usersTable,
  tenantsTable,
  userRolesTable,
  rolesTable,
} from "@longox/db";
import { signToken, authMiddleware } from "../lib/auth";
import {
  getAuthKitUrl,
  exchangeAuthKitCode,
  refreshWorkOSToken,
  getAdminPortalLink,
  enrollMfa,
  enrollWebAuthnMfa,
  enrollSmsMfa,
  challengeMfa,
  verifyMfa,
  mapWorkOSUser,
  type AdminPortalIntent,
  type MfaFactorType,
} from "../lib/workos-auth";
import { buildVersionedPaths } from "../lib/api-versioning";
import { authorize } from "@longox/shared-rbac";

const router = Router();

// Temporary CSRF state store (replace with Redis in multi-instance deployments)
const stateStore = new Map<string, { redirectUrl: string; expiresAt: number }>();
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of stateStore) {
    if (v.expiresAt < now) stateStore.delete(k);
  }
}, 60_000);

// ─── GET /auth/workos/url ─────────────────────────────────────────────────────

router.get(
  buildVersionedPaths("/auth/workos/url"),
  async (req: Request, res: Response): Promise<void> => {
    const redirectUrl = (req.query["redirect"] as string) ?? "/dashboard";
    const organizationId = req.query["organization_id"] as string | undefined;
    const connectionId = req.query["connection_id"] as string | undefined;

    const state = randomBytes(16).toString("hex");
    stateStore.set(state, { redirectUrl, expiresAt: Date.now() + 600_000 });

    const url = getAuthKitUrl({ state, organizationId, connectionId });
    res.json({ url, state });
  },
);

// ─── GET /auth/workos/callback ────────────────────────────────────────────────

router.get(
  buildVersionedPaths("/auth/workos/callback"),
  async (req: Request, res: Response): Promise<void> => {
    const code = req.query["code"] as string | undefined;
    const state = req.query["state"] as string | undefined;
    const error = req.query["error"] as string | undefined;

    if (error) {
      res.status(400).json({ error: `WorkOS error: ${error}` });
      return;
    }

    if (!code) {
      res.status(400).json({ error: "Missing code parameter" });
      return;
    }

    const stateData = state ? stateStore.get(state) : undefined;
    if (state && !stateData) {
      res.status(400).json({ error: "Invalid or expired state" });
      return;
    }
    if (state) stateStore.delete(state);

    let session;
    try {
      session = await exchangeAuthKitCode(code);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "WorkOS exchange failed";
      res.status(401).json({ error: msg });
      return;
    }

    const { workosUser, accessToken, refreshToken, expiresAt } = session;

    // Upsert user in our database
    const [dbUser] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, workosUser.email.toLowerCase()))
      .limit(1);

    let userId: number;
    if (dbUser) {
      await db
        .update(usersTable)
        .set({ lastLoginAt: new Date(), workosUserId: workosUser.id })
        .where(eq(usersTable.id, dbUser.id));
      userId = dbUser.id;
    } else {
      // Auto-provision from WorkOS
      const [tenant] = await db.select().from(tenantsTable).limit(1);
      const name =
        [workosUser.firstName, workosUser.lastName].filter(Boolean).join(" ") ||
        workosUser.email.split("@")[0];

      const [newUser] = await db
        .insert(usersTable)
        .values({
          email: workosUser.email.toLowerCase(),
          passwordHash: randomBytes(32).toString("hex"),
          name,
          tenantId: tenant?.id ?? null,
          role: "editor",
          isActive: true,
          workosUserId: workosUser.id,
        } as any)
        .returning();
      userId = newUser.id;
    }

    const [finalUser] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    const [roleRow] = await db
      .select({ name: rolesTable.name })
      .from(userRolesTable)
      .innerJoin(rolesTable, eq(userRolesTable.roleId, rolesTable.id))
      .where(eq(userRolesTable.userId, String(userId)))
      .limit(1);

    const internalUser = mapWorkOSUser(workosUser, {
      dbUserId: userId,
      tenantId: finalUser?.tenantId ?? null,
      role: roleRow?.name ?? finalUser?.role ?? "editor",
    });

    const jwt = signToken(internalUser);

    res.json({
      token: jwt,
      workos_access_token: accessToken,
      workos_refresh_token: refreshToken,
      workos_expires_at: expiresAt.toISOString(),
      user: {
        id: internalUser.id,
        email: internalUser.email,
        name: internalUser.name,
        tenantId: internalUser.tenantId,
        role: internalUser.role,
      },
      redirect: stateData?.redirectUrl ?? "/dashboard",
    });
  },
);

// ─── POST /auth/workos/refresh ────────────────────────────────────────────────

router.post(
  buildVersionedPaths("/auth/workos/refresh"),
  async (req: Request, res: Response): Promise<void> => {
    const { refresh_token } = req.body as { refresh_token?: string };
    if (!refresh_token) {
      res.status(400).json({ error: "refresh_token is required" });
      return;
    }

    try {
      const tokens = await refreshWorkOSToken(refresh_token);
      res.json({
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        expires_at: tokens.expiresAt.toISOString(),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Token refresh failed";
      res.status(401).json({ error: msg });
    }
  },
);

// ─── GET /auth/workos/admin-portal ────────────────────────────────────────────
// Requires authentication + tenants:admin permission.

router.get(
  buildVersionedPaths("/auth/workos/admin-portal"),
  authMiddleware,
  authorize("tenants:admin"),
  async (req: Request, res: Response): Promise<void> => {
    const intent = (req.query["intent"] as AdminPortalIntent) ?? "sso";
    const organizationId = req.query["organization_id"] as string | undefined;
    const returnUrl =
      (req.query["return_url"] as string) ??
      `${process.env["PUBLIC_APP_URL"] ?? "http://localhost:5173"}/settings/sso`;

    if (!organizationId) {
      res.status(400).json({ error: "organization_id is required" });
      return;
    }

    const validIntents: AdminPortalIntent[] = [
      "sso",
      "dsync",
      "audit_logs",
      "log_streams",
    ];
    if (!validIntents.includes(intent)) {
      res
        .status(400)
        .json({ error: `intent must be one of: ${validIntents.join(", ")}` });
      return;
    }

    try {
      const link = await getAdminPortalLink({ intent, organizationId, returnUrl });
      res.json({ link });
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to generate Admin Portal link";
      res.status(500).json({ error: msg });
    }
  },
);

// ─── MFA: Enroll ──────────────────────────────────────────────────────────────

router.post(
  buildVersionedPaths("/auth/workos/mfa/enroll"),
  authMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    const { workos_user_id, type } = req.body as {
      workos_user_id?: string;
      type?: MfaFactorType;
    };
    if (!workos_user_id) {
      res.status(400).json({ error: "workos_user_id is required" });
      return;
    }

    const factorType: MfaFactorType = type ?? "totp";

    try {
      const result = await enrollMfa(workos_user_id, factorType);
      res.json({
        factor_id: result.factorId,
        factor_type: result.factorType,
        challenge_id: result.challengeId,
        qr_code: result.qrCode,
        secret: result.secret,
        challenge: result.challenge,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "MFA enroll failed";
      res.status(500).json({ error: msg });
    }
  },
);

// ─── MFA: WebAuthn Enroll (ADR-007) ───────────────────────────────────────────

router.post(
  buildVersionedPaths("/auth/workos/mfa/enroll/webauthn"),
  authMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    const { workos_user_id } = req.body as { workos_user_id?: string };
    if (!workos_user_id) {
      res.status(400).json({ error: "workos_user_id is required" });
      return;
    }

    try {
      const result = await enrollWebAuthnMfa(workos_user_id);
      res.json({
        factor_id: result.factorId,
        factor_type: "webauthn",
        challenge_id: result.challengeId,
        challenge: result.challenge,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "WebAuthn enroll failed";
      res.status(500).json({ error: msg });
    }
  },
);

// ─── MFA: SMS Enroll (ADR-007) ────────────────────────────────────────────────

router.post(
  buildVersionedPaths("/auth/workos/mfa/enroll/sms"),
  authMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    const { workos_user_id, phone_number } = req.body as {
      workos_user_id?: string;
      phone_number?: string;
    };
    if (!workos_user_id || !phone_number) {
      res.status(400).json({ error: "workos_user_id and phone_number are required" });
      return;
    }

    try {
      const result = await enrollSmsMfa(workos_user_id, phone_number);
      res.json({
        factor_id: result.factorId,
        factor_type: "sms",
        challenge_id: result.challengeId,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "SMS MFA enroll failed";
      res.status(500).json({ error: msg });
    }
  },
);

// ─── MFA: Challenge ───────────────────────────────────────────────────────────

router.post(
  buildVersionedPaths("/auth/workos/mfa/challenge"),
  authMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    const { factor_id } = req.body as { factor_id?: string };
    if (!factor_id) {
      res.status(400).json({ error: "factor_id is required" });
      return;
    }

    try {
      const challengeId = await challengeMfa(factor_id);
      res.json({ challenge_id: challengeId });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "MFA challenge failed";
      res.status(500).json({ error: msg });
    }
  },
);

// ─── MFA: Verify ──────────────────────────────────────────────────────────────

router.post(
  buildVersionedPaths("/auth/workos/mfa/verify"),
  authMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    const { code, challenge_id } = req.body as {
      code?: string;
      challenge_id?: string;
    };

    if (!code || !challenge_id) {
      res.status(400).json({ error: "code and challenge_id are required" });
      return;
    }

    try {
      const valid = await verifyMfa({ code, challengeId: challenge_id });
      res.json({ valid });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "MFA verify failed";
      res.status(401).json({ error: msg });
    }
  },
);

export default router;
