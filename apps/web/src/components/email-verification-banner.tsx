"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { MailWarning, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmailVerificationBanner() {
  const { user, token } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  if (!user || user.emailVerifiedAt || dismissed) return null;

  const resend = async () => {
    setSending(true);
    try {
      await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      setSent(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex items-center gap-3 bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-sm text-amber-900">
      <MailWarning className="h-4 w-4 shrink-0 text-amber-600" />
      <span className="flex-1">
        Please verify your email address to unlock all features.{" "}
        {sent ? (
          <span className="font-medium text-green-700">Verification email sent!</span>
        ) : (
          <button
            type="button"
            onClick={resend}
            disabled={sending}
            className="inline-flex items-center gap-1 font-medium underline underline-offset-2 hover:no-underline disabled:opacity-60"
          >
            {sending && <RefreshCw className="h-3 w-3 animate-spin" />}
            Resend email
          </button>
        )}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0 text-amber-700 hover:bg-amber-100 hover:text-amber-900"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
