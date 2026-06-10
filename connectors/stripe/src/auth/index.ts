export const stripeAuthConfig = {
  type: "api_key" as const,
  apiKeyEnv: "STRIPE_SECRET_KEY",
  headerName: "Authorization",
  prefix: "Bearer",
};
