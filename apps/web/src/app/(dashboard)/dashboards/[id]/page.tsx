"use client";

import { use } from "react";
import { useGetDashboard } from "@longox/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardBuilder } from "@/features/dashboards/dashboard-builder";

export default function DashboardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: dashboard, isLoading } = useGetDashboard(parseInt(id));

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Dashboard not found</p>
      </div>
    );
  }

  const existingDashboard = {
    id: String(dashboard.id),
    title: dashboard.name,
    layout: { columns: 12, rows: 0, gap: 16, breakpoints: {} },
    widgets: (dashboard.widgets ?? []) as any,
    theme: {},
    permissions: { visibility: "private" as const, allowedRoles: [], widgetOverrides: {} },
  };

  return <DashboardBuilder existingDashboard={existingDashboard} />;
}
