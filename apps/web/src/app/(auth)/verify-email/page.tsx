"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MailCheck, RefreshCw } from "lucide-react";

export default function VerifyEmailPage() {
  const { user, token } = useAuth();
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );

  const resend = async () => {
    setStatus("sending");
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setStatus(res.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <MailCheck className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>
            We sent a verification link to{" "}
            <span className="font-medium text-foreground">{user?.email}</span>.
            Click it to activate your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {status === "sent" && (
            <p className="text-sm text-green-600">Verification email resent!</p>
          )}
          {status === "error" && (
            <p className="text-sm text-destructive">
              Failed to resend. Try again shortly.
            </p>
          )}
          <Button
            variant="outline"
            className="w-full"
            onClick={resend}
            disabled={status === "sending" || status === "sent"}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {status === "sending" ? "Sending…" : "Resend verification email"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Already verified?{" "}
            <a
              href="/dashboard"
              className="font-medium text-primary hover:underline"
            >
              Go to dashboard
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
