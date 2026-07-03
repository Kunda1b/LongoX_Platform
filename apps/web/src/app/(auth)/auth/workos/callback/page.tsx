"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import type { User } from "@/lib/auth";

const API = process.env.NEXT_PUBLIC_API_URL ?? "/api";

function CallbackHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      setError("No authorization code received");
      return;
    }

    async function exchangeCode() {
      const res = await fetch(`${API}/auth/workos/callback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Authentication failed" }));
        throw new Error(err.error);
      }

      const data = (await res.json()) as { token: string; user: User };
      localStorage.setItem("auth", JSON.stringify({ token: data.token, user: data.user }));
      router.push("/dashboard");
    }

    exchangeCode().catch((err) => setError(err instanceof Error ? err.message : "Authentication failed"));
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30">
      <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      <p className="ml-3 text-muted-foreground">Completing authentication...</p>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  );
}
