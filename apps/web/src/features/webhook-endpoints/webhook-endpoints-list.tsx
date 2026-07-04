"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Webhook, Plus, Copy } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";

type WebhookEndpoint = {
  id: string;
  workflowId: string;
  name: string;
  description: string | null;
  isActive: boolean;
  lastTriggeredAt: string | null;
  triggerCount: number;
  createdAt: string;
};

export function WebhookEndpointsList() {
  const { token } = useAuth();
  const { data: endpoints, isLoading } = useQuery<WebhookEndpoint[]>({
    queryKey: ["webhook-endpoints"],
    queryFn: async () => {
      const res = await fetch("/api/webhook-endpoints", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch webhooks");
      return res.json();
    },
    enabled: !!token,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Webhook className="h-5 w-5" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Webhook Endpoints
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage incoming webhooks
            </p>
          </div>
        </div>
        <Button>
          <Plus className="mr-1 h-4 w-4" /> Add Endpoint
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))
        ) : endpoints?.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-12 text-center">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
              <Webhook className="size-6" />
            </div>
            <div className="flex max-w-sm flex-col items-center gap-1">
              <div className="text-lg font-medium tracking-tight">
                No webhook endpoints
              </div>
              <p className="text-sm text-muted-foreground">
                Create webhook endpoints to trigger workflows externally
              </p>
            </div>
          </div>
        ) : (
          endpoints?.map((ep) => (
            <Card key={ep.id}>
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div>
                  <CardTitle className="text-sm">{ep.name}</CardTitle>
                  <p className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">
                    /api/webhooks/{ep.workflowId}
                  </p>
                </div>
                <Webhook className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <Badge variant={ep.isActive ? "success" : "secondary"}>
                  {ep.isActive ? "active" : "inactive"}
                </Badge>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {ep.lastTriggeredAt 
                      ? new Date(ep.lastTriggeredAt).toLocaleDateString()
                      : "never"}
                  </span>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
