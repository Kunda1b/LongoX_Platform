export const hubspotAuthConfig = {
  type: "oauth2" as const,
  authorizeUrl: "https://app.hubspot.com/oauth/authorize",
  tokenUrl: "https://api.hubapi.com/oauth/v1/token",
  scopes: ["contacts", "companies", "deals", "content"],
  clientIdEnv: "HUBSPOT_CLIENT_ID",
  clientSecretEnv: "HUBSPOT_CLIENT_SECRET",
};
