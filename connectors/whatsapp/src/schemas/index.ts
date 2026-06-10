export const whatsappSchemas = {
  sendTextMessage: {
    input: {
      type: "object",
      properties: {
        to: {
          type: "string",
          description: "Recipient phone number in international format",
        },
        text: { type: "string", description: "Message text" },
        previewUrl: { type: "boolean", description: "Show URL preview" },
      },
      required: ["to", "text"],
    },
    output: {
      type: "object",
      properties: {
        messageId: { type: "string" },
        status: { type: "string" },
      },
    },
  },
};
