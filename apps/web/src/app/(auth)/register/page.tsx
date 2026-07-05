"use client";

import Link from "next/link";
import { WorkOSAuthKit } from "@/components/auth/workos-authkit";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-lg font-bold text-primary-foreground">
            LX
          </div>
          <CardTitle>Create your workspace</CardTitle>
          <CardDescription>
            You&apos;ll be the <strong>Owner</strong> &mdash; invite your team
            once you&apos;re in.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <WorkOSAuthKit mode="register" />
          <p className="text-center text-xs text-muted-foreground">
            By creating a workspace you agree to our Terms of Service.
          </p>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
