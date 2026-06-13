"use client";

import { useListEnvironments, useDeleteEnvironment, getListEnvironmentsQueryKey } from "@longox/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Globe, Plus, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function EnvironmentsPage() {
  const { data: environments, isLoading } = useListEnvironments();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteMutation = useDeleteEnvironment({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListEnvironmentsQueryKey() });
        toast({ title: "Environment deleted" });
      },
    },
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case "prod":
        return "destructive";
      case "staging":
        return "warning";
      case "dev":
        return "info";
      default:
        return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Environments</h1>
          <p className="text-sm text-muted-foreground">
            Manage deployment environments
          </p>
        </div>
        <Button>
          <Plus className="mr-1 h-4 w-4" /> Add Environment
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))
        ) : environments?.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-12 text-center">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
              <Globe className="size-6" />
            </div>
            <div className="flex max-w-sm flex-col items-center gap-1">
              <div className="text-lg font-medium tracking-tight">
                No environments yet
              </div>
              <p className="text-sm text-muted-foreground">
                Create environments to deploy your workflows
              </p>
            </div>
            <Button className="mt-2">
              <Plus className="mr-1 h-4 w-4" /> Create environment
            </Button>
          </div>
        ) : (
          environments?.map((env) => (
            <Card key={env.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm">{env.name}</CardTitle>
                  {env.isDefault && (
                    <Badge variant="outline" className="text-xs">
                      Default
                    </Badge>
                  )}
                </div>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant={getTypeColor(env.type) as "destructive" | "warning" | "info" | "secondary"}>
                    {env.type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {env.workflowCount} workflows
                  </span>
                </div>
                {env.description && (
                  <p className="text-xs text-muted-foreground">
                    {env.description}
                  </p>
                )}
                <div className="flex justify-end pt-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => {
                      if (confirm(`Delete environment "${env.name}"?`)) {
                        deleteMutation.mutate({ id: env.id });
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
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
