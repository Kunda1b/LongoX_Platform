import type { ActionContext, ActionResult } from "@autoflow/connector-runtime";

const SLACK_API = "https://slack.com/api";

async function slackRequest(token: string, method: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const response = await fetch(`${SLACK_API}/${method}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  return response.json() as Promise<Record<string, unknown>>;
}

export async function sendMessage(context: ActionContext): Promise<ActionResult> {
  const start = Date.now();
  const token = context.auth.credentials.accessToken as string ?? process.env.SLACK_BOT_TOKEN ?? "";
  const channel = String(context.config.channel ?? "#general");
  const text = String(context.config.text ?? "");
  const threadTs = context.config.threadTs as string | undefined;

  if (!token) return { success: false, data: {}, error: "SLACK_BOT_TOKEN not configured", durationMs: Date.now() - start };

  const data = await slackRequest(token, "chat.postMessage", { channel, text, thread_ts: threadTs });
  if (!data.ok) return { success: false, data: {}, error: String(data.error ?? "Slack API error"), durationMs: Date.now() - start };

  return { success: true, data: { ts: data.ts, channel, ok: true }, error: null, durationMs: Date.now() - start };
}

export async function createChannel(context: ActionContext): Promise<ActionResult> {
  const start = Date.now();
  const token = context.auth.credentials.accessToken as string ?? process.env.SLACK_BOT_TOKEN ?? "";
  const name = String(context.config.name ?? "");
  const isPrivate = Boolean(context.config.isPrivate ?? false);

  if (!token) return { success: false, data: {}, error: "SLACK_BOT_TOKEN not configured", durationMs: Date.now() - start };
  if (!name) return { success: false, data: {}, error: "Channel name is required", durationMs: Date.now() - start };

  const data = await slackRequest(token, isPrivate ? "groups.create" : "conversations.create", { name });
  if (!data.ok) return { success: false, data: {}, error: String(data.error ?? "Slack API error"), durationMs: Date.now() - start };

  const channel = data.channel as Record<string, unknown> ?? {};
  return { success: true, data: { id: channel.id, name: channel.name, isPrivate }, error: null, durationMs: Date.now() - start };
}

export async function inviteUser(context: ActionContext): Promise<ActionResult> {
  const start = Date.now();
  const token = context.auth.credentials.accessToken as string ?? process.env.SLACK_BOT_TOKEN ?? "";
  const channel = String(context.config.channel ?? "");
  const userId = String(context.config.userId ?? "");

  if (!token) return { success: false, data: {}, error: "SLACK_BOT_TOKEN not configured", durationMs: Date.now() - start };

  const data = await slackRequest(token, "conversations.invite", { channel, users: userId });
  if (!data.ok) return { success: false, data: {}, error: String(data.error ?? "Slack API error"), durationMs: Date.now() - start };

  return { success: true, data: { ok: true }, error: null, durationMs: Date.now() - start };
}
