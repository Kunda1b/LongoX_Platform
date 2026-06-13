export const googleSheetsAuthConfig = {
  type: "oauth2" as const,
  authorizeUrl: "https://accounts.google.com/o/oauth2/auth",
  tokenUrl: "https://oauth2.googleapis.com/token",
  scopes: [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive.file",
  ],
  clientIdEnv: "GOOGLE_CLIENT_ID",
  clientSecretEnv: "GOOGLE_CLIENT_SECRET",
};
