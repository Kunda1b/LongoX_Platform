"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plug, Plus } from "lucide-react";

const connectors = [
  { name: "Slack", type: "messaging", status: "connected", icon: "💬" },
  { name: "PostgreSQL", type: "database", status: "connected", icon: "🗄️" },
  { name: "GitHub", type: "devops", status: "disconnected", icon: "🐙" },
  { name: "SendGrid", type: "email", status: "connected", icon: "📧" },
  { name: "AWS S3", type: "storage", status: "error", icon: "☁️" },
];

export default function ConnectorsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Connectors</h1>
          <p className="text-sm text-muted-foreground">
            Manage external service connections
          </p>
        </div>
        <Button>
          <Plus className="mr-1 h-4 w-4" /> Add Connector
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {connectors.map((c) => (
          <Card key={c.name}>
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">{c.icon}</span>
                <div>
                  <CardTitle className="text-sm">{c.name}</CardTitle>
                  <p className="text-xs text-muted-foreground capitalize">
                    {c.type}
                  </p>
                </div>
              </div>
              <Plug
                className={`h-4 w-4 ${c.status === "connected" ? "text-emerald-500" : c.status === "error" ? "text-destructive" : "text-muted-foreground"}`}
              />
            </CardHeader>
            <CardContent>
              <Badge
                variant={
                  c.status === "connected"
                    ? "success"
                    : c.status === "error"
                      ? "destructive"
                      : "secondary"
                }
              >
                {c.status}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
