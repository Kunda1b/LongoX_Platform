/**
 * Lightweight API client for apps/web.
 *
 * This is a thin fetch wrapper that handles auth tokens and JSON parsing.
 * It mirrors the axios call shape (`apiClient.get(path, { params })` returning
 * `{ data, status }`) so that existing hooks (use-execution, use-workflow)
 * work without modification.
 *
 * For new code, prefer the generated typed functions from
 * `@longox/api-client-react`. This module is for hooks that need a generic
 * fetch wrapper (e.g. SSE endpoints, ad-hoc queries during migration).
 */

export interface ApiClientResponse<T> {
  data: T;
  status: number;
}

export interface ApiClientRequestConfig {
  /** Query string params (object → URLSearchParams). */
  params?: Record<string, string | number | boolean | undefined>;
  /** Request headers. */
  headers?: Record<string, string>;
  /** Request body (for POST/PUT/PATCH). Will be JSON.stringify'd. */
  body?: unknown;
  /** Raw RequestInit override (fetch options). */
  signal?: AbortSignal;
}

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("auth");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { token?: string };
    return parsed.token ?? null;
  } catch {
    return null;
  }
}

function buildUrl(
  path: string,
  params?: ApiClientRequestConfig["params"],
): string {
  if (!params) return path;
  const url = new URL(
    path,
    typeof window !== "undefined" ? window.location.origin : "http://localhost",
  );
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  }
  // Return as a relative path (preserves the original path prefix).
  return url.pathname + url.search;
}

async function request<T>(
  path: string,
  config: ApiClientRequestConfig = {},
  method: string = "GET",
): Promise<ApiClientResponse<T>> {
  const token = getAuthToken();
  const headers = new Headers(config.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (config.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const url = buildUrl(path, config.params);
  const res = await fetch(url, {
    method,
    headers,
    body: config.body !== undefined ? JSON.stringify(config.body) : undefined,
    signal: config.signal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status} ${res.statusText}: ${text}`);
  }

  let data: T;
  if (res.status === 204) {
    data = undefined as T;
  } else {
    const contentType = res.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      data = (await res.json()) as T;
    } else {
      data = (await res.text()) as unknown as T;
    }
  }

  return { data, status: res.status };
}

export const apiClient = {
  get: <T>(path: string, config?: ApiClientRequestConfig) =>
    request<T>(path, config, "GET"),
  post: <T>(path: string, body?: unknown, config?: ApiClientRequestConfig) =>
    request<T>(path, { ...config, body }, "POST"),
  put: <T>(path: string, body?: unknown, config?: ApiClientRequestConfig) =>
    request<T>(path, { ...config, body }, "PUT"),
  patch: <T>(path: string, body?: unknown, config?: ApiClientRequestConfig) =>
    request<T>(path, { ...config, body }, "PATCH"),
  delete: <T>(path: string, config?: ApiClientRequestConfig) =>
    request<T>(path, config, "DELETE"),
};

export default apiClient;
