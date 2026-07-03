import type { AuthUser } from "./index";

const WORKOS_API_KEY = process.env["WORKOS_API_KEY"];
const WORKOS_CLIENT_ID = process.env["WORKOS_CLIENT_ID"] ?? "";
const WORKOS_REDIRECT_URI =
  process.env["WORKOS_REDIRECT_URI"] ??
  `${process.env["PUBLIC_API_URL"] ?? "http://localhost:3000"}/auth/workos/callback`;
const WORKOS_WEBHOOK_SECRET = process.env["WORKOS_WEBHOOK_SECRET"] ?? "";

export function isWorkOSEnabled(): boolean {
  return Boolean(WORKOS_API_KEY);
}

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
    enrollAuthFactor(opts: {
      userId: string;
      type: "totp" | "sms" | "webauthn";
      phoneNumber?: string;
    }): Promise<{
      authenticationFactor: { id: string; type: string };
      authenticationChallenge: {
        id: string;
        qrCode?: string;
        secret?: string;
        challenge?: string;
      };
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

  const { WorkOS } = require("@workos-inc/node");
  _workos = new WorkOS(WORKOS_API_KEY) as WorkOSCompat;
  return _workos;
}

export interface AuthKitUrlOptions {
  state?: string;
  organizationId?: string;
  connectionId?: string;
}

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

export interface WorkOSSession {
  workosUser: WorkOSUser;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

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

export async function getWorkOSUser(userId: string): Promise<WorkOSUser> {
  const wos = getWorkOS();
  return wos.userManagement.getUser(userId);
}

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

export type MfaFactorType = "totp" | "sms" | "webauthn";

export async function enrollMfa(
  workosUserId: string,
  type: MfaFactorType = "totp",
  phoneNumber?: string,
): Promise<{
  factorId: string;
  factorType: MfaFactorType;
  challengeId: string;
  qrCode?: string;
  secret?: string;
  challenge?: string;
}> {
  const wos = getWorkOS();
  const result = await wos.userManagement.enrollAuthFactor({
    userId: workosUserId,
    type,
    ...(phoneNumber ? { phoneNumber } : {}),
  });
  return {
    factorId: result.authenticationFactor.id,
    factorType: type,
    challengeId: result.authenticationChallenge.id,
    qrCode: result.authenticationChallenge.qrCode,
    secret: result.authenticationChallenge.secret,
    challenge: result.authenticationChallenge.challenge,
  };
}

export async function enrollWebAuthnMfa(workosUserId: string) {
  return enrollMfa(workosUserId, "webauthn");
}

export async function enrollSmsMfa(workosUserId: string, phoneNumber: string) {
  return enrollMfa(workosUserId, "sms", phoneNumber);
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

export function verifyScimWebhook(
  rawBody: string,
  sigHeader: string,
): WorkOSWebhookEvent {
  const wos = getWorkOS();
  return wos.webhooks.constructEvent({
    payload: rawBody,
    sigHeader,
    secret: WORKOS_WEBHOOK_SECRET,
    tolerance: 180,
  });
}
