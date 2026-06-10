export const salesforceAuthConfig = {
  type: "oauth2" as const,
  authorizeUrl: "https://login.salesforce.com/services/oauth2/authorize",
  tokenUrl: "https://login.salesforce.com/services/oauth2/token",
  scopes: ["api", "refresh_token"],
  clientIdEnv: "SALESFORCE_CLIENT_ID",
  clientSecretEnv: "SALESFORCE_CLIENT_SECRET",
};
