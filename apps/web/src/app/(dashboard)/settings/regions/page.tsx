"use client";

import { useListRegionPolicies } from "@longox/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function RegionsPage() {
  const { data: regions, isLoading } = useListRegionPolicies();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Regions</h1>
        <p className="text-sm text-muted-foreground">
          Deployment regions and latency
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))
        ) : regions?.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-12 text-center">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
              <MapPin className="size-6" />
            </div>
            <div className="flex max-w-sm flex-col items-center gap-1">
              <div className="text-lg font-medium tracking-tight">
                No regions configured
              </div>
              <p className="text-sm text-muted-foreground">
                Add deployment regions for your workflows
              </p>
            </div>
          </div>
        ) : (
          regions?.map((r) => (
            <Card key={r.id}>
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <CardTitle className="text-sm">{r.name}</CardTitle>
                    <p className="text-xs text-muted-foreground font-mono">
                      {r.region}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      r.tier === "premium"
                        ? "success"
                        : r.tier === "edge"
                          ? "info"
                          : "secondary"
                    }
                  >
                    {r.tier}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Replication: {r.replicationFactor}x
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
