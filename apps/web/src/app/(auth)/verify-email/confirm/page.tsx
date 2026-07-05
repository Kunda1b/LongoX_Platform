"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

type Status = "verifying" | "success" | "error";

function VerifyEmailConfirmContent() {
  const params = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<Status>("verifying");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token found in the link.");
      return;
    }

    fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          setStatus("success");
        } else {
          setStatus("error");
          setMessage(
            data.error ?? "Verification failed. The link may have expired.",
          );
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Something went wrong. Please try again.");
      });
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full">
            {status === "verifying" && (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            )}
            {status === "success" && (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            )}
            {status === "error" && (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <XCircle className="h-6 w-6 text-destructive" />
              </div>
            )}
          </div>
          <CardTitle>
            {status === "verifying" && "Verifying…"}
            {status === "success" && "Email verified!"}
            {status === "error" && "Verification failed"}
          </CardTitle>
          <CardDescription>
            {status === "verifying" && "Checking your verification link."}
            {status === "success" &&
              "Your email has been confirmed. You're all set."}
            {status === "error" && (message || "Something went wrong.")}
          </CardDescription>
        </CardHeader>
        {status !== "verifying" && (
          <CardContent>
            {status === "success" ? (
              <Button asChild className="w-full">
                <Link href="/dashboard">Go to dashboard</Link>
              </Button>
            ) : (
              <Button asChild variant="outline" className="w-full">
                <Link href="/verify-email">Resend verification email</Link>
              </Button>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}

export default function VerifyEmailConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <VerifyEmailConfirmContent />
    </Suspense>
  );
}
