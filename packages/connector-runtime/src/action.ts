import type { ActionContext, ActionResult } from "./types";
import { validateAuth, getAuthHeaders } from "./auth";

export async function executeHttpAction(
  context: ActionContext,
): Promise<ActionResult> {
  const { config, auth, input } = context;
  const url = String(config.url ?? "");
  if (!url) {
    return {
      success: false,
      data: {},
      error: "URL is required",
      durationMs: 0,
    };
  }

  const authValidation = validateAuth(auth);
  if (!authValidation.valid) {
    return {
      success: false,
      data: {},
      error: authValidation.error ?? "Invalid auth",
      durationMs: 0,
    };
  }

  const method = String(config.method ?? "GET").toUpperCase();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...getAuthHeaders(auth),
    ...((config.headers as Record<string, string>) ?? {}),
  };

  const hasBody = ["POST", "PUT", "PATCH"].includes(method);
  const body = hasBody ? JSON.stringify(config.body ?? input) : undefined;

  const startMs = Date.now();
  try {
    const response = await fetch(url, { method, headers, body });
    const responseTimeMs = Date.now() - startMs;

    let responseBody: unknown;
    const contentType = response.headers.get("content-type") ?? "";
    try {
      responseBody = contentType.includes("application/json")
        ? await response.json()
        : await response.text();
    } catch {
      responseBody = null;
    }

    if (!response.ok) {
      return {
        success: false,
        data: { statusCode: response.status, body: responseBody },
        error: `HTTP ${response.status} ${response.statusText}`,
        durationMs: responseTimeMs,
      };
    }

    return {
      success: true,
      data: {
        statusCode: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseBody,
        responseTimeMs,
      },
      error: null,
      durationMs: responseTimeMs,
    };
  } catch (err) {
    return {
      success: false,
      data: {},
      error: err instanceof Error ? err.message : String(err),
      durationMs: Date.now() - startMs,
    };
  }
}
