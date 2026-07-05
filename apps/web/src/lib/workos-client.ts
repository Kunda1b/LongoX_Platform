export interface WorkOSClientConfig {
  clientId: string;
  apiUrl?: string;
}

export function getWorkOSClientConfig(): WorkOSClientConfig | null {
  const clientId = process.env.NEXT_PUBLIC_WORKOS_CLIENT_ID;
  if (!clientId) return null;
  return {
    clientId,
    apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "/api",
  };
}

export function getAuthKitAuthorizationUrl(opts: {
  redirectUri?: string;
  state?: string;
  organizationId?: string;
}): string {
  const config = getWorkOSClientConfig();
  if (!config) return "#";

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri:
      opts.redirectUri ?? `${window.location.origin}/auth/workos/callback`,
    response_type: "code",
    provider: "authkit",
  });

  if (opts.state) params.set("state", opts.state);
  if (opts.organizationId) params.set("organization_id", opts.organizationId);

  return `${config.apiUrl}/auth/workos/authorize?${params.toString()}`;
}
