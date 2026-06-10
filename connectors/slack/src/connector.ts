import type { ConnectorDefinition } from "@longox/connector-runtime";
import { connectorRegistry } from "@longox/connector-runtime";
import { sendMessage, createChannel, inviteUser } from "./actions";
import { newMessage, mention } from "./triggers";

export const slackConnector: ConnectorDefinition = {
  name: "slack",
  version: "1.0.0",
  auth: ["oauth2", "api_key"],
  actions: [
    {
      id: "sendMessage",
      name: "Send Message",
      description: "Post a message to a Slack channel",
      inputSchema: { channel: "string", text: "string", threadTs: "string?" },
      outputSchema: { ts: "string", channel: "string", ok: "boolean" },
      idempotent: false,
    },
    {
      id: "createChannel",
      name: "Create Channel",
      description: "Create a new Slack channel",
      inputSchema: { name: "string", isPrivate: "boolean?" },
      outputSchema: { id: "string", name: "string", isPrivate: "boolean" },
      idempotent: true,
    },
    {
      id: "inviteUser",
      name: "Invite User",
      description: "Invite a user to a channel",
      inputSchema: { channel: "string", userId: "string" },
      outputSchema: { ok: "boolean" },
      idempotent: false,
    },
  ],
  triggers: [
    {
      id: "newMessage",
      name: "New Message",
      description: "Trigger when a new message is posted",
      type: "webhook",
      outputSchema: {
        text: "string",
        user: "string",
        channel: "string",
        ts: "string",
      },
    },
    {
      id: "mention",
      name: "Mention",
      description: "Trigger when the bot is mentioned",
      type: "webhook",
      outputSchema: {
        text: "string",
        user: "string",
        channel: "string",
        ts: "string",
      },
    },
  ],
  permissions: ["channels:read", "channels:write", "chat:write", "users:read"],
};

connectorRegistry.register(slackConnector);
connectorRegistry.registerAction("slack", {
  definition: slackConnector.actions[0],
  handler: sendMessage,
});
connectorRegistry.registerAction("slack", {
  definition: slackConnector.actions[1],
  handler: createChannel,
});
connectorRegistry.registerAction("slack", {
  definition: slackConnector.actions[2],
  handler: inviteUser,
});
connectorRegistry.registerTrigger("slack", {
  definition: slackConnector.triggers[0],
  handler: newMessage,
});
connectorRegistry.registerTrigger("slack", {
  definition: slackConnector.triggers[1],
  handler: mention,
});

export default slackConnector;
