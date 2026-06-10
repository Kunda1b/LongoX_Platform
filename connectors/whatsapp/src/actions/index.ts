import type { ActionContext, ActionResult } from "@autoflow/connector-runtime";

const WHATSAPP_API = "https://graph.facebook.com/v18.0";

function getPhoneNumberId(): string {
  return process.env.WHATSAPP_PHONE_NUMBER_ID ?? "";
}

function getToken(context: ActionContext): string {
  return (context.auth.credentials.apiKey as string) ?? process.env.WHATSAPP_ACCESS_TOKEN ?? "";
}

async function sendWhatsAppRequest(token: string, payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  const phoneNumberId = getPhoneNumberId();
  const response = await fetch(`${WHATSAPP_API}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return response.json() as Promise<Record<string, unknown>>;
}

export async function sendTextMessage(context: ActionContext): Promise<ActionResult> {
  const start = Date.now();
  const token = getToken(context);
  const to = String(context.config.to ?? "");
  const text = String(context.config.text ?? "");
  const previewUrl = Boolean(context.config.previewUrl ?? false);

  if (!token) return { success: false, data: {}, error: "WhatsApp access token not configured", durationMs: Date.now() - start };
  if (!to) return { success: false, data: {}, error: "Recipient number is required", durationMs: Date.now() - start };
  if (!text) return { success: false, data: {}, error: "Message text is required", durationMs: Date.now() - start };

  const data = await sendWhatsAppRequest(token, {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "text",
    text: { preview_url: previewUrl, body: text },
  });

  if (data.error) return { success: false, data: {}, error: String((data.error as Record<string, unknown>).message ?? "WhatsApp API error"), durationMs: Date.now() - start };

  const messages = data.messages as Array<{ id: string }> ?? [];
  return { success: true, data: { messageId: messages[0]?.id ?? "", status: "sent" }, error: null, durationMs: Date.now() - start };
}

export async function sendTemplate(context: ActionContext): Promise<ActionResult> {
  const start = Date.now();
  const token = getToken(context);
  const to = String(context.config.to ?? "");
  const templateName = String(context.config.templateName ?? "");
  const language = String(context.config.language ?? "en_US");
  const components = (context.config.components ?? []) as unknown[];

  if (!to) return { success: false, data: {}, error: "Recipient number is required", durationMs: Date.now() - start };

  const data = await sendWhatsAppRequest(token, {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "template",
    template: { name: templateName, language: { code: language }, components: components.length > 0 ? components : undefined },
  });

  const messages = data.messages as Array<{ id: string }> ?? [];
  return { success: true, data: { messageId: messages[0]?.id ?? "", status: "sent" }, error: null, durationMs: Date.now() - start };
}

export async function sendMedia(context: ActionContext): Promise<ActionResult> {
  const start = Date.now();
  const token = getToken(context);
  const to = String(context.config.to ?? "");
  const mediaUrl = String(context.config.mediaUrl ?? "");
  const mediaType = String(context.config.mediaType ?? "image");
  const caption = String(context.config.caption ?? "");

  if (!to) return { success: false, data: {}, error: "Recipient number is required", durationMs: Date.now() - start };

  const data = await sendWhatsAppRequest(token, {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: mediaType,
    [mediaType]: { link: mediaUrl, caption: caption || undefined },
  });

  const messages = data.messages as Array<{ id: string }> ?? [];
  return { success: true, data: { messageId: messages[0]?.id ?? "", status: "sent" }, error: null, durationMs: Date.now() - start };
}

export async function createTemplate(context: ActionContext): Promise<ActionResult> {
  const start = Date.now();
  const token = getToken(context);
  const name = String(context.config.name ?? "");
  const language = String(context.config.language ?? "en_US");
  const category = String(context.config.category ?? "UTILITY");
  const components = (context.config.components ?? []) as unknown[];

  if (!name) return { success: false, data: {}, error: "Template name is required", durationMs: Date.now() - start };

  const response = await fetch(`${WHATSAPP_API}/${getPhoneNumberId()}/message_templates`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name,
      language,
      category,
      components,
    }),
  });

  const data = await response.json() as { id?: string; error?: { message: string } };
  return {
    success: true,
    data: { templateId: String(data.id ?? ""), name, status: "PENDING" },
    error: null,
    durationMs: Date.now() - start,
  };
}
