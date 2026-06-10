import type { ActionContext, ActionResult } from "@autoflow/connector-runtime";

const PAYPAL_API = process.env.PAYPAL_SANDBOX === "true"
  ? "https://api-m.sandbox.paypal.com"
  : "https://api-m.paypal.com";

async function getAccessToken(clientId: string, secret: string): Promise<string> {
  const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString("base64")}`,
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
  });
  const data = await response.json() as { access_token?: string };
  return data.access_token ?? "";
}

async function paypalRequest(token: string, path: string, method: string, body?: unknown): Promise<Record<string, unknown>> {
  const response = await fetch(`${PAYPAL_API}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return response.json() as Promise<Record<string, unknown>>;
}

export async function createOrder(context: ActionContext): Promise<ActionResult> {
  const start = Date.now();
  const clientId = process.env.PAYPAL_CLIENT_ID ?? "";
  const secret = process.env.PAYPAL_CLIENT_SECRET ?? "";
  const { amount, currency, description } = context.config as Record<string, string>;

  if (!clientId) return { success: false, data: {}, error: "PAYPAL_CLIENT_ID not configured", durationMs: Date.now() - start };

  const token = await getAccessToken(clientId, secret);
  const data = await paypalRequest(token, "/v2/checkout/orders", "POST", {
    intent: "CAPTURE",
    purchase_units: [{ amount: { currency_code: currency ?? "USD", value: String(amount) }, description: description ?? "" }],
  });

  return { success: true, data: { id: String(data.id ?? ""), status: String(data.status ?? "") }, error: null, durationMs: Date.now() - start };
}

export async function captureOrder(context: ActionContext): Promise<ActionResult> {
  const start = Date.now();
  const clientId = process.env.PAYPAL_CLIENT_ID ?? "";
  const secret = process.env.PAYPAL_CLIENT_SECRET ?? "";
  const orderId = String(context.config.orderId ?? "");

  const token = await getAccessToken(clientId, secret);
  const data = await paypalRequest(token, `/v2/checkout/orders/${orderId}/capture`, "POST");

  return { success: true, data: { id: String(data.id ?? ""), status: String(data.status ?? "") }, error: null, durationMs: Date.now() - start };
}

export async function createProduct(context: ActionContext): Promise<ActionResult> {
  const start = Date.now();
  const clientId = process.env.PAYPAL_CLIENT_ID ?? "";
  const secret = process.env.PAYPAL_CLIENT_SECRET ?? "";
  const { name, description, type } = context.config as Record<string, string>;

  const token = await getAccessToken(clientId, secret);
  const data = await paypalRequest(token, "/v1/catalogs/products", "POST", {
    name: name ?? "New Product",
    description: description ?? "",
    type: type ?? "SERVICE",
  });

  return { success: true, data: { id: String(data.id ?? ""), name }, error: null, durationMs: Date.now() - start };
}

export async function createSubscription(context: ActionContext): Promise<ActionResult> {
  const start = Date.now();
  const clientId = process.env.PAYPAL_CLIENT_ID ?? "";
  const secret = process.env.PAYPAL_CLIENT_SECRET ?? "";
  const { planId, subscriberEmail } = context.config as Record<string, string>;

  const token = await getAccessToken(clientId, secret);
  const data = await paypalRequest(token, "/v1/billing/subscriptions", "POST", {
    plan_id: planId,
    subscriber: { email_address: subscriberEmail },
  });

  return { success: true, data: { id: String(data.id ?? ""), status: String(data.status ?? "APPROVAL_PENDING") }, error: null, durationMs: Date.now() - start };
}
