"use client";

import { useListAiModels } from "@longox/api-client-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HardDrive, Check } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function AIModelsPage() {
  const { data: models, isLoading } = useListAiModels();

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
            <Skeleton key={i} className="h-40 w-full" />
          ))
        ) : models?.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-12 text-center">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
              <HardDrive className="size-6" />
            </div>
            <div className="flex max-w-sm flex-col items-center gap-1">
              <div className="text-lg font-medium tracking-tight">
                No AI models configured
              </div>
              <p className="text-sm text-muted-foreground">
                Add AI models to use in your workflows
              </p>
            </div>
          </div>
        ) : (
          models?.map((m) => (
            <Card key={m.id}>
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div>
                  <CardTitle className="text-sm">{m.name}</CardTitle>
                  <CardDescription className="text-xs">
                    {m.provider}
                  </CardDescription>
                </div>
                <HardDrive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={m.isEnabled ? "success" : "warning"}>
                    {m.isEnabled ? "enabled" : "disabled"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {m.contextWindow.toLocaleString()} context
                  </span>
                </div>
                <Button variant="ghost" size="sm">
                  {m.isEnabled ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    "Enable"
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
