export const notionAuthConfig = {
  type: "oauth2" as const,
  authorizeUrl: "https://api.notion.com/v1/oauth/authorize",
  tokenUrl: "https://api.notion.com/v1/oauth/token",
  scopes: [],
  clientIdEnv: "NOTION_CLIENT_ID",
  clientSecretEnv: "NOTION_CLIENT_SECRET",
};
