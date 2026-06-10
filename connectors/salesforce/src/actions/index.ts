import type { ActionContext, ActionResult } from "@autoflow/connector-runtime";

const SF_API = "https://your-instance.salesforce.com/services/data/v58.0";

async function sfRequest(instanceUrl: string, token: string, path: string, method: string, body?: unknown): Promise<Record<string, unknown>> {
  const response = await fetch(`${instanceUrl}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return response.json() as Promise<Record<string, unknown>>;
}

export async function createRecord(context: ActionContext): Promise<ActionResult> {
  const start = Date.now();
  const token = context.auth.credentials.accessToken as string ?? "";
  const instanceUrl = context.auth.credentials.instanceUrl as string ?? "";
  const objectType = String(context.config.objectType ?? "Account");
  const data = context.config.data as Record<string, unknown> ?? {};

  if (!token) return { success: false, data: {}, error: "Salesforce token not configured", durationMs: Date.now() - start };

  const result = await sfRequest(instanceUrl, token, `/sobjects/${objectType}/`, "POST", data);
  return { success: !!result.id, data: { id: String(result.id ?? ""), success: !!result.id }, error: result.id ? null : "Failed to create record", durationMs: Date.now() - start };
}

export async function updateRecord(context: ActionContext): Promise<ActionResult> {
  const start = Date.now();
  const token = context.auth.credentials.accessToken as string ?? "";
  const instanceUrl = context.auth.credentials.instanceUrl as string ?? "";
  const objectType = String(context.config.objectType ?? "Account");
  const recordId = String(context.config.recordId ?? "");
  const data = context.config.data as Record<string, unknown> ?? {};

  if (!token) return { success: false, data: {}, error: "Salesforce token not configured", durationMs: Date.now() - start };

  await sfRequest(instanceUrl, token, `/sobjects/${objectType}/${recordId}`, "PATCH", data);
  return { success: true, data: { success: true }, error: null, durationMs: Date.now() - start };
}

export async function queryRecords(context: ActionContext): Promise<ActionResult> {
  const start = Date.now();
  const token = context.auth.credentials.accessToken as string ?? "";
  const instanceUrl = context.auth.credentials.instanceUrl as string ?? "";
  const query = String(context.config.query ?? "SELECT Id, Name FROM Account LIMIT 10");

  if (!token) return { success: false, data: {}, error: "Salesforce token not configured", durationMs: Date.now() - start };

  const result = await sfRequest(instanceUrl, token, `/query?q=${encodeURIComponent(query)}`, "GET");
  return {
    success: true,
    data: { records: (result.records as unknown[]) ?? [], totalSize: result.totalSize as number ?? 0 },
    error: null,
    durationMs: Date.now() - start,
  };
}
