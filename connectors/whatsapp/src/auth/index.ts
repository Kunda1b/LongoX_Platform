export const whatsappAuthConfig = {
  type: "api_key" as const,
  fields: [
    { key: "apiKey", label: "WhatsApp Access Token", type: "string", required: true },
    { key: "phoneNumberId", label: "Phone Number ID", type: "string", required: true },
    { key: "businessAccountId", label: "Business Account ID", type: "string" },
  ],
};
