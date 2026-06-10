"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Flag, Plus } from "lucide-react";

const flags = [
  { name: "new-dashboard", description: "New dashboard UI", enabled: true, percentage: 100 },
  { name: "ai-features", description: "AI-powered workflow suggestions", enabled: false, percentage: 0 },
  { name: "dark-mode", description: "Dark mode support", enabled: true, percentage: 50 },
  { name: "beta-connectors", description: "New connector integrations", enabled: true, percentage: 25 },
];

export default function FeatureFlagsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flag className="h-5 w-5" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Feature Flags</h1>
            <p className="text-sm text-muted-foreground">Manage feature rollouts</p>
          </div>
        </div>
        <Button><Plus className="mr-1 h-4 w-4" /> New Flag</Button>
      </div>

      <div className="space-y-3">
        {flags.map((f) => (
          <Card key={f.name}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Switch defaultChecked={f.enabled} />
                <div>
                  <p className="text-sm font-medium">{f.name}</p>
                  <p className="text-xs text-muted-foreground">{f.description}</p>
                </div>
              </div>
              <Badge variant={f.enabled ? "success" : "secondary"}>
                {f.enabled ? `${f.percentage}% rollout` : "disabled"}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
