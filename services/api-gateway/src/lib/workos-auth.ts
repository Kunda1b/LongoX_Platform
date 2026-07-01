/**
 * WorkOS AuthKit integration.
 *
 * Production identity: when WORKOS_API_KEY is present, all login/SSO/MFA/SCIM
 * flows are delegated to WorkOS. The local JWT path remains available for
 * development and test fixtures (NODE_ENV !== "production").
 *
 * WorkOS services used:
 *   - UserManagement.getAuthorizationUrl()     — AuthKit hosted login URL
 *   - UserManagement.authenticateWithCode()    — Exchange callback code → session
 *   - UserManagement.getUser()                 — Hydrate user from access token
 *   - UserManagement.refreshAuthentication()   — Rotate refresh tokens
 *   - Portal.generateLink()                    — Admin Portal deep link
 *   - Webhooks.constructEvent()                — SCIM/directory sync events
 */

import type { AuthUser } from "./auth";

const WORKOS_API_KEY = process.env["WORKOS_API_KEY"];
const WORKOS_CLIENT_ID = process.env["WORKOS_CLIENT_ID"] ?? "";
const WORKOS_REDIRECT_URI =
  process.env["WORKOS_REDIRECT_URI"] ??
  `${process.env["PUBLIC_API_URL"] ?? "http://localhost:3000"}/auth/workos/callback`;
const WORKOS_WEBHOOK_SECRET = process.env["WORKOS_WEBHOOK_SECRET"] ?? "";

/** True when WorkOS is configured and we are running in production mode. */
export function isWorkOSEnabled(): boolean {
  return Boolean(WORKOS_API_KEY);
}

// ─── Lazy WorkOS SDK init ─────────────────────────────────────────────────────
// We lazy-init so the gateway can still boot without WORKOS_API_KEY in dev.

let _workos: WorkOSCompat | null = null;

interface WorkOSCompat {
  userManagement: {
    getAuthorizationUrl(opts: {
      provider: string;
      redirectUri: string;
      clientId: string;
      state?: string;
      organizationId?: string;
      connectionId?: string;
    }): string;
    authenticateWithCode(opts: {
      code: string;
      clientId: string;
    }): Promise<{
      user: WorkOSUser;
      accessToken: string;
      refreshToken: string;
      expiresAt: Date;
    }>;
    getUser(userId: string): Promise<WorkOSUser>;
    refreshAuthentication(opts: {
      clientId: string;
      refreshToken: string;
    }): Promise<{
      accessToken: string;
      refreshToken: string;
      expiresAt: Date;
    }>;
    enrollAuthFactor(opts: { userId: string; type: "totp" }): Promise<{
      authenticationFactor: { id: string };
      authenticationChallenge: { id: string; qrCode: string; secret: string };
    }>;
    challengeAuthFactor(opts: {
      authenticationFactorId: string;
    }): Promise<{ id: string }>;
    verifyAuthFactor(opts: {
      code: string;
      authenticationChallengeId: string;
    }): Promise<{ valid: boolean }>;
  };
  portal: {
    generateLink(opts: {
      intent: "sso" | "dsync" | "audit_logs" | "log_streams";
      organization: string;
      returnUrl?: string;
    }): Promise<{ link: string }>;
  };
  webhooks: {
    constructEvent(opts: {
      payload: string;
      sigHeader: string;
      secret: string;
      tolerance?: number;
    }): WorkOSWebhookEvent;
  };
}

export interface WorkOSUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  emailVerified: boolean;
  profilePictureUrl: string | null;
  organizationMemberships?: Array<{ organizationId: string; role: string }>;
}

export type WorkOSWebhookEvent =
  | { event: "dsync.user.created"; data: WorkOSDirectoryUser }
  | { event: "dsync.user.updated"; data: WorkOSDirectoryUser }
  | { event: "dsync.user.deleted"; data: WorkOSDirectoryUser }
  | { event: "dsync.group.user_added"; data: WorkOSGroupMembership }
  | { event: "dsync.group.user_removed"; data: WorkOSGroupMembership }
  | { event: string; data: unknown };

export interface WorkOSDirectoryUser {
  id: string;
  directoryId: string;
  organizationId: string;
  emails: Array<{ value: string; primary?: boolean }>;
  firstName?: string;
  lastName?: string;
  username?: string;
  state: "active" | "inactive";
  customAttributes: Record<string, string>;
}

export interface WorkOSGroupMembership {
  id: string;
  directoryId: string;
  organizationId: string;
  user: WorkOSDirectoryUser;
  group: { id: string; name: string };
}

function getWorkOS(): WorkOSCompat {
  if (_workos) return _workos;

  if (!WORKOS_API_KEY) {
    throw new Error(
      "WORKOS_API_KEY is not set. WorkOS is only available in production.",
    );
  }

  // Dynamically import the WorkOS SDK to avoid breaking dev builds without it.
  // The SDK must be installed: pnpm add @workos-inc/node
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { WorkOS } = require("@workos-inc/node");
  _workos = new WorkOS(WORKOS_API_KEY) as WorkOSCompat;
  return _workos;
}

// ─── AuthKit URL generation ───────────────────────────────────────────────────

export interface AuthKitUrlOptions {
  /** Optional state for CSRF protection */
  state?: string;
  /** Target a specific WorkOS organization (for SSO) */
  organizationId?: string;
  /** Target a specific SSO connection */
  connectionId?: string;
}

/**
 * Returns the WorkOS AuthKit hosted login URL.
 * The frontend redirects the browser to this URL.
 */
export function getAuthKitUrl(opts: AuthKitUrlOptions = {}): string {
  const wos = getWorkOS();
  return wos.userManagement.getAuthorizationUrl({
    provider: "authkit",
    redirectUri: WORKOS_REDIRECT_URI,
    clientId: WORKOS_CLIENT_ID,
    state: opts.state,
    organizationId: opts.organizationId,
    connectionId: opts.connectionId,
  });
}

// ─── Callback code exchange ───────────────────────────────────────────────────

export interface WorkOSSession {
  workosUser: WorkOSUser;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

/**
 * Exchange the AuthKit callback code for a WorkOS session.
 */
export async function exchangeAuthKitCode(
  code: string,
): Promise<WorkOSSession> {
  const wos = getWorkOS();
  const result = await wos.userManagement.authenticateWithCode({
    code,
    clientId: WORKOS_CLIENT_ID,
  });
  return {
    workosUser: result.user,
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    expiresAt: result.expiresAt,
  };
}

// ─── Token refresh ────────────────────────────────────────────────────────────

export async function refreshWorkOSToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}> {
  const wos = getWorkOS();
  return wos.userManagement.refreshAuthentication({
    clientId: WORKOS_CLIENT_ID,
    refreshToken,
  });
}

// ─── Get user from WorkOS ─────────────────────────────────────────────────────

export async function getWorkOSUser(userId: string): Promise<WorkOSUser> {
  const wos = getWorkOS();
  return wos.userManagement.getUser(userId);
}

// ─── Map WorkOS user → internal AuthUser ─────────────────────────────────────

export function mapWorkOSUser(
  wosUser: WorkOSUser,
  opts: { tenantId: number | null; role: string; dbUserId: number },
): AuthUser {
  return {
    id: opts.dbUserId,
    email: wosUser.email,
    name: [wosUser.firstName, wosUser.lastName].filter(Boolean).join(" ") || wosUser.email,
    tenantId: opts.tenantId,
    role: opts.role,
  };
}

// ─── MFA (TOTP via WorkOS) ────────────────────────────────────────────────────

export async function enrollMfa(workosUserId: string): Promise<{
  factorId: string;
  challengeId: string;
  qrCode: string;
  secret: string;
}> {
  const wos = getWorkOS();
  const result = await wos.userManagement.enrollAuthFactor({
    userId: workosUserId,
    type: "totp",
  });
  return {
    factorId: result.authenticationFactor.id,
    challengeId: result.authenticationChallenge.id,
    qrCode: result.authenticationChallenge.qrCode,
    secret: result.authenticationChallenge.secret,
  };
}

export async function challengeMfa(factorId: string): Promise<string> {
  const wos = getWorkOS();
  const challenge = await wos.userManagement.challengeAuthFactor({
    authenticationFactorId: factorId,
  });
  return challenge.id;
}

export async function verifyMfa(opts: {
  code: string;
  challengeId: string;
}): Promise<boolean> {
  const wos = getWorkOS();
  const result = await wos.userManagement.verifyAuthFactor({
    code: opts.code,
    authenticationChallengeId: opts.challengeId,
  });
  return result.valid;
}

// ─── Admin Portal ─────────────────────────────────────────────────────────────

export type AdminPortalIntent = "sso" | "dsync" | "audit_logs" | "log_streams";

export async function getAdminPortalLink(opts: {
  intent: AdminPortalIntent;
  organizationId: string;
  returnUrl?: string;
}): Promise<string> {
  const wos = getWorkOS();
  const result = await wos.portal.generateLink({
    intent: opts.intent,
    organization: opts.organizationId,
    returnUrl: opts.returnUrl,
  });
  return result.link;
}

// ─── SCIM webhook signature verification ─────────────────────────────────────

export function verifyScimWebhook(
  rawBody: string,
  sigHeader: string,
): WorkOSWebhookEvent {
  const wos = getWorkOS();
  return wos.webhooks.constructEvent({
    payload: rawBody,
    sigHeader,
    secret: WORKOS_WEBHOOK_SECRET,
    tolerance: 180, // 3 minutes
  });
}
