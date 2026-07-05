"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { LogIn, UserPlus } from "lucide-react";

interface WorkOSAuthKitProps {
  redirectUri?: string;
  clientId?: string;
  buttonLabel?: string;
  className?: string;
  mode?: "login" | "register";
}

export function WorkOSAuthKit({
  redirectUri,
  clientId,
  buttonLabel,
  className,
  mode = "login",
}: WorkOSAuthKitProps) {
  const [loading, setLoading] = useState(false);

  const handleRedirect = useCallback(() => {
    setLoading(true);
    const cid = clientId ?? process.env.NEXT_PUBLIC_WORKOS_CLIENT_ID ?? "";
    const redirect =
      redirectUri ?? `${window.location.origin}/auth/workos/callback`;

    const params = new URLSearchParams({
      client_id: cid,
      redirect_uri: redirect,
      response_type: "code",
      provider: "authkit",
    });

    if (mode === "register") {
      params.set("screen_hint", "sign_up");
    }

    window.location.href = `${process.env.NEXT_PUBLIC_API_URL ?? "/api"}/auth/workos/authorize?${params.toString()}`;
  }, [redirectUri, clientId, mode]);

  if (!process.env.NEXT_PUBLIC_WORKOS_CLIENT_ID) {
    return null;
  }

  const isRegister = mode === "register";
  const label =
    buttonLabel ??
    (isRegister ? "Create account with WorkOS" : "Sign in with WorkOS");
  const Icon = isRegister ? UserPlus : LogIn;

  return (
    <Button
      variant="outline"
      className={`w-full gap-2 ${className ?? ""}`}
      onClick={handleRedirect}
      disabled={loading}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        <Icon className="h-4 w-4" />
      )}
      {label}
    </Button>
  );
}
