"use client";

import { useListApps } from "@longox/api-client-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Puzzle, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function AppsPage() {
  const { data: apps, isLoading } = useListApps();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Apps</h1>
          <p className="text-sm text-muted-foreground">
            Manage your integrated applications
          </p>
        </div>
        <Button>
          <Plus className="mr-1 h-4 w-4" /> New App
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))
        ) : apps?.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-12 text-center">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
              <Puzzle className="size-6" />
            </div>
            <div className="flex max-w-sm flex-col items-center gap-1">
              <div className="text-lg font-medium tracking-tight">
                No apps yet
              </div>
              <p className="text-sm text-muted-foreground">
                Create apps to extend platform functionality
              </p>
            </div>
            <Button className="mt-2">
              <Plus className="mr-1 h-4 w-4" /> Create your first app
            </Button>
          </div>
        ) : (
          apps?.map((app) => (
            <Card
              key={app.id}
              className="cursor-pointer transition-colors hover:border-primary/50"
            >
              <CardHeader>
                <Puzzle className="h-5 w-5 text-primary" />
                <CardTitle className="mt-2 text-sm">{app.name}</CardTitle>
                <CardDescription className="text-xs">
                  {app.description || "No description"}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      app.status === "published" ? "success" : "secondary"
                    }
                  >
                    {app.status}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {app.type}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground">
                  {app.viewCount || 0} views
                </span>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
