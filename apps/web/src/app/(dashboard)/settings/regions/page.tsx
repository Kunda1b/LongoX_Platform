"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";

const regions = [
  {
    name: "US East (N. Virginia)",
    code: "us-east-1",
    status: "healthy",
    latency: "12ms",
  },
  {
    name: "US West (Oregon)",
    code: "us-west-2",
    status: "healthy",
    latency: "45ms",
  },
  {
    name: "EU (Ireland)",
    code: "eu-west-1",
    status: "degraded",
    latency: "89ms",
  },
  {
    name: "AP (Singapore)",
    code: "ap-southeast-1",
    status: "healthy",
    latency: "120ms",
  },
];

export default function RegionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Regions</h1>
        <p className="text-sm text-muted-foreground">
          Deployment regions and latency
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {regions.map((r) => (
          <Card key={r.code}>
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <CardTitle className="text-sm">{r.name}</CardTitle>
                  <p className="text-xs text-muted-foreground font-mono">
                    {r.code}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <Badge variant={r.status === "healthy" ? "success" : "warning"}>
                {r.status}
              </Badge>
              <span className="text-xs text-muted-foreground">{r.latency}</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
