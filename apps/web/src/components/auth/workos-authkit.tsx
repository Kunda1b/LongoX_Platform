"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";

interface WorkOSAuthKitProps {
  redirectUri?: string;
  clientId?: string;
  buttonLabel?: string;
  className?: string;
}

export function WorkOSAuthKit({
  redirectUri,
  clientId,
  buttonLabel = "Continue with SSO",
  className,
}: WorkOSAuthKitProps) {
  const [loading, setLoading] = useState(false);

  const handleLogin = useCallback(() => {
    setLoading(true);
    const cid = clientId ?? process.env.NEXT_PUBLIC_WORKOS_CLIENT_ID ?? "";
    const redirect = redirectUri ?? `${window.location.origin}/auth/workos/callback`;

    const params = new URLSearchParams({
      client_id: cid,
      redirect_uri: redirect,
      response_type: "code",
      provider: "authkit",
    });

    window.location.href = `${process.env.NEXT_PUBLIC_API_URL ?? "/api"}/auth/workos/authorize?${params.toString()}`;
  }, [redirectUri, clientId]);

  if (!process.env.NEXT_PUBLIC_WORKOS_CLIENT_ID) {
    return null;
  }

  return (
    <Button
      variant="outline"
      className={`w-full gap-2 ${className ?? ""}`}
      onClick={handleLogin}
      disabled={loading}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        <LogIn className="h-4 w-4" />
      )}
      {buttonLabel}
    </Button>
  );
}
