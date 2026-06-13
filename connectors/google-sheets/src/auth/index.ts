export const slackAuthConfig = {
  type: "oauth2" as const,
  authorizeUrl: "https://slack.com/oauth/v2/authorize",
  tokenUrl: "https://slack.com/api/oauth.v2.access",
  scopes: [
    "channels:read",
    "channels:write",
    "chat:write",
    "users:read",
    "incoming-webhook",
  ],
  clientIdEnv: "SLACK_CLIENT_ID",
  clientSecretEnv: "SLACK_CLIENT_SECRET",
};
