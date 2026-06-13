"use client";

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
import { HardDrive, Check, Power, PowerOff } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

type AIModel = {
  id: number;
  provider: string;
  name: string;
  modelId: string;
  contextWindow: number;
  inputCostPerToken: number;
  outputCostPerToken: number;
  isEnabled: boolean;
};

export function AIModelsList() {
  const { token } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: models, isLoading } = useQuery<AIModel[]>({
    queryKey: ["ai-models"],
    queryFn: async () => {
      const res = await fetch("/api/ai-models", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch AI models");
      return res.json();
    },
    enabled: !!token,
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isEnabled }: { id: number; isEnabled: boolean }) => {
      const res = await fetch(`/api/ai-models/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isEnabled }),
      });
      if (!res.ok) throw new Error("Failed to update model");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-models"] });
      toast({ title: "Model updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update model", variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AI Models</h1>
        <p className="text-sm text-muted-foreground">
          Manage and monitor AI models
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))
        ) : models?.length === 0 ? (
          <div className="col-span-2 text-center text-muted-foreground p-8">
            No models available.
          </div>
        ) : (
          models?.map((m) => (
            <Card key={m.id} className={m.isEnabled ? "" : "opacity-60"}>
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div>
                  <CardTitle className="text-sm">{m.name}</CardTitle>
                  <CardDescription className="text-xs uppercase">
                    {m.provider}
                  </CardDescription>
                </div>
                <HardDrive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={m.isEnabled ? "success" : "secondary"}>
                    {m.isEnabled ? "available" : "disabled"}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-mono">
                    {m.modelId}
                  </span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => toggleMutation.mutate({ id: m.id, isEnabled: !m.isEnabled })}
                  disabled={toggleMutation.isPending}
                >
                  {m.isEnabled ? (
                    <><PowerOff className="mr-1 h-4 w-4 text-muted-foreground" /> Disable</>
                  ) : (
                    <><Power className="mr-1 h-4 w-4 text-emerald-500" /> Enable</>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
