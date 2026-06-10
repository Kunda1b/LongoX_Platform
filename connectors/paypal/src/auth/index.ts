export const paypalAuthConfig = {
  type: "oauth2" as const,
  authorizeUrl: "https://www.paypal.com/connect",
  tokenUrl: "https://api-m.paypal.com/v1/oauth2/token",
  scopes: ["openid", "email", "profile"],
  clientIdEnv: "PAYPAL_CLIENT_ID",
  clientSecretEnv: "PAYPAL_CLIENT_SECRET",
};
