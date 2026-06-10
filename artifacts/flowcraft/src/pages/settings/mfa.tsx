import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, ShieldOff, Key, Copy, CheckCircle2, AlertCircle } from "lucide-react";

const API = import.meta.env["VITE_API_URL"] ?? "/api";

function getAuthHeaders(): Record<string, string> {
  const raw = localStorage.getItem("auth");
  if (!raw) return {};
  try {
    const { token } = JSON.parse(raw);
    return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  } catch {
    return {};
  }
}

export default function MfaSettingsPage() {
  const { toast } = useToast();
  const [setupCode, setSetupCode] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [setupData, setSetupData] = useState<{ secret: string; uri: string } | null>(null);

  const { data: mfaStatus, refetch: refetchStatus } = useQuery<{ enabled: boolean; method: string | null; verifiedAt: string | null }>({
    queryKey: ["mfa-status"],
    queryFn: () => fetch(`${API}/auth/mfa/status`, { headers: getAuthHeaders() }).then((r) => r.json()),
  });

  const setupMutation = useMutation({
    mutationFn: () =>
      fetch(`${API}/auth/mfa/setup`, { method: "POST", headers: getAuthHeaders() }).then((r) => r.json()),
    onSuccess: (data) => {
      if (data.error) {
        toast({ title: data.error, variant: "destructive" });
        return;
      }
      setSetupData(data);
      toast({ title: "MFA setup initiated", description: "Scan the QR code or enter the secret in your authenticator app." });
    },
    onError: () => toast({ title: "Failed to start MFA setup", variant: "destructive" }),
  });

  const verifyMutation = useMutation({
    mutationFn: (code: string) =>
      fetch(`${API}/auth/mfa/verify`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ code }),
      }).then((r) => r.json()),
    onSuccess: (data) => {
      if (data.error) {
        toast({ title: data.error, variant: "destructive" });
        return;
      }
      toast({ title: "MFA enabled successfully" });
      setSetupData(null);
      setVerifyCode("");
      refetchStatus();
    },
    onError: () => toast({ title: "Verification failed", variant: "destructive" }),
  });

  const disableMutation = useMutation({
    mutationFn: () =>
      fetch(`${API}/auth/mfa`, { method: "DELETE", headers: getAuthHeaders() }).then((r) => r.json()),
    onSuccess: () => {
      toast({ title: "MFA disabled" });
      refetchStatus();
    },
    onError: () => toast({ title: "Failed to disable MFA", variant: "destructive" }),
  });

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Multi-Factor Authentication</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Add an extra layer of security to your account using TOTP authenticator apps.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {mfaStatus?.enabled ? (
                <ShieldCheck className="h-5 w-5 text-green-500" />
              ) : (
                <ShieldOff className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <CardTitle className="text-base">Authenticator App</CardTitle>
                <CardDescription>
                  {mfaStatus?.enabled
                    ? "MFA is active on your account"
                    : "Protect your account with a time-based one-time password"}
                </CardDescription>
              </div>
            </div>
            <Badge variant={mfaStatus?.enabled ? "default" : "outline"}>
              {mfaStatus?.enabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!mfaStatus?.enabled && !setupData && (
            <Button
              onClick={() => setupMutation.mutate()}
              disabled={setupMutation.isPending}
              className="gap-2"
            >
              <Key className="h-4 w-4" />
              {setupMutation.isPending ? "Setting up..." : "Set up MFA"}
            </Button>
          )}

          {setupData && (
            <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Scan the QR code or enter the secret manually in your authenticator app
                  (Google Authenticator, Authy, 1Password, etc.)
                </AlertDescription>
              </Alert>

              <div className="flex flex-col items-center gap-2">
                <div className="bg-white rounded-lg p-2">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(setupData.uri)}`}
                    alt="QR Code"
                    className="h-48 w-48"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>

                <div className="flex items-center gap-2 w-full">
                  <code className="flex-1 text-xs font-mono bg-muted px-3 py-2 rounded border truncate">
                    {setupData.secret}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 shrink-0"
                    onClick={() => copyToClipboard(setupData.secret)}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="verify-code">Verify code</Label>
                <p className="text-xs text-muted-foreground">
                  Enter the 6-digit code from your authenticator app to confirm setup.
                </p>
                <div className="flex gap-2">
                  <Input
                    id="verify-code"
                    placeholder="000000"
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="font-mono text-lg tracking-widest w-40"
                    maxLength={6}
                  />
                  <Button
                    onClick={() => verifyMutation.mutate(verifyCode)}
                    disabled={verifyCode.length !== 6 || verifyMutation.isPending}
                    className="gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {verifyMutation.isPending ? "Verifying..." : "Verify"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {mfaStatus?.enabled && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                MFA was verified on{" "}
                {mfaStatus.verifiedAt
                  ? new Date(mfaStatus.verifiedAt).toLocaleString()
                  : "Unknown"}
              </p>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => disableMutation.mutate()}
                disabled={disableMutation.isPending}
                className="gap-2"
              >
                <ShieldOff className="h-4 w-4" />
                {disableMutation.isPending ? "Disabling..." : "Disable MFA"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {mfaStatus?.enabled && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recovery Codes</CardTitle>
            <CardDescription>
              Save these backup codes in a secure location. Each code can be used once
              if you lose access to your authenticator app.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" disabled>
              Generate Recovery Codes
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
