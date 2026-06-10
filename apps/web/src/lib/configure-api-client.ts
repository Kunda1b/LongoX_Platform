import { setAuthTokenGetter, setBaseUrl } from "@longox/api-client-react";

function readStoredToken(): string | null {
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

let configured = false;

/** Configure the generated API client for browser requests. Safe to call multiple times. */
export function configureApiClient(): void {
  if (configured) return;
  configured = true;

  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ?? "";
  setBaseUrl(baseUrl || null);
  setAuthTokenGetter(() => readStoredToken());
}
