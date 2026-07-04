"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";

const API = process.env.NEXT_PUBLIC_API_URL ?? "/api";

type InvitationInfo = {
  requiresRegistration: boolean;
  email: string;
  role: string;
  workspace: { name: string; slug: string };
  token: string;
};

type AcceptedInfo = {
  message: string;
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    tenantId: string;
    role: string;
    emailVerifiedAt: string | null;
    avatarUrl: string | null;
  };
  workspace: { name: string; slug: string };
};

function AcceptInvitationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { token: authToken, user, login } = useAuth();

  const inviteToken = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "needsRegistration" | "accepted" | "error">("loading");
  const [invitation, setInvitation] = useState<InvitationInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!inviteToken) {
      setStatus("error");
      setErrorMessage("No invitation token provided.");
      return;
    }

    fetch(`${API}/invitations/accept?token=${encodeURIComponent(inviteToken)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setStatus("error");
          setErrorMessage(data.error ?? "Invalid or expired invitation.");
          return;
        }
        if (data.requiresRegistration) {
          setStatus("needsRegistration");
          setInvitation(data as InvitationInfo);
        } else {
          // User exists and was added to the workspace
          const accepted = data as AcceptedInfo;
          // If the user is already logged in, re-login to refresh token
          if (authToken && user) {
            // The token returned already has the right tenantId
            localStorage.setItem("auth", JSON.stringify({ token: accepted.token, user: accepted.user }));
          }
          setStatus("accepted");
          setTimeout(() => router.push("/dashboard"), 2000);
        }
      })
      .catch(() => {
        setStatus("error");
        setErrorMessage("Failed to validate invitation. Please try again.");
      });
  }, [inviteToken]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-muted-foreground">Validating invitation…</div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md rounded-xl border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <span className="text-xl">✕</span>
          </div>
          <h1 className="mb-2 text-xl font-semibold">Invalid invitation</h1>
          <p className="mb-6 text-sm text-muted-foreground">{errorMessage}</p>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Go to LongoX
          </Link>
        </div>
      </div>
    );
  }

  if (status === "accepted") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md rounded-xl border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <span className="text-xl">✓</span>
          </div>
          <h1 className="mb-2 text-xl font-semibold">Invitation accepted!</h1>
          <p className="text-sm text-muted-foreground">Redirecting you to the dashboard…</p>
        </div>
      </div>
    );
  }

  // Needs registration
  if (status === "needsRegistration" && invitation) {
    const registerUrl = `/register?email=${encodeURIComponent(invitation.email)}&inviteToken=${encodeURIComponent(invitation.token)}&workspace=${encodeURIComponent(invitation.workspace.name)}`;

    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md rounded-xl border bg-card p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              LX
            </div>
            <span className="text-lg font-semibold">LongoX</span>
          </div>
          <h1 className="mb-1 text-xl font-semibold">You've been invited</h1>
          <p className="mb-6 text-sm text-muted-foreground">
            Join <strong>{invitation.workspace.name}</strong> as a{" "}
            <strong className="capitalize">{invitation.role}</strong>.
          </p>
          <div className="mb-6 rounded-lg bg-muted/50 p-4 text-sm">
            <p className="font-medium">Invited email</p>
            <p className="text-muted-foreground">{invitation.email}</p>
          </div>
          <div className="flex flex-col gap-3">
            <Link
              href={registerUrl}
              className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Create account &amp; join workspace
            </Link>
            <Link
              href={`/login?redirect=${encodeURIComponent(`/invitations/accept?token=${inviteToken}`)}`}
              className="inline-flex w-full items-center justify-center rounded-md border px-4 py-2.5 text-sm font-medium hover:bg-muted"
            >
              Already have an account? Sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Validating invitation…</div>}>
      <AcceptInvitationContent />
    </Suspense>
  );
}
