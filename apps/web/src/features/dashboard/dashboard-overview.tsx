"use client";

import Link from "next/link";
import {
  useGetDashboardSummary,
  useGetRecentActivity,
} from "@longox/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Activity,
  AppWindow,
  Cable,
  CheckCircle2,
  ListTree,
  PlayCircle,
  Settings2,
  XCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { StatusBadge } from "@/components/badges";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardOverview() {
  const { data: summary, isLoading: isLoadingSummary } =
    useGetDashboardSummary();
  const { data: activity, isLoading: isLoadingActivity } = useGetRecentActivity(
    { limit: 10 },
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">
          Platform overview and recent activity.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Active Workflows"
          value={
            isLoadingSummary
              ? null
              : `${summary?.activeWorkflows} / ${summary?.totalWorkflows}`
          }
          icon={<Cable className="h-4 w-4 text-primary" />}
        />
        <StatCard
          title="Executions Today"
          value={
            isLoadingSummary ? null : summary?.executionsToday.toLocaleString()
          }
          icon={<PlayCircle className="h-4 w-4 text-blue-500" />}
          description={`${summary?.totalExecutions.toLocaleString()} total`}
        />
        <StatCard
          title="Success Rate"
          value={
            isLoadingSummary ? null : `${summary?.successRate.toFixed(1)}%`
          }
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
          description={`${summary?.failedToday} failed today`}
        />
        <StatCard
          title="Platform Assets"
          value={isLoadingSummary ? null : summary?.totalApps}
          icon={<AppWindow className="h-4 w-4 text-purple-500" />}
          description={`${summary?.totalConnectors} connectors`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingActivity ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : activity && activity.length > 0 ? (
              <div className="space-y-3">
                {activity.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 sm:p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    {/* Status icon */}
                    <div
                      className={`p-2 rounded-full shrink-0 ${
                        item.status === "success"
                          ? "bg-emerald-100 text-emerald-600"
                          : item.status === "failed"
                            ? "bg-red-100 text-red-600"
                            : item.status === "running"
                              ? "bg-blue-100 text-blue-600"
                              : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {item.status === "success" && (
                        <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      )}
                      {item.status === "failed" && (
                        <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      )}
                      {item.status === "running" && (
                        <PlayCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-pulse" />
                      )}
                      {item.status === "cancelled" && (
                        <Settings2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      )}
                    </div>

                    {/* Name + meta — min-w-0 allows text to truncate */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        <Link
                          href={`/workflows/${item.workflowId}`}
                          className="hover:underline"
                        >
                          {item.workflowName}
                        </Link>
                      </div>
                      <div className="text-xs text-muted-foreground flex gap-2 mt-0.5">
                        <span className="truncate">
                          {formatDistanceToNow(new Date(item.startedAt), {
                            addSuffix: true,
                          })}
                        </span>
                        {item.durationMs && (
                          <span className="shrink-0">
                            · {item.durationMs}ms
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Badge + link */}
                    <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                      <StatusBadge status={item.status} />
                      <Link
                        href={`/executions/${item.id}`}
                        className="text-xs text-primary font-medium hover:underline hidden sm:inline"
                      >
                        Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <ListTree className="h-8 w-8 mx-auto mb-3 opacity-50" />
                <p>No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link
                href="/workflows"
                className="flex items-center justify-between p-3 rounded-md bg-secondary hover:bg-secondary/80 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Cable className="h-4 w-4" />
                  <span className="font-medium text-sm">Manage Workflows</span>
                </div>
              </Link>
              <Link
                href="/apps"
                className="flex items-center justify-between p-3 rounded-md bg-secondary hover:bg-secondary/80 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <AppWindow className="h-4 w-4" />
                  <span className="font-medium text-sm">Build Apps</span>
                </div>
              </Link>
              <Link
                href="/connectors"
                className="flex items-center justify-between p-3 rounded-md bg-secondary hover:bg-secondary/80 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Settings2 className="h-4 w-4" />
                  <span className="font-medium text-sm">
                    Explore Connectors
                  </span>
                </div>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  description,
}: {
  title: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  description?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 pt-4 sm:px-6 sm:pt-6">
        <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground leading-tight">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
        {value === null ? (
          <Skeleton className="h-7 w-20" />
        ) : (
          <div className="text-xl sm:text-2xl font-bold">{value}</div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1 hidden sm:block">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
