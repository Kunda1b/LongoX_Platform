"use client";

import { useListDashboards } from "@longox/api-client-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Palette, Plus } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardsPage() {
  const { data: dashboards, isLoading } = useListDashboards();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboards</h1>
          <p className="text-sm text-muted-foreground">
            Visualize workflow data and metrics
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboards/new">
            <Plus className="mr-1 h-4 w-4" /> New Dashboard
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))
        ) : dashboards?.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-12 text-center">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
              <Palette className="size-6" />
            </div>
            <div className="flex max-w-sm flex-col items-center gap-1">
              <div className="text-lg font-medium tracking-tight">
                No dashboards yet
              </div>
              <p className="text-sm text-muted-foreground">
                Create dashboards to visualize your workflow data
              </p>
            </div>
            <Button asChild className="mt-2">
              <Link href="/dashboards/new">
                <Plus className="mr-1 h-4 w-4" /> Create your first dashboard
              </Link>
            </Button>
          </div>
        ) : (
          dashboards?.map((d) => (
            <Card
              key={d.id}
              className="cursor-pointer transition-colors hover:border-primary/50"
            >
              <CardHeader>
                <Palette className="h-5 w-5 text-primary" />
                <CardTitle className="mt-2 text-sm">{d.name}</CardTitle>
                <CardDescription className="text-xs">
                  {d.widgets.length} widgets
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Updated {new Date(d.updatedAt).toLocaleDateString()}
                </span>
                <Badge variant={d.status === "published" ? "info" : "secondary"}>
                  {d.status}
                </Badge>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
