"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe } from "lucide-react";

const environments = [
  {
    name: "Production",
    color: "destructive",
    status: "healthy",
    url: "https://api.longox.io",
  },
  {
    name: "Staging",
    color: "warning",
    status: "healthy",
    url: "https://staging.api.longox.io",
  },
  {
    name: "Development",
    color: "info",
    status: "degraded",
    url: "https://dev.api.longox.io",
  },
];

export default function EnvironmentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Environments</h1>
        <p className="text-sm text-muted-foreground">
          Manage deployment environments
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {environments.map((env) => (
          <Card key={env.name}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm">{env.name}</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Badge variant={env.status === "healthy" ? "success" : "warning"}>
                {env.status}
              </Badge>
              <p className="text-xs text-muted-foreground truncate">
                {env.url}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
