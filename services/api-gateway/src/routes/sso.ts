import { Router, type IRouter, type Request, type Response } from "express";
import { randomBytes } from "node:crypto";
import { prisma } from "@longox/db/prisma";
import { signToken } from "../lib/auth";
import bcrypt from "bcryptjs";

const router: IRouter = Router();

const SSO_STATE_STORE = new Map<
  string,
  { provider: string; redirectUrl: string; expiresAt: number }
>();

setInterval(() => {
  const now = Date.now();
  for (const [key, val] of SSO_STATE_STORE) {
    if (val.expiresAt < now) SSO_STATE_STORE.delete(key);
  }
}, 60000);

router.get(
  "/auth/sso/:provider/start",
  async (req: Request, res: Response): Promise<void> => {
    const provider = String(req.params.provider);
    const redirectUrl = (req.query.redirect as string) ?? "/dashboard";

    const connection = (await prisma.ssoConnection.findFirst({
      where: { provider },
    })) as any;

    if (!connection || !connection.enabled) {
      res
        .status(400)
        .json({ error: `SSO provider "${provider}" is not configured` });
      return;
    }

    const state = randomBytes(16).toString("hex");
    SSO_STATE_STORE.set(state, {
      provider,
      redirectUrl,
      expiresAt: Date.now() + 600000,
    });

    const authorizeUrl = buildAuthorizeUrl(provider, connection, state);
    res.json({ url: authorizeUrl, state });
  },
);

router.post(
  "/auth/sso/:provider/callback",
  async (req: Request, res: Response): Promise<void> => {
    const { provider } = req.params;
    const { code, state } = req.body as { code?: string; state?: string };

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    const stateData = SSO_STATE_STORE.get(state);
    if (!stateData || stateData.provider !== provider) {
      res.status(400).json({ error: "Invalid or expired state parameter" });
      return;
    }
    SSO_STATE_STORE.delete(state);

    const connection = (await prisma.ssoConnection.findFirst({
      where: { provider },
    })) as any;

    if (!connection) {
      res.status(400).json({ error: "SSO provider not configured" });
      return;
    }

    const userInfo = await exchangeCodeForUserInfo(provider, connection, code);
    if (!userInfo) {
      res
        .status(401)
        .json({ error: "Failed to authenticate with SSO provider" });
      return;
    }

    const email = userInfo.email?.toLowerCase();
    if (!email) {
      res
        .status(400)
        .json({ error: "SSO provider did not return an email address" });
      return;
    }

    const existingIdentity = (await prisma.userSsoIdentity.findFirst({
      where: { providerUserId: userInfo.id },
    })) as any;

    let user: any;

    if (existingIdentity) {
      const existingUser = (await prisma.user.findUnique({
        where: { id: existingIdentity.userId },
      })) as any;
      if (!existingUser) {
        res.status(500).json({ error: "User account not found" });
        return;
      }
      user = existingUser;
    } else {
      const existingUser = (await prisma.user.findUnique({
        where: { email },
      })) as any;

      if (existingUser) {
        await prisma.userSsoIdentity.create({
          data: {
            userId: existingUser.id,
            provider,
            providerUserId: userInfo.id,
            providerEmail: email,
          } as any,
        });
        user = existingUser;
      } else {
        const tenant = (await prisma.tenant.findFirst()) as any;

        const hash = await bcrypt.hash(randomBytes(32).toString("hex"), 10);
        const newUser = (await prisma.user.create({
          data: {
            email,
            passwordHash: hash,
            name: userInfo.name ?? email.split("@")[0],
            tenantId: tenant?.id ?? null,
            role: "editor",
            status: "active",
          } as any,
        })) as any;

        await prisma.userSsoIdentity.create({
          data: {
            userId: newUser.id,
            provider,
            providerUserId: userInfo.id,
            providerEmail: email,
          } as any,
        });

        user = newUser;
      }
    }

    if (user.status !== "active") {
      res.status(401).json({ error: "Account is disabled" });
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const authUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      tenantId: user.tenantId ?? null,
      role: (user as any).role,
    };
    const token = signToken(authUser);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tenantId: user.tenantId,
        role: (user as any).role,
      },
      redirect: stateData.redirectUrl,
    });
  },
);

router.get(
  "/auth/sso/providers",
  async (_req: Request, res: Response): Promise<void> => {
    const connections = (await prisma.ssoConnection.findMany({
      orderBy: { provider: "asc" },
    })) as any[];

    res.json(
      connections.map((c) => ({
        id: c.id,
        provider: c.provider,
        domain: c.domain,
        enabled: c.enabled,
        hasClientId: !!c.providerClientId,
        hasIssuerUrl: !!c.providerIssuerUrl,
        metadata: c.metadata,
        createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : new Date(c.createdAt).toISOString(),
      })),
    );
  },
);

router.get(
  "/auth/sso/providers/:provider",
  async (req: Request, res: Response): Promise<void> => {
    const connection = (await prisma.ssoConnection.findFirst({
      where: { provider: String(req.params.provider) },
    })) as any;

    if (!connection) {
      res.status(404).json({ error: "SSO provider not configured" });
      return;
    }

    res.json({
      id: connection.id,
      provider: connection.provider,
      providerClientId: connection.providerClientId,
      providerIssuerUrl: connection.providerIssuerUrl,
      enabled: connection.enabled,
      domain: connection.domain,
      metadata: connection.metadata,
      createdAt: connection.createdAt instanceof Date ? connection.createdAt.toISOString() : new Date(connection.createdAt).toISOString(),
      updatedAt: connection.updatedAt instanceof Date ? connection.updatedAt.toISOString() : new Date(connection.updatedAt).toISOString(),
    });
  },
);

router.post(
  "/auth/sso/configure",
  async (req: Request, res: Response): Promise<void> => {
    const { provider, clientId, clientSecret, issuerUrl, domain, metadata } =
      req.body as {
        provider: string;
        clientId: string;
        clientSecret: string;
        issuerUrl?: string;
        domain?: string;
        metadata?: string;
      };

    if (!provider || !clientId || !clientSecret) {
      res
        .status(400)
        .json({ error: "provider, clientId, and clientSecret are required" });
      return;
    }

    const validProviders = [
      "google", "github", "microsoft", "azure_ad", "okta", "saml", "oidc", "custom",
    ];
    if (!validProviders.includes(provider)) {
      res.status(400).json({ error: `Invalid provider. Must be one of: ${validProviders.join(", ")}` });
      return;
    }

    const existing = (await prisma.ssoConnection.findFirst({
      where: { provider },
    })) as any;

    if (existing) {
      await prisma.ssoConnection.update({
        where: { id: existing.id },
        data: {
          providerClientId: clientId,
          providerClientSecret: clientSecret,
          providerIssuerUrl: issuerUrl,
          domain,
          metadata: metadata ?? existing.metadata,
        } as any,
      });

      res.json({ success: true, message: "SSO configuration updated" });
    } else {
      await prisma.ssoConnection.create({
        data: {
          provider,
          providerClientId: clientId,
          providerClientSecret: clientSecret,
          providerIssuerUrl: issuerUrl,
          domain,
          metadata: metadata ?? null,
        } as any,
      });

      res.json({ success: true, message: "SSO provider configured" });
    }
  },
);

router.patch(
  "/auth/sso/:provider/toggle",
  async (req: Request, res: Response): Promise<void> => {
    const provider = String(req.params.provider);
    const { enabled } = req.body as { enabled: boolean };

    const existing = (await prisma.ssoConnection.findFirst({
      where: { provider },
    })) as any;

    if (!existing) {
      res.status(404).json({ error: "SSO provider not found" });
      return;
    }

    await prisma.ssoConnection.update({
      where: { id: existing.id },
      data: { enabled } as any,
    });

    res.json({ success: true, enabled });
  },
);

router.delete(
  "/auth/sso/:provider",
  async (req: Request, res: Response): Promise<void> => {
    const provider = String(req.params.provider);
    await prisma.ssoConnection.deleteMany({
      where: { provider },
    });
    res.status(204).end();
  },
);

function buildAuthorizeUrl(
  provider: string,
  connection: any,
  state: string,
): string {
  const baseConfigs: Record<string, { authorizeUrl: string; scope: string }> = {
    google: {
      authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      scope: "openid email profile",
    },
    github: {
      authorizeUrl: "https://github.com/login/oauth/authorize",
      scope: "read:user user:email",
    },
    microsoft: {
      authorizeUrl: `${connection.providerIssuerUrl ?? "https://login.microsoftonline.com/common"}/oauth2/v2.0/authorize`,
      scope: "openid email profile",
    },
    azure_ad: {
      authorizeUrl: `${connection.providerIssuerUrl ?? "https://login.microsoftonline.com/{tenant-id}"}/oauth2/v2.0/authorize`,
      scope: "openid email profile",
    },
    okta: {
      authorizeUrl: `${connection.providerIssuerUrl ?? "https://{your-okta-domain}/oauth2/default"}/v1/authorize`,
      scope: "openid email profile",
    },
    saml: {
      authorizeUrl: connection.providerIssuerUrl ?? "",
      scope: "openid email profile",
    },
    oidc: {
      authorizeUrl: `${connection.providerIssuerUrl ?? ""}/authorize`,
      scope: "openid email profile",
    },
    custom: {
      authorizeUrl: connection.providerIssuerUrl ?? "",
      scope: "openid email profile",
    },
  };

  const config = baseConfigs[provider] ?? baseConfigs.custom;
  const redirectUri = `${process.env["PUBLIC_API_URL"] ?? ""}/api/auth/sso/${provider}/callback`;

  const params = new URLSearchParams({
    client_id: connection.providerClientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: config.scope,
    state,
  });

  if (provider === "saml") {
    return `${config.authorizeUrl}${config.authorizeUrl.includes("?") ? "&" : "?"}SAMLRequest=${Buffer.from(
      `<?xml version="1.0"?><samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" ID="${state}" Version="2.0" IssueInstant="${new Date().toISOString()}" Destination="${config.authorizeUrl}"><saml:Issuer xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">${connection.providerClientId}</saml:Issuer></samlp:AuthnRequest>`,
    ).toString("base64")}&RelayState=${state}`;
  }

  return `${config.authorizeUrl}?${params.toString()}`;
}

async function exchangeCodeForUserInfo(
  provider: string,
  connection: any,
  code: string,
): Promise<{ id: string; email: string; name: string } | null> {
  const redirectUri = `${process.env["PUBLIC_API_URL"] ?? ""}/api/auth/sso/${provider}/callback`;

  const tokenEndpointMap: Record<string, string> = {
    google: "https://oauth2.googleapis.com/token",
    github: "https://github.com/login/oauth/access_token",
    microsoft: `${connection.providerIssuerUrl ?? "https://login.microsoftonline.com/common"}/oauth2/v2.0/token`,
    azure_ad: `${connection.providerIssuerUrl ?? "https://login.microsoftonline.com/{tenant-id}"}/oauth2/v2.0/token`,
    okta: `${connection.providerIssuerUrl ?? ""}/v1/token`,
    oidc: `${connection.providerIssuerUrl ?? ""}/token`,
    saml: `${connection.providerIssuerUrl ?? ""}`,
  };

  const tokenUrl = tokenEndpointMap[provider];
  if (!tokenUrl) return null;

  try {
    if (provider === "saml") {
      const samlResponse = code;
      const decoded = Buffer.from(samlResponse, "base64").toString("utf-8");
      const emailMatch = decoded.match(/<saml:Attribute Name="email"[^>]*>\s*<saml:AttributeValue[^>]*>([^<]+)/);
      const nameMatch = decoded.match(/<saml:Attribute Name="name"[^>]*>\s*<saml:AttributeValue[^>]*>([^<]+)/);
      const nameIdMatch = decoded.match(/<saml:NameID[^>]*>([^<]+)/);

      return {
        id: nameIdMatch?.[1] ?? "saml-user",
        email: emailMatch?.[1] ?? "saml-user@unknown",
        name: nameMatch?.[1] ?? emailMatch?.[1]?.split("@")[0] ?? "SAML User",
      };
    }

    const tokenRes = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: connection.providerClientId,
        client_secret: connection.providerClientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) return null;
    const tokenData = (await tokenRes.json()) as {
      access_token?: string;
      id_token?: string;
    };

    const accessToken = tokenData.access_token;
    if (!accessToken) return null;

    let userInfoUrl: string | undefined;

    if (provider === "google") {
      userInfoUrl = "https://www.googleapis.com/oauth2/v2/userinfo";
    } else if (provider === "github") {
      userInfoUrl = "https://api.github.com/user";
    } else if (provider === "azure_ad" || provider === "microsoft") {
      userInfoUrl = `${connection.providerIssuerUrl ?? "https://login.microsoftonline.com/common"}/openid/userinfo`;
    } else if (provider === "okta" || provider === "oidc") {
      userInfoUrl = `${connection.providerIssuerUrl ?? ""}/userinfo`;
    }

    if (!userInfoUrl) return null;

    const userRes = await fetch(userInfoUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userRes.ok) return null;
    const userData = (await userRes.json()) as Record<string, string>;

    if (provider === "google") {
      return { id: userData.id, email: userData.email, name: userData.name };
    }
    if (provider === "github") {
      return {
        id: String(userData.id),
        email: userData.email ?? userData.login,
        name: userData.name ?? userData.login,
      };
    }

    return {
      id: String(userData.sub ?? userData.id),
      email: userData.email,
      name: userData.name,
    };
  } catch {
    return null;
  }
}

export default router;
