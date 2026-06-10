import type { ActionContext, ActionResult } from "@autoflow/connector-runtime";

const HUBSPOT_API = "https://api.hubapi.com";

async function hubspotRequest(token: string, path: string, method: string, body?: unknown): Promise<Record<string, unknown>> {
  const response = await fetch(`${HUBSPOT_API}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return response.json() as Promise<Record<string, unknown>>;
}

export async function createContact(context: ActionContext): Promise<ActionResult> {
  const start = Date.now();
  const token = context.auth.credentials.accessToken as string ?? "";
  const { email, firstName, lastName, phone } = context.config as Record<string, string>;

  if (!token) return { success: false, data: {}, error: "HubSpot token not configured", durationMs: Date.now() - start };
  if (!email) return { success: false, data: {}, error: "Email is required", durationMs: Date.now() - start };

  const data = await hubspotRequest(token, "/crm/v3/objects/contacts", "POST", {
    properties: { email, firstname: firstName, lastname: lastName, phone },
  });

  if (!data.id) return { success: false, data: {}, error: String(data.message ?? "HubSpot API error"), durationMs: Date.now() - start };

  return { success: true, data: { id: String(data.id), email }, error: null, durationMs: Date.now() - start };
}

export async function createCompany(context: ActionContext): Promise<ActionResult> {
  const start = Date.now();
  const token = context.auth.credentials.accessToken as string ?? "";
  const { name, domain } = context.config as Record<string, string>;

  if (!token) return { success: false, data: {}, error: "HubSpot token not configured", durationMs: Date.now() - start };

  const data = await hubspotRequest(token, "/crm/v3/objects/companies", "POST", {
    properties: { name, domain },
  });

  return { success: true, data: { id: String(data.id ?? ""), name }, error: null, durationMs: Date.now() - start };
}

export async function createDeal(context: ActionContext): Promise<ActionResult> {
  const start = Date.now();
  const token = context.auth.credentials.accessToken as string ?? "";
  const { dealName, amount, dealStage } = context.config as Record<string, string>;

  if (!token) return { success: false, data: {}, error: "HubSpot token not configured", durationMs: Date.now() - start };

  const data = await hubspotRequest(token, "/crm/v3/objects/deals", "POST", {
    properties: { dealname: dealName, amount, dealstage: dealStage ?? "appointmentscheduled" },
  });

  return { success: true, data: { id: String(data.id ?? ""), dealName }, error: null, durationMs: Date.now() - start };
}
