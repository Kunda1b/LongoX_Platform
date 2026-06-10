import type { ActionContext, ActionResult } from "@longox/connector-runtime";

export async function createCustomer(
  context: ActionContext,
): Promise<ActionResult> {
  const start = Date.now();
  const apiKey =
    (context.auth.credentials.apiKey as string) ??
    process.env.STRIPE_SECRET_KEY ??
    "";
  const { email, name, description } = context.config as Record<string, string>;

  if (!apiKey)
    return {
      success: false,
      data: {},
      error: "STRIPE_SECRET_KEY not configured",
      durationMs: Date.now() - start,
    };

  const response = await fetch("https://api.stripe.com/v1/customers", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Bearer ${apiKey}`,
    },
    body: new URLSearchParams({
      email: email ?? "",
      name: name ?? "",
      description: description ?? "",
    }),
  });

  const data = (await response.json()) as {
    id?: string;
    error?: { message: string };
  };
  if (!data.id)
    return {
      success: false,
      data: {},
      error: String(data.error?.message ?? "Stripe API error"),
      durationMs: Date.now() - start,
    };

  return {
    success: true,
    data: { id: data.id, email },
    error: null,
    durationMs: Date.now() - start,
  };
}

export async function createInvoice(
  context: ActionContext,
): Promise<ActionResult> {
  const start = Date.now();
  const apiKey =
    (context.auth.credentials.apiKey as string) ??
    process.env.STRIPE_SECRET_KEY ??
    "";
  const { customerId, amount, currency, description } =
    context.config as Record<string, string>;

  if (!apiKey)
    return {
      success: false,
      data: {},
      error: "STRIPE_SECRET_KEY not configured",
      durationMs: Date.now() - start,
    };

  const response = await fetch("https://api.stripe.com/v1/invoices", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Bearer ${apiKey}`,
    },
    body: new URLSearchParams({
      customer: customerId,
      description: description ?? "",
    }),
  });

  const data = (await response.json()) as {
    id?: string;
    error?: { message: string };
  };
  if (!data.id)
    return {
      success: false,
      data: {},
      error: String(data.error?.message ?? "Stripe API error"),
      durationMs: Date.now() - start,
    };

  return {
    success: true,
    data: { id: data.id, amount: Number(amount), status: "draft" },
    error: null,
    durationMs: Date.now() - start,
  };
}

export async function createPaymentIntent(
  context: ActionContext,
): Promise<ActionResult> {
  const start = Date.now();
  const apiKey =
    (context.auth.credentials.apiKey as string) ??
    process.env.STRIPE_SECRET_KEY ??
    "";
  const { amount, currency, customerId } = context.config as Record<
    string,
    string
  >;

  if (!apiKey)
    return {
      success: false,
      data: {},
      error: "STRIPE_SECRET_KEY not configured",
      durationMs: Date.now() - start,
    };

  const params: Record<string, string> = {
    amount: String(Math.round(Number(amount) * 100)),
    currency: currency ?? "usd",
  };
  if (customerId) params.customer = customerId;

  const response = await fetch("https://api.stripe.com/v1/payment_intents", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Bearer ${apiKey}`,
    },
    body: new URLSearchParams(params),
  });

  const data = (await response.json()) as {
    id?: string;
    error?: { message: string };
    amount?: number;
    status?: string;
  };
  if (!data.id)
    return {
      success: false,
      data: {},
      error: String(data.error?.message ?? "Stripe API error"),
      durationMs: Date.now() - start,
    };

  return {
    success: true,
    data: { id: data.id, amount: data.amount, status: data.status },
    error: null,
    durationMs: Date.now() - start,
  };
}

export async function createProduct(
  context: ActionContext,
): Promise<ActionResult> {
  const start = Date.now();
  const apiKey =
    (context.auth.credentials.apiKey as string) ??
    process.env.STRIPE_SECRET_KEY ??
    "";
  const { name, description } = context.config as Record<string, string>;

  if (!apiKey)
    return {
      success: false,
      data: {},
      error: "STRIPE_SECRET_KEY not configured",
      durationMs: Date.now() - start,
    };

  const response = await fetch("https://api.stripe.com/v1/products", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Bearer ${apiKey}`,
    },
    body: new URLSearchParams({
      name: name ?? "",
      description: description ?? "",
    }),
  });

  const data = (await response.json()) as {
    id?: string;
    error?: { message: string };
  };
  return {
    success: true,
    data: { id: String(data.id ?? ""), name },
    error: null,
    durationMs: Date.now() - start,
  };
}
