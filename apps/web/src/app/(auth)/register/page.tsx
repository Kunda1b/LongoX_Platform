"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const API = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export default function RegisterPage() {
  const { register, isLoading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Invitation-mode params (passed from /invitations/accept)
  const inviteToken = searchParams.get("inviteToken") ?? "";
  const inviteEmail = searchParams.get("email") ?? "";
  const inviteWorkspace = searchParams.get("workspace") ?? "";
  const isInviteMode = Boolean(inviteToken);

  const [name, setName] = useState("");
  const [email, setEmail] = useState(inviteEmail);
  const [workspaceName, setWorkspaceName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Sync email if query param changes (e.g. after client nav)
  useEffect(() => {
    if (inviteEmail) setEmail(inviteEmail);
  }, [inviteEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      if (isInviteMode) {
        // Step 1: register (creates a temporary workspace; we'll switch it)
        const regRes = await fetch(`${API}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
        });
        const regData = await regRes.json();
        if (!regRes.ok) throw new Error(regData.error ?? "Registration failed");

        const { token: jwt } = regData as { token: string };

        // Step 2: accept the invitation — switches workspace context
        const acceptRes = await fetch(`${API}/invitations/accept`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwt}`,
          },
          body: JSON.stringify({ token: inviteToken }),
        });
        const acceptData = await acceptRes.json();
        if (!acceptRes.ok) throw new Error(acceptData.error ?? "Failed to accept invitation");

        const finalToken = acceptData.token ?? jwt;
        const finalUser = acceptData.user ?? regData.user;
        localStorage.setItem("auth", JSON.stringify({ token: finalToken, user: finalUser }));
        router.push("/dashboard");
      } else {
        // Standard workspace creation flow
        await register(name, email, password, workspaceName.trim() || undefined);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-lg font-bold text-primary-foreground">
            LX
          </div>
          {isInviteMode ? (
            <>
              <CardTitle>Join {inviteWorkspace || "the workspace"}</CardTitle>
              <CardDescription>Create your account to accept the invitation.</CardDescription>
            </>
          ) : (
            <>
              <CardTitle>Create your workspace</CardTitle>
              <CardDescription>
                You'll be the <strong>Owner</strong> — invite your team once you're in.
              </CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                readOnly={isInviteMode}
                className={isInviteMode ? "bg-muted/50 cursor-not-allowed" : ""}
                required
              />
            </div>
            {!isInviteMode && (
              <div className="space-y-2">
                <Label htmlFor="workspaceName">Workspace name</Label>
                <Input
                  id="workspaceName"
                  type="text"
                  placeholder="Acme Corp"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Leave blank to use your email domain.</p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button
              type="submit"
              className="w-full"
              disabled={loading || authLoading}
            >
              {loading
                ? isInviteMode ? "Joining workspace…" : "Creating workspace…"
                : isInviteMode ? "Create account & join" : "Create workspace"}
            </Button>
            {!isInviteMode && (
              <p className="text-center text-xs text-muted-foreground">
                By creating a workspace you agree to our Terms of Service.
              </p>
            )}
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href={isInviteMode ? `/login?redirect=${encodeURIComponent(`/invitations/accept?token=${inviteToken}`)}` : "/login"}
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
