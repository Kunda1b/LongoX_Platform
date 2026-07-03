"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/spinner";

/**
 * /invite — workspace invitation landing page.
 *
 * Per architecture.md §7.1, `/invite` is part of the auth route group
 * (`/login`, `/signup`, `/invite`). This page reads the `token` query
 * parameter and redirects to the canonical `/invitations/accept?token=...`
 * page which handles the actual invitation acceptance flow.
 *
 * The redirect exists so that invitation emails can link to a short,
 * memorable URL (`/invite?token=abc`) while the implementation lives at
 * the longer `/invitations/accept` path that the api-gateway routes to
 * the auth-service.
 */
function InviteRedirect() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  useEffect(() => {
    if (token) {
      // Redirect to the canonical invitation acceptance page.
      router.replace(`/invitations/accept?token=${encodeURIComponent(token)}`);
    }
  }, [token, router]);

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Accept your invitation</CardTitle>
            <CardDescription>
              The invitation link is missing a token. Check your email for the
              correct link, or contact your workspace admin.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button asChild>
              <Link href="/login">Go to login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Accepting your invitation…</CardTitle>
          <CardDescription>
            Redirecting you to the invitation acceptance page.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Spinner />
        </CardContent>
      </Card>
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-muted/30">
          <Spinner />
        </div>
      }
    >
      <InviteRedirect />
    </Suspense>
  );
}
