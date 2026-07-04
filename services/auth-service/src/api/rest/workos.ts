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
  type WorkOSWebhookEvent,
  type WorkOSDirectoryUser,
  type WorkOSGroupMembership,
} from "@longox/shared-auth/workos";
import { issueSession } from "../../infrastructure/auth/jwt";
import type { AuthUser } from "../../domain/user/user.entity";
import { prisma } from "@longox/db/prisma";

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
      id: "", // resolved by downstream middleware from the WorkOS user id
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
// process the event:
//
//   dsync.user.created      → create / update the local User row + a default
//                             `viewer` Membership for the user's org.
//   dsync.user.updated      → refresh the local User row from the directory.
//   dsync.user.deleted      → mark the user's Memberships as `deactivated`.
//   dsync.group.user_added  → map the WorkOS group to an RBAC role on the
//                             user's Membership (group.name → RbacRole.name).
//                             If no matching role exists, fall back to the
//                             existing role (no-op).
//   dsync.group.user_removed→ clear the role on the user's Membership (set
//                             back to `viewer` if the user is still active).

/**
 * P1-21: Map a WorkOS group name to a platform RBAC role id within a tenant.
 *
 * Convention: the WorkOS group name (case-insensitive) maps directly to the
 * `RbacRole.name` for the tenant. Common mappings:
 *   - "Admin" / "Administrators" → "admin"
 *   - "Editor" / "Editors"       → "editor"
 *   - "Viewer" / "Viewers"       → "viewer"
 *
 * The fallback table below normalizes common variations; if no match is
 * found we look up the role by exact (case-insensitive) name and finally
 * fall back to `null` (caller decides what to do — usually keep the
 * existing role).
 */
const GROUP_NAME_TO_ROLE: Record<string, string> = {
  admin: "admin",
  administrator: "admin",
  administrators: "admin",
  editor: "editor",
  editors: "editor",
  viewer: "viewer",
  viewers: "viewer",
  member: "viewer",
  members: "viewer",
};

async function resolveRbacRoleIdForGroup(
  tenantId: string,
  groupName: string,
): Promise<string | null> {
  const normalized = groupName.trim().toLowerCase();
  const targetRoleName = GROUP_NAME_TO_ROLE[normalized] ?? normalized;
  const role = (await prisma.rbacRole.findFirst({
    where: {
      tenantId,
      name: { equals: targetRoleName, mode: "insensitive" } as any,
    } as any,
    select: { id: true } as any,
  })) as any;
  return role?.id ?? null;
}

/**
 * Resolve the tenant for a WorkOS organization id. The platform links a
 * WorkOS organization to a Tenant by storing the WorkOS org id in the
 * `tenants.slug` column (slug is unique per WorkOS org). If no tenant is
 * found we return null — callers should log + skip rather than auto-
 * creating a tenant (which requires billing/plan setup first).
 */
async function resolveTenantForWorkOSOrg(
  organizationId: string,
): Promise<{ id: string } | null> {
  const tenant = (await prisma.tenant.findUnique({
    where: { slug: organizationId },
    select: { id: true } as any,
  })) as any;
  return tenant ?? null;
}

/**
 * Resolve the local User for a WorkOS directory user. If the user doesn't
 * exist yet, create a stub row (no password — they'll authenticate via
 * SSO/SCIM only). Returns null if the directory user has no primary email.
 */
async function resolveOrCreateUserForDirectoryUser(
  dirUser: WorkOSDirectoryUser,
): Promise<{ id: string } | null> {
  const primaryEmail = dirUser.emails?.find((e) => e.primary)?.value ?? dirUser.emails?.[0]?.value;
  if (!primaryEmail) return null;

  // Look up by WorkOS user id first (canonical), fall back to email.
  const existing = (await prisma.user.findFirst({
    where: {
      OR: [
        { workosUserId: dirUser.id } as any,
        { email: primaryEmail.toLowerCase() } as any,
      ],
    } as any,
    select: { id: true, workosUserId: true, email: true } as any,
  })) as any;

  if (existing) {
    // Backfill the workosUserId if it was missing.
    if (!existing.workosUserId) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { workosUserId: dirUser.id } as any,
      });
    }
    return { id: existing.id };
  }

  const name =
    [dirUser.firstName, dirUser.lastName].filter(Boolean).join(" ").trim() ||
    dirUser.username ||
    primaryEmail;

  const created = (await prisma.user.create({
    data: {
      email: primaryEmail.toLowerCase(),
      // SCIM-provisioned users authenticate via SSO only — they have no
      // password. We store a random unusable hash so the password column
      // (NOT NULL) is satisfied without enabling password login.
      passwordHash: `!scim!${Math.random().toString(36).slice(2)}`,
      name,
      workosUserId: dirUser.id,
      status: dirUser.state === "inactive" ? "deactivated" : "active",
    } as any,
    select: { id: true } as any,
  })) as any;
  return { id: created.id };
}

/**
 * Find a user's membership in a tenant. Creates a default `viewer`
 * membership if none exists yet (e.g., the user was provisioned by a
 * `dsync.group.user_added` event before their `dsync.user.created` event
 * was processed).
 */
async function ensureMembership(
  userId: string,
  tenantId: string,
  defaultRole: "viewer" | null = "viewer",
): Promise<any> {
  const existing = (await prisma.membership.findFirst({
    where: { userId, tenantId } as any,
  })) as any;
  if (existing) return existing;

  let defaultRoleId: string | null = null;
  if (defaultRole) {
    defaultRoleId = await resolveRbacRoleIdForGroup(tenantId, defaultRole);
  }

  return prisma.membership.create({
    data: {
      userId,
      tenantId,
      roleId: defaultRoleId,
      status: "active",
    } as any,
  }) as Promise<any>;
}

/**
 * Apply a group→role mapping to a user's membership. Called by the
 * `dsync.group.user_added` handler. If the user has no membership yet,
 * one is created with the resolved role. If the role can't be resolved
 * (no matching RbacRole), the membership is still created with the
 * `viewer` fallback so the user can at least access the tenant.
 */
async function applyGroupRoleToMembership(
  userId: string,
  tenantId: string,
  groupName: string,
): Promise<void> {
  const membership = await ensureMembership(userId, tenantId, "viewer");
  const roleId = await resolveRbacRoleIdForGroup(tenantId, groupName);
  if (roleId && roleId !== membership.roleId) {
    await prisma.membership.update({
      where: { id: membership.id },
      data: { roleId, status: "active" } as any,
    });
  }
}

/**
 * Remove a group's role from a user's membership. Called by the
 * `dsync.group.user_removed` handler. We downgrade the user to `viewer`
 * (rather than deleting the membership entirely) so they keep tenant
 * access — the WorkOS directory's own user-deleted event is what fully
 * deactivates access.
 */
async function removeGroupRoleFromMembership(
  userId: string,
  tenantId: string,
  _groupName: string,
): Promise<void> {
  const membership = await prisma.membership.findFirst({
    where: { userId, tenantId } as any,
  });
  if (!membership) return;
  const fallbackRoleId = await resolveRbacRoleIdForGroup(tenantId, "viewer");
  await prisma.membership.update({
    where: { id: (membership as any).id },
    data: { roleId: fallbackRoleId } as any,
  });
}

/**
 * Process a verified SCIM webhook event. Returns a short summary that's
 * included in the 200 response so WorkOS operators can see what happened
 * without scanning server logs.
 */
async function processScimEvent(event: WorkOSWebhookEvent): Promise<{
  processed: boolean;
  action: string;
  detail: Record<string, unknown>;
}> {
  switch (event.event) {
    case "dsync.user.created":
    case "dsync.user.updated": {
      const dirUser = event.data as WorkOSDirectoryUser;
      const tenant = await resolveTenantForWorkOSOrg(dirUser.organizationId);
      if (!tenant) {
        return {
          processed: false,
          action: event.event,
          detail: {
            reason: "tenant_not_found",
            organizationId: dirUser.organizationId,
          },
        };
      }
      const user = await resolveOrCreateUserForDirectoryUser(dirUser);
      if (!user) {
        return {
          processed: false,
          action: event.event,
          detail: { reason: "no_primary_email", directoryUserId: dirUser.id },
        };
      }
      await ensureMembership(user.id, tenant.id, "viewer");
      return {
        processed: true,
        action: event.event,
        detail: { userId: user.id, tenantId: tenant.id },
      };
    }

    case "dsync.user.deleted": {
      const dirUser = event.data as WorkOSDirectoryUser;
      // Deactivate the user across ALL tenants they belong to. WorkOS
      // sent us a deletion event for the whole directory user, so the
      // user should lose access everywhere.
      const user = (await prisma.user.findFirst({
        where: { workosUserId: dirUser.id } as any,
        select: { id: true } as any,
      })) as any;
      if (!user) {
        return {
          processed: false,
          action: event.event,
          detail: { reason: "user_not_found", directoryUserId: dirUser.id },
        };
      }
      await prisma.membership.updateMany({
        where: { userId: user.id } as any,
        data: { status: "deactivated" } as any,
      });
      await prisma.user.update({
        where: { id: user.id },
        data: { status: "deactivated" } as any,
      });
      return {
        processed: true,
        action: event.event,
        detail: { userId: user.id },
      };
    }

    case "dsync.group.user_added": {
      const gm = event.data as WorkOSGroupMembership;
      const tenant = await resolveTenantForWorkOSOrg(gm.organizationId);
      if (!tenant) {
        return {
          processed: false,
          action: event.event,
          detail: {
            reason: "tenant_not_found",
            organizationId: gm.organizationId,
          },
        };
      }
      const user = await resolveOrCreateUserForDirectoryUser(gm.user);
      if (!user) {
        return {
          processed: false,
          action: event.event,
          detail: { reason: "no_primary_email" },
        };
      }
      await applyGroupRoleToMembership(user.id, tenant.id, gm.group.name);
      return {
        processed: true,
        action: event.event,
        detail: {
          userId: user.id,
          tenantId: tenant.id,
          groupName: gm.group.name,
        },
      };
    }

    case "dsync.group.user_removed": {
      const gm = event.data as WorkOSGroupMembership;
      const tenant = await resolveTenantForWorkOSOrg(gm.organizationId);
      if (!tenant) {
        return {
          processed: false,
          action: event.event,
          detail: {
            reason: "tenant_not_found",
            organizationId: gm.organizationId,
          },
        };
      }
      const user = (await prisma.user.findFirst({
        where: { workosUserId: gm.user.id } as any,
        select: { id: true } as any,
      })) as any;
      if (!user) {
        return {
          processed: false,
          action: event.event,
          detail: { reason: "user_not_found" },
        };
      }
      await removeGroupRoleFromMembership(user.id, tenant.id, gm.group.name);
      return {
        processed: true,
        action: event.event,
        detail: {
          userId: user.id,
          tenantId: tenant.id,
          groupName: gm.group.name,
        },
      };
    }

    default: {
      // Unknown event type — acknowledge so WorkOS doesn't retry, but
      // mark as not-processed so operators can see in logs that we
      // skipped something.
      return {
        processed: false,
        action: event.event,
        detail: { reason: "unknown_event_type" },
      };
    }
  }
}

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
    // P1-21: process the event (create/update memberships, map groups to RBAC roles).
    let result: { processed: boolean; action: string; detail: Record<string, unknown> };
    try {
      result = await processScimEvent(event);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(
        `[auth-service] SCIM event processing failed for "${event.event}":`,
        message,
      );
      // We still return 200 so WorkOS doesn't retry — the event was
      // successfully *received*, just not processed. Operators should
      // alert on the error log.
      result = {
        processed: false,
        action: event.event,
        detail: { reason: "processing_error", error: message },
      };
    }
    res.status(200).json({ received: true, ...result });
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
