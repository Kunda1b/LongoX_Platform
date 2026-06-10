export const slackSchemas = {
  sendMessage: {
    input: {
      type: "object",
      properties: {
        channel: { type: "string", description: "Slack channel ID or name" },
        text: { type: "string", description: "Message text" },
        threadTs: { type: "string", description: "Thread timestamp to reply in thread" },
      },
      required: ["channel", "text"],
    },
    output: {
      type: "object",
      properties: {
        ts: { type: "string" },
        channel: { type: "string" },
        ok: { type: "boolean" },
      },
    },
  },
  createChannel: {
    input: {
      type: "object",
      properties: {
        name: { type: "string", description: "Channel name" },
        isPrivate: { type: "boolean", description: "Make private channel" },
      },
      required: ["name"],
    },
    output: {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        isPrivate: { type: "boolean" },
      },
    },
  },
};
