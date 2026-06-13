"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  MapPin,
  HeartPulse,
  RotateCcw,
  Activity,
  Plus,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

export default function RegionsPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [drOpen, setDrOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [form, setForm] = useState({
    regionId: "",
    name: "",
    endpoint: "",
    priority: 0,
    isPrimary: false,
    capabilities: "",
    dataResidencyCompliant: true,
    failoverPriority: 1,
  });

  const { data: regionData, isLoading, refetch } = useQuery({
    queryKey: ["regions"],
    queryFn: async () => {
      const res = await fetch("/api/replication/regions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch regions");
      return res.json();
    },
    enabled: !!token,
  });

  const { data: healthData, refetch: refetchHealth } = useQuery({
    queryKey: ["region-health"],
    queryFn: async () => {
      const res = await fetch("/api/replication/failover/status", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch health");
      return res.json();
    },
    enabled: !!token,
    refetchInterval: 30000,
  });

  const { data: drPolicies } = useQuery({
    queryKey: ["dr-policies"],
    queryFn: async () => {
      const res = await fetch("/api/replication/dr-policies", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch DR policies");
      return res.json();
    },
    enabled: !!token,
  });

  const { data: replicationConfigs } = useQuery({
    queryKey: ["replication-configs"],
    queryFn: async () => {
      const res = await fetch("/api/replication/configs", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch configs");
      return res.json();
    },
    enabled: !!token,
  });

  const healthCheckMutation = useMutation({
    mutationFn: async (regionId?: string) => {
      const res = await fetch("/api/platform/regions/health", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ regionId }),
      });
      if (!res.ok) throw new Error("Health check failed");
      return res.json();
    },
    onSuccess: () => {
      refetchHealth();
      toast({ title: "Health check complete" });
    },
    onError: (err) => {
      toast({ title: "Health check failed", description: (err as Error).message, variant: "destructive" });
    },
  });

  const failoverMutation = useMutation({
    mutationFn: async (targetRegionId?: string) => {
      const res = await fetch("/api/replication/failover", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ targetRegionId }),
      });
      if (!res.ok) throw new Error("Failover failed");
      return res.json();
    },
    onSuccess: () => {
      refetch();
      toast({ title: "Failover completed" });
    },
    onError: (err) => {
      toast({ title: "Failover failed", description: (err as Error).message, variant: "destructive" });
    },
  });

  const regions = regionData?.regions ?? regionData ?? [];
  const healthEntries = healthData?.regionHealth ?? [];

  const getRegionHealth = (regionId: string) => {
    return healthEntries.find((h: any) => h.region === regionId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Region Management</h1>
          <p className="text-sm text-muted-foreground">
            Multi-region deployment, replication, and disaster recovery
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => healthCheckMutation.mutate()} disabled={healthCheckMutation.isPending}>
            {healthCheckMutation.isPending ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <Activity className="mr-1 h-4 w-4" />
            )}
            Check All
          </Button>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-1 h-4 w-4" /> Add Region</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Region</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Region ID</Label>
                  <Input value={form.regionId} onChange={(e) => setForm((f) => ({ ...f, regionId: e.target.value }))} placeholder="us-east-1" />
                </div>
                <div>
                  <Label>Name</Label>
                  <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="US East" />
                </div>
                <div>
                  <Label>Endpoint</Label>
                  <Input value={form.endpoint} onChange={(e) => setForm((f) => ({ ...f, endpoint: e.target.value }))} placeholder="https://us-east.longox.io" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Priority</Label>
                    <Input type="number" value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: parseInt(e.target.value) }))} />
                  </div>
                  <div>
                    <Label>Failover Priority</Label>
                    <Input type="number" value={form.failoverPriority} onChange={(e) => setForm((f) => ({ ...f, failoverPriority: parseInt(e.target.value) }))} />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Switch checked={form.isPrimary} onCheckedChange={(v) => setForm((f) => ({ ...f, isPrimary: v }))} />
                    <Label className="text-sm">Primary</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={form.dataResidencyCompliant} onCheckedChange={(v) => setForm((f) => ({ ...f, dataResidencyCompliant: v }))} />
                    <Label className="text-sm">Data Residency Compliant</Label>
                  </div>
                </div>
                <div>
                  <Label>Capabilities (comma-separated)</Label>
                  <Input value={form.capabilities} onChange={(e) => setForm((f) => ({ ...f, capabilities: e.target.value }))} placeholder="workflows,executions,ai" />
                </div>
                <Button className="w-full">Save Region</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Failover Status */}
      {healthData && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <RotateCcw className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="text-sm font-medium">Failover Status</p>
                  <p className="text-xs text-muted-foreground">
                    Active: <span className="font-mono font-medium">{healthData.activeRegion}</span>
                    {" | "}Standby: <span className="font-mono">{healthData.standbyRegion}</span>
                    {" | "}Failovers: {healthData.failoverCount}
                    {healthData.lastFailoverAt && ` | Last: ${new Date(healthData.lastFailoverAt).toLocaleString()}`}
                  </p>
                </div>
              </div>
              <Badge variant={healthData.healthy ? "success" : "destructive"}>
                {healthData.healthy ? "Healthy" : "Degraded"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Region Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))
        ) : regions.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-12 text-center">
            <MapPin className="size-8 text-muted-foreground" />
            <p className="text-lg font-medium">No regions configured</p>
            <p className="text-sm text-muted-foreground">Add deployment regions for multi-region support</p>
          </div>
        ) : (
          regions.map((r: any) => {
            const health = getRegionHealth(r.id);
            return (
              <Card key={r.id} className={r.isPrimary ? "border-primary" : ""}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <CardTitle className="text-sm">{r.name || r.id}</CardTitle>
                        <CardDescription className="text-xs font-mono">{r.id}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {r.isPrimary && <Badge variant="default" className="text-xs">Primary</Badge>}
                      {health && (
                        health.healthy ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex flex-wrap gap-1">
                    {(r.capabilities ?? []).map((cap: string) => (
                      <Badge key={cap} variant="outline" className="text-xs">{cap}</Badge>
                    ))}
                  </div>
                  {health && (
                    <div className="text-xs text-muted-foreground">
                      Latency: {health.latencyMs ? `${health.latencyMs}ms` : "N/A"}
                      {" | "}Checked: {new Date(health.lastChecked).toLocaleTimeString()}
                    </div>
                  )}
                  {r.dataResidencyCompliant && (
                    <Badge variant="secondary" className="text-xs">Data Residency Compliant</Badge>
                  )}
                </CardContent>
                <CardFooter className="gap-2 pt-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={() => healthCheckMutation.mutate(r.id)}
                    disabled={healthCheckMutation.isPending}
                  >
                    <HeartPulse className="mr-1 h-3 w-3" /> Health
                  </Button>
                  {!r.isPrimary && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs text-amber-600"
                      onClick={() => failoverMutation.mutate(r.id)}
                      disabled={failoverMutation.isPending}
                    >
                      <RotateCcw className="mr-1 h-3 w-3" /> Failover
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })
        )}
      </div>

      {/* Disaster Recovery Policies */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Disaster Recovery</h2>
            <p className="text-sm text-muted-foreground">DR policies, RPO/RTO targets</p>
          </div>
          <Dialog open={drOpen} onOpenChange={setDrOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm"><Plus className="mr-1 h-4 w-4" /> New Policy</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create DR Policy</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Configure via API. Use POST /api/replication/dr-policies</p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {!drPolicies || drPolicies.length === 0 ? (
            <div className="col-span-full flex items-center gap-3 rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
              <AlertTriangle className="h-5 w-5" />
              No DR policies configured
            </div>
          ) : (
            drPolicies.map((p: any) => (
              <Card key={p.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{p.name}</CardTitle>
                    <Badge variant={p.isActive ? "success" : "secondary"}>{p.isActive ? "Active" : "Inactive"}</Badge>
                  </div>
                  {p.description && <CardDescription className="text-xs">{p.description}</CardDescription>}
                </CardHeader>
                <CardContent className="text-xs space-y-1">
                  <div><span className="font-medium">Primary:</span> {p.primaryRegionId} → <span className="font-medium">Failover:</span> {p.failoverRegionId}</div>
                  <div><span className="font-medium">RPO:</span> {p.rpoSeconds}s <span className="font-medium">RTO:</span> {p.rtoSeconds}s</div>
                  <div><span className="font-medium">Recovery Tier:</span> {p.recoveryTier} <span className="font-medium">Auto-Failover:</span> {p.autoFailover ? "Yes" : "No"}</div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Replication Configs */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Replication Configurations</h2>
            <p className="text-sm text-muted-foreground">Cross-region data sync settings</p>
          </div>
          <Dialog open={configOpen} onOpenChange={setConfigOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm"><Plus className="mr-1 h-4 w-4" /> New Config</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Replication Config</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Configure via API. Use POST /api/replication/configs</p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {!replicationConfigs || replicationConfigs.length === 0 ? (
            <div className="col-span-full flex items-center gap-3 rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
              <Activity className="h-5 w-5" />
              No replication configs configured
            </div>
          ) : (
            replicationConfigs.map((c: any) => (
              <Card key={c.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-mono">{c.entityType}</CardTitle>
                    <Badge variant={c.isActive ? "success" : "secondary"}>{c.isActive ? "Active" : "Paused"}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="text-xs space-y-1">
                  <div><span className="font-medium">{c.sourceRegionId}</span> → <span className="font-medium">{c.targetRegionId}</span></div>
                  <div>Mode: {c.replicationMode} | Batch: {c.batchSize} | Interval: {c.syncIntervalMs}ms</div>
                  <div>Conflict Resolution: {c.conflictResolution}</div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
