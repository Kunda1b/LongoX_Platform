"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Route,
  Plus,
  Trash2,
  Edit,
  Zap,
  DollarSign,
  Award,
  Settings,
  Heart,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

type RoutingPolicy = {
  id: string;
  name: string;
  description: string | null;
  strategy: string;
  providerPreferences: string[];
  modelAllowlist: string[] | null;
  modelDenylist: string[] | null;
  fallbackEnabled: boolean;
  maxRetries: number;
  isEnabled: boolean;
  createdAt: string;
};

type ProviderHealth = {
  successRate: number;
  avgLatencyMs: number;
  lastError?: string;
};

const STRATEGY_INFO: Record<
  string,
  { label: string; icon: any; color: string }
> = {
  cheapest: { label: "Cheapest", icon: DollarSign, color: "text-emerald-500" },
  fastest: { label: "Fastest", icon: Zap, color: "text-blue-500" },
  highest_quality: {
    label: "Highest Quality",
    icon: Award,
    color: "text-purple-500",
  },
  custom: { label: "Custom", icon: Settings, color: "text-orange-500" },
};

const PROVIDERS = [
  "openai",
  "anthropic",
  "google",
  "mistral",
  "groq",
  "deepseek",
  "openrouter",
];

export default function AIRouterPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editPolicy, setEditPolicy] = useState<RoutingPolicy | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    strategy: "cheapest",
    providerPreferences: [] as string[],
    fallbackEnabled: true,
    maxRetries: 2,
  });

  const { data: policies, isLoading } = useQuery<RoutingPolicy[]>({
    queryKey: ["ai-routing-policies"],
    queryFn: async () => {
      const res = await fetch("/api/ai-routing-policies", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch policies");
      return res.json();
    },
    enabled: !!token,
  });

  const { data: health } = useQuery<Record<string, ProviderHealth>>({
    queryKey: ["ai-router-health"],
    queryFn: async () => {
      const res = await fetch("/api/ai/router/health", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch health");
      return res.json();
    },
    enabled: !!token,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/ai-routing-policies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to create policy");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-routing-policies"] });
      setCreateOpen(false);
      setForm({
        name: "",
        description: "",
        strategy: "cheapest",
        providerPreferences: [],
        fallbackEnabled: true,
        maxRetries: 2,
      });
      toast({ title: "Policy created" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/ai-routing-policies/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-routing-policies"] });
      toast({ title: "Policy deleted" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({
      id,
      isEnabled,
    }: {
      id: string;
      isEnabled: boolean;
    }) => {
      const res = await fetch(`/api/ai-routing-policies/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isEnabled }),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-routing-policies"] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Router</h1>
          <p className="text-sm text-muted-foreground">
            Configure intelligent routing across AI providers
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-1 h-4 w-4" /> New Policy
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Routing Policy</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="e.g., Cost-optimized routing"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  placeholder="Describe the routing policy"
                />
              </div>
              <div>
                <Label>Strategy</Label>
                <Select
                  value={form.strategy}
                  onValueChange={(v) => setForm((f) => ({ ...f, strategy: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cheapest">Cheapest</SelectItem>
                    <SelectItem value="fastest">Fastest</SelectItem>
                    <SelectItem value="highest_quality">
                      Highest Quality
                    </SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.strategy === "custom" && (
                <div>
                  <Label>Provider Preferences (order matters)</Label>
                  <div className="mt-1 space-y-1">
                    {PROVIDERS.map((p) => (
                      <label
                        key={p}
                        className="flex items-center gap-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={form.providerPreferences.includes(p)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setForm((f) => ({
                                ...f,
                                providerPreferences: [
                                  ...f.providerPreferences,
                                  p,
                                ],
                              }));
                            } else {
                              setForm((f) => ({
                                ...f,
                                providerPreferences:
                                  f.providerPreferences.filter((x) => x !== p),
                              }));
                            }
                          }}
                        />
                        {p}
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between">
                <Label>Fallback Enabled</Label>
                <Switch
                  checked={form.fallbackEnabled}
                  onCheckedChange={(v) =>
                    setForm((f) => ({ ...f, fallbackEnabled: v }))
                  }
                />
              </div>
              <div>
                <Label>Max Retries</Label>
                <Input
                  type="number"
                  value={form.maxRetries}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      maxRetries: parseInt(e.target.value),
                    }))
                  }
                  min="0"
                  max="5"
                />
              </div>
              <Button
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending || !form.name}
              >
                Create Policy
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {health && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Object.entries(health).map(([provider, h]) => (
            <Card key={provider}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  {provider}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Success Rate</span>
                    <span>{(h.successRate * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Avg Latency</span>
                    <span>{h.avgLatencyMs.toFixed(0)}ms</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))
        ) : policies?.length === 0 ? (
          <div className="col-span-2 text-center text-muted-foreground p-8">
            No routing policies configured. Create one to get started.
          </div>
        ) : (
          policies?.map((p) => {
            const info = STRATEGY_INFO[p.strategy] ?? STRATEGY_INFO.custom;
            const Icon = info.icon;
            return (
              <Card key={p.id} className={p.isEnabled ? "" : "opacity-60"}>
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div>
                    <CardTitle className="text-sm">{p.name}</CardTitle>
                    <CardDescription className="text-xs">
                      {p.description || "No description"}
                    </CardDescription>
                  </div>
                  <Icon className={`h-5 w-5 ${info.color}`} />
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{info.label}</Badge>
                    <Badge variant={p.isEnabled ? "success" : "secondary"}>
                      {p.isEnabled ? "active" : "disabled"}
                    </Badge>
                    {p.fallbackEnabled && (
                      <Badge variant="outline" className="text-xs">
                        fallback
                      </Badge>
                    )}
                  </div>
                  {p.providerPreferences.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      Providers: {p.providerPreferences.join(" → ")}
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        toggleMutation.mutate({
                          id: p.id,
                          isEnabled: !p.isEnabled,
                        })
                      }
                    >
                      {p.isEnabled ? "Disable" : "Enable"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate(p.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
