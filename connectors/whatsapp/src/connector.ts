import type { ConnectorDefinition } from "@longox/connector-runtime";
import { connectorRegistry } from "@longox/connector-runtime";
import {
  sendTextMessage,
  sendTemplate,
  sendMedia,
  createTemplate,
} from "./actions";
import { incomingMessage, messageStatus, templateApproved } from "./triggers";

export const whatsappConnector: ConnectorDefinition = {
  name: "whatsapp",
  version: "1.0.0",
  auth: ["api_key"],
  actions: [
    {
      id: "sendTextMessage",
      name: "Send Text Message",
      description: "Send a WhatsApp text message",
      inputSchema: { to: "string", text: "string", previewUrl: "boolean?" },
      outputSchema: { messageId: "string", status: "string" },
      idempotent: false,
    },
    {
      id: "sendTemplate",
      name: "Send Template",
      description: "Send a WhatsApp template message",
      inputSchema: {
        to: "string",
        templateName: "string",
        language: "string?",
        components: "array?",
      },
      outputSchema: { messageId: "string", status: "string" },
      idempotent: false,
    },
    {
      id: "sendMedia",
      name: "Send Media",
      description: "Send a media message (image, video, document)",
      inputSchema: {
        to: "string",
        mediaUrl: "string",
        mediaType: "string",
        caption: "string?",
      },
      outputSchema: { messageId: "string", status: "string" },
      idempotent: false,
    },
    {
      id: "createTemplate",
      name: "Create Template",
      description: "Create a message template",
      inputSchema: {
        name: "string",
        language: "string?",
        category: "string?",
        components: "array",
      },
      outputSchema: { templateId: "string", name: "string", status: "string" },
      idempotent: true,
    },
  ],
  triggers: [
    {
      id: "incomingMessage",
      name: "Incoming Message",
      description: "Trigger when a message is received",
      type: "webhook",
      outputSchema: { from: "string", text: "string", timestamp: "string" },
    },
    {
      id: "messageStatus",
      name: "Message Status",
      description: "Trigger when message status changes",
      type: "webhook",
      outputSchema: {
        messageId: "string",
        status: "string",
        timestamp: "string",
      },
    },
    {
      id: "templateApproved",
      name: "Template Approved",
      description: "Trigger when a template is approved",
      type: "webhook",
      outputSchema: {
        templateName: "string",
        status: "string",
        approvedAt: "string",
      },
    },
  ],
  permissions: [
    "messages.read",
    "messages.write",
    "templates.read",
    "templates.write",
    "media.read",
    "media.write",
  ],
};

connectorRegistry.register(whatsappConnector);
connectorRegistry.registerAction("whatsapp", {
  definition: whatsappConnector.actions[0],
  handler: sendTextMessage,
});
connectorRegistry.registerAction("whatsapp", {
  definition: whatsappConnector.actions[1],
  handler: sendTemplate,
});
connectorRegistry.registerAction("whatsapp", {
  definition: whatsappConnector.actions[2],
  handler: sendMedia,
});
connectorRegistry.registerAction("whatsapp", {
  definition: whatsappConnector.actions[3],
  handler: createTemplate,
});
connectorRegistry.registerTrigger("whatsapp", {
  definition: whatsappConnector.triggers[0],
  handler: incomingMessage,
});
connectorRegistry.registerTrigger("whatsapp", {
  definition: whatsappConnector.triggers[1],
  handler: messageStatus,
});
connectorRegistry.registerTrigger("whatsapp", {
  definition: whatsappConnector.triggers[2],
  handler: templateApproved,
});

export default whatsappConnector;
