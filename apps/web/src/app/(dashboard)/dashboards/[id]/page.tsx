"use client";

import { use } from "react";
import { useGetDashboard } from "@longox/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Palette } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: dashboard, isLoading } = useGetDashboard({ id: parseInt(id) });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isLoading ? (
              <Skeleton className="h-8 w-64" />
            ) : (
              dashboard?.name || "Dashboard"
            )}
          </h1>
          <p className="text-sm text-muted-foreground">
            {dashboard?.description || `Dashboard ID: ${id}`}
          </p>
        </div>
        <Button size="sm">
          <Plus className="mr-1 h-4 w-4" /> Add Widget
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : dashboard?.widgets && dashboard.widgets.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {dashboard.widgets.map((widget) => (
            <Card key={widget.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{widget.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex h-32 items-center justify-center text-muted-foreground text-sm">
                  {widget.type} widget
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">No Widgets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center gap-2 py-8">
                <Palette className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Add widgets to visualize your data
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
