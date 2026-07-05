"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Webhook, Plus, Copy } from "lucide-react";

const endpoints = [
  {
    name: "Order Webhook",
    url: "https://api.longox.io/webhooks/ord-001",
    status: "active",
    lastDelivery: "2 min ago",
  },
  {
    name: "GitHub Push",
    url: "https://api.longox.io/webhooks/gh-002",
    status: "active",
    lastDelivery: "1 hour ago",
  },
  {
    name: "Slack Events",
    url: "https://api.longox.io/webhooks/sl-003",
    status: "inactive",
    lastDelivery: "never",
  },
];

export default function WebhookEndpointsPage() {
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

      <div className="rounded-lg border border-dashed p-4">
        <p className="text-sm text-muted-foreground text-center">
          Webhook endpoints are managed through workflows. Create a workflow
          with a webhook trigger to add new endpoints.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {endpoints.map((ep) => (
          <Card key={ep.name}>
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div>
                <CardTitle className="text-sm">{ep.name}</CardTitle>
                <p className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">
                  {ep.url}
                </p>
              </div>
              <Webhook className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <Badge variant={ep.status === "active" ? "success" : "secondary"}>
                {ep.status}
              </Badge>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {ep.lastDelivery}
                </span>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
