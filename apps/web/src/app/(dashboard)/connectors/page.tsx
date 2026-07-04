"use client";

import { useState } from "react";
import { useListConnectors, customFetch } from "@longox/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plug, Plus, Settings, ArrowUpCircle, Trash2, Download, Search, ShieldCheck, CheckCircle2, XCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Installation {
  id: string;
  connectorId: string;
  connectorName: string;
  version: string;
  status: string;
  config: Record<string, unknown>;
  installedAt: string;
  lastUsedAt: string | null;
}

export default function ConnectorsPage() {
  const [search, setSearch] = useState("");
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [showInstalled, setShowInstalled] = useState(false);
  const { data: connectors, isLoading } = useListConnectors({ search: search || undefined }) as any;

  const fetchInstallations = async () => {
    try {
      const data = await customFetch<Installation[]>("/api/connectors/installations", { method: "GET" });
      setInstallations(data ?? []);
    } catch {
      // Not critical
    }
  };

  const handleInstall = async (connectorId: string) => {
    try {
      await customFetch(`/api/connectors/${connectorId}/install`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: {} }),
      });
      await fetchInstallations();
      window.location.reload();
    } catch (e) {
      console.error(e);
      alert("Failed to install connector");
    }
  };

  const handleConfigure = async (installationId: number) => {
    const configStr = window.prompt("Enter configuration as JSON:");
    if (!configStr) return;
    try {
      const config = JSON.parse(configStr);
      await customFetch(`/api/connectors/installations/${installationId}/configure`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config }),
      });
      alert("Configuration updated");
    } catch (e) {
      alert("Invalid JSON or request failed");
    }
  };

  const handleUpgrade = async (installationId: number) => {
    const versionId = window.prompt("Enter connector version ID to upgrade to:");
    if (!versionId) return;
    try {
      await customFetch(`/api/connectors/installations/${installationId}/upgrade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectorVersionId: parseInt(versionId, 10) }),
      });
      alert("Upgrade initiated");
      window.location.reload();
    } catch (e) {
      alert("Failed to upgrade");
    }
  };

  const handleRemove = async (installationId: number) => {
    if (!window.confirm("Are you sure you want to remove this connector?")) return;
    try {
      await customFetch(`/api/connectors/installations/${installationId}`, { method: "DELETE" });
      await fetchInstallations();
      window.location.reload();
    } catch (e) {
      alert("Failed to remove connector");
    }
  };

  const getInstallationForConnector = (connectorId: string): Installation | undefined => {
    return installations.find((i) => i.connectorId === connectorId);
  };

  const filteredConnectors = (connectors ?? []).filter((c: any) => {
    const installed = !!getInstallationForConnector(c.id);
    if (showInstalled && !installed) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Connectors</h1>
          <p className="text-sm text-muted-foreground">
            Manage external service connections
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={showInstalled ? "default" : "outline"} size="sm" onClick={() => { setShowInstalled(!showInstalled); fetchInstallations(); }}>
            {showInstalled ? "All" : "Installed"}
          </Button>
          <Button size="sm" onClick={() => fetchInstallations()}>
            <Download className="mr-1 h-4 w-4" /> Refresh
          </Button>
        </div>
      </div>

      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search connectors..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))
        ) : filteredConnectors.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-12 text-center">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
              <Plug className="size-6" />
            </div>
            <div className="flex max-w-sm flex-col items-center gap-1">
              <div className="text-lg font-medium tracking-tight">
                No connectors found
              </div>
              <p className="text-sm text-muted-foreground">
                {showInstalled ? "No connectors installed yet" : "No connectors match your search"}
              </p>
            </div>
          </div>
        ) : (
          filteredConnectors.map((c: any) => {
            const installation = getInstallationForConnector(c.id);
            const installed = !!installation;
            return (
              <Card key={c.id}>
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div className="flex items-center gap-2">
                    {c.icon && (
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-lg text-white text-sm font-bold"
                        style={{ backgroundColor: c.color ?? "#6366f1" }}
                      >
                        {c.displayName?.charAt(0) ?? c.name?.charAt(0) ?? "?"}
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-sm">
                        {c.displayName || c.name}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground capitalize">
                        {c.category}
                      </p>
                    </div>
                  </div>
                  {installed ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Plug className="h-4 w-4 text-muted-foreground" />
                  )}
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    {installed ? (
                      <Badge variant="success" className="bg-emerald-500/10 text-emerald-600 border-emerald-200">Installed</Badge>
                    ) : (
                      <Badge variant="secondary">Available</Badge>
                    )}
                    {c.certificationLevel === "official" && (
                      <Badge variant="outline" className="text-xs">
                        <ShieldCheck className="mr-1 h-3 w-3" /> Official
                      </Badge>
                    )}
                    {c.isFeatured && (
                      <Badge variant="outline">Featured</Badge>
                    )}
                  </div>
                  {c.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {c.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {c.actionCount > 0 && <span>{c.actionCount} actions</span>}
                    {c.triggerCount > 0 && <span>{c.triggerCount} triggers</span>}
                    {c.installCount > 0 && <span>{c.installCount} installs</span>}
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2 pt-2 pb-4 px-6 border-t mt-4 bg-muted/50 rounded-b-xl">
                  {!installed && (
                    <Button size="sm" className="w-full" onClick={() => handleInstall(c.id)}>
                      <Download className="mr-2 h-4 w-4" /> Install
                    </Button>
                  )}
                  {installed && installation && (
                    <>
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => handleConfigure(installation.id)}>
                        <Settings className="mr-2 h-4 w-4" /> Configure
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => handleUpgrade(installation.id)}>
                        <ArrowUpCircle className="mr-2 h-4 w-4" /> Upgrade
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleRemove(installation.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </CardFooter>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
