"use client";

import { useListFeatureFlags } from "@longox/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Flag, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function FeatureFlagsPage() {
  const { data: flags, isLoading } = useListFeatureFlags();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flag className="h-5 w-5" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Feature Flags</h1>
            <p className="text-sm text-muted-foreground">
              Manage feature rollouts
            </p>
          </div>
        </div>
        <Button>
          <Plus className="mr-1 h-4 w-4" /> New Flag
        </Button>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))
        ) : flags?.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-12 text-center">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
              <Flag className="size-6" />
            </div>
            <div className="flex max-w-sm flex-col items-center gap-1">
              <div className="text-lg font-medium tracking-tight">
                No feature flags
              </div>
              <p className="text-sm text-muted-foreground">
                Create feature flags to control feature rollouts
              </p>
            </div>
            <Button className="mt-2">
              <Plus className="mr-1 h-4 w-4" /> Create first flag
            </Button>
          </div>
        ) : (
          flags?.map((f) => (
            <Card key={f.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Switch checked={f.enabled} />
                  <div>
                    <p className="text-sm font-medium">{f.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {f.description || f.key}
                    </p>
                  </div>
                </div>
                <Badge variant={f.enabled ? "success" : "secondary"}>
                  {f.enabled ? `${f.rolloutPercentage}% rollout` : "disabled"}
                </Badge>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
