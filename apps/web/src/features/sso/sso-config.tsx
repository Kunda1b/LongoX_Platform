"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ShieldCheck,
  Building2,
  Key,
  Globe,
  Plus,
  Trash2,
  Power,
  Eye,
  EyeOff,
  Search,
  GitBranch,
} from "lucide-react";

interface SSOConnection {
  id: string;
  provider: string;
  domain: string | null;
  enabled: boolean;
  hasClientId: boolean;
  hasIssuerUrl: boolean;
  metadata: string | null;
  createdAt: string;
}

const providerMeta: Record<
  string,
  { name: string; icon: typeof Key; color: string }
> = {
  google: { name: "Google", icon: Search, color: "text-blue-500" },
  github: { name: "GitHub", icon: GitBranch, color: "text-foreground" },
  microsoft: { name: "Microsoft", icon: Building2, color: "text-blue-600" },
  azure_ad: { name: "Azure AD", icon: ShieldCheck, color: "text-blue-600" },
  okta: { name: "Okta", icon: ShieldCheck, color: "text-green-600" },
  saml: { name: "SAML 2.0", icon: Key, color: "text-orange-500" },
  oidc: { name: "OpenID Connect", icon: Globe, color: "text-purple-500" },
  custom: { name: "Custom OIDC", icon: Globe, color: "text-muted-foreground" },
};

export function SSOConfig() {
  const [connections, setConnections] = useState<SSOConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formProvider, setFormProvider] = useState("oidc");
  const [formClientId, setFormClientId] = useState("");
  const [formClientSecret, setFormClientSecret] = useState("");
  const [formIssuerUrl, setFormIssuerUrl] = useState("");
  const [formDomain, setFormDomain] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchConnections = async () => {
    try {
      const res = await fetch("/api/auth/sso/providers");
      if (res.ok) setConnections(await res.json());
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  const handleConfigure = async () => {
    if (!formClientId || !formClientSecret) {
      toast({
        title: "Client ID and Client Secret are required",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/auth/sso/configure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: formProvider,
          clientId: formClientId,
          clientSecret: formClientSecret,
          issuerUrl: formIssuerUrl || undefined,
          domain: formDomain || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Configuration failed");
      }
      toast({ title: "SSO provider configured successfully" });
      setDialogOpen(false);
      resetForm();
      fetchConnections();
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "Failed to configure SSO",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleProvider = async (provider: string, enabled: boolean) => {
    try {
      const res = await fetch(`/api/auth/sso/${provider}/toggle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      if (res.ok) {
        setConnections((prev) =>
          prev.map((c) => (c.provider === provider ? { ...c, enabled } : c)),
        );
        toast({ title: `${provider} ${enabled ? "enabled" : "disabled"}` });
      }
    } catch {
      toast({ title: "Failed to toggle provider", variant: "destructive" });
    }
  };

  const deleteProvider = async (provider: string) => {
    if (!confirm(`Delete ${provider} configuration?`)) return;
    try {
      const res = await fetch(`/api/auth/sso/${provider}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setConnections((prev) => prev.filter((c) => c.provider !== provider));
        toast({ title: "SSO provider deleted" });
      }
    } catch {
      toast({ title: "Failed to delete provider", variant: "destructive" });
    }
  };

  const resetForm = () => {
    setFormProvider("oidc");
    setFormClientId("");
    setFormClientSecret("");
    setFormIssuerUrl("");
    setFormDomain("");
  };

  const handleEdit = (conn: SSOConnection) => {
    setFormProvider(conn.provider);
    setFormClientId("");
    setFormClientSecret("");
    setFormIssuerUrl("");
    setFormDomain(conn.domain ?? "");
    setDialogOpen(true);
  };

  const providerList = Object.entries(providerMeta);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Single Sign-On</h1>
          <p className="text-sm text-muted-foreground">
            Configure SAML, OIDC, Azure AD, Okta, and other SSO providers
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-1 h-4 w-4" /> Add Provider
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Configure SSO Provider</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Provider</label>
                <Select value={formProvider} onValueChange={setFormProvider}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {providerList.map(([key, meta]) => (
                      <SelectItem key={key} value={key}>
                        {meta.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {formProvider === "saml" && (
                <div className="rounded-lg border bg-muted/50 p-3 text-xs text-muted-foreground">
                  SAML 2.0 requires an IdP-initiated SSO URL. Provide your
                  Identity Provider&apos;s SSO URL as the Issuer URL and the SP
                  Entity ID as the Client ID.
                </div>
              )}
              {formProvider === "oidc" && (
                <div className="rounded-lg border bg-muted/50 p-3 text-xs text-muted-foreground">
                  Generic OpenID Connect provider. Requires the OIDC discovery
                  URL as the Issuer URL.
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Client ID / Entity ID
                </label>
                <Input
                  value={formClientId}
                  onChange={(e) => setFormClientId(e.target.value)}
                  placeholder={
                    formProvider === "saml"
                      ? "SP Entity ID (audience)"
                      : "Client ID"
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Client Secret</label>
                <div className="relative">
                  <Input
                    type={showSecret ? "text" : "password"}
                    value={formClientSecret}
                    onChange={(e) => setFormClientSecret(e.target.value)}
                    placeholder="Client Secret"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowSecret(!showSecret)}
                  >
                    {showSecret ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Issuer URL / Domain URL
                </label>
                <Input
                  value={formIssuerUrl}
                  onChange={(e) => setFormIssuerUrl(e.target.value)}
                  placeholder={
                    formProvider === "azure_ad"
                      ? "https://login.microsoftonline.com/{tenant-id}"
                      : formProvider === "okta"
                        ? "https://{your-okta-domain}/oauth2/default"
                        : formProvider === "saml"
                          ? "IdP SSO URL"
                          : "Issuer URL"
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Domain (optional)</label>
                <Input
                  value={formDomain}
                  onChange={(e) => setFormDomain(e.target.value)}
                  placeholder="example.com"
                />
              </div>
              <Button
                onClick={handleConfigure}
                disabled={saving}
                className="w-full"
              >
                {saving ? "Saving..." : "Save Configuration"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {connections.map((conn) => {
            const meta = providerMeta[conn.provider] ?? providerMeta.custom;
            const Icon = meta.icon;
            return (
              <Card key={conn.id}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <Icon className={`h-5 w-5 ${meta.color}`} />
                    </div>
                    <div>
                      <CardTitle className="text-sm">{meta.name}</CardTitle>
                      {conn.domain && (
                        <p className="text-xs text-muted-foreground">
                          {conn.domain}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={conn.enabled}
                      onCheckedChange={(checked) =>
                        toggleProvider(conn.provider, checked)
                      }
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={conn.enabled ? "success" : "secondary"}>
                        <Power
                          className={`h-3 w-3 mr-1 ${conn.enabled ? "text-green-500" : ""}`}
                        />
                        {conn.enabled ? "Active" : "Disabled"}
                      </Badge>
                      {conn.hasClientId && (
                        <Badge variant="outline" className="text-xs">
                          Configured
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEdit(conn)}
                      >
                        <Key className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => deleteProvider(conn.provider)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {connections.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-12 text-center">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                <Key className="size-6" />
              </div>
              <div className="flex max-w-sm flex-col items-center gap-1">
                <div className="text-lg font-medium tracking-tight">
                  No SSO providers configured
                </div>
                <p className="text-sm text-muted-foreground">
                  Add SAML, OIDC, Azure AD, or Okta to enable single sign-on for
                  your organization
                </p>
              </div>
              <Button className="mt-2" onClick={() => setDialogOpen(true)}>
                <Plus className="mr-1 h-4 w-4" /> Add your first provider
              </Button>
            </div>
          )}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Quick Reference</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {providerList.map(([key, meta]) => {
            const conn = connections.find((c) => c.provider === key);
            const Icon = meta.icon;
            return (
              <div
                key={key}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <Icon className={`h-5 w-5 ${meta.color}`} />
                <div className="flex-1">
                  <p className="text-sm font-medium">{meta.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {conn
                      ? conn.enabled
                        ? "Enabled"
                        : "Disabled"
                      : "Not configured"}
                  </p>
                </div>
                {!conn && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      setFormProvider(key);
                      setDialogOpen(true);
                    }}
                  >
                    Configure
                  </Button>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
