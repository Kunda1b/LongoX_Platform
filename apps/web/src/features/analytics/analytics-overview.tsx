"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart3,
  TrendingUp,
  Clock,
  AlertTriangle,
  PlayCircle,
} from "lucide-react";
import {
  useGetExecutionAnalytics,
  useGetWorkflowAnalytics,
} from "@longox/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export function AnalyticsOverview() {
  const { data: dailyStats, isLoading: isLoadingDaily } =
    useGetExecutionAnalytics({ days: 14 });
  const { data: workflowStats, isLoading: isLoadingWorkflows } =
    useGetWorkflowAnalytics();

  const aggregateStats = useMemo(() => {
    if (!dailyStats) return { total: 0, success: 0, failed: 0, successRate: 0 };

    const total = dailyStats.reduce((acc, stat) => acc + stat.total, 0);
    const success = dailyStats.reduce((acc, stat) => acc + stat.success, 0);
    const failed = dailyStats.reduce((acc, stat) => acc + stat.failed, 0);
    const successRate = total > 0 ? (success / total) * 100 : 0;

    return { total, success, failed, successRate };
  }, [dailyStats]);

  const avgDurationMs = useMemo(() => {
    if (!workflowStats || workflowStats.length === 0) return 0;
    const workflowsWithDuration = workflowStats.filter(
      (w) => w.avgDurationMs != null,
    );
    if (workflowsWithDuration.length === 0) return 0;

    const totalAvg = workflowsWithDuration.reduce(
      (acc, w) => acc + (w.avgDurationMs || 0),
      0,
    );
    return totalAvg / workflowsWithDuration.length;
  }, [workflowStats]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Usage and performance metrics (Last 14 days)
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Executions
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingDaily ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">
                {aggregateStats.total.toLocaleString()}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            {isLoadingDaily ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">
                {aggregateStats.successRate.toFixed(1)}%
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Failed Executions
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {isLoadingDaily ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">
                {aggregateStats.failed.toLocaleString()}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg. Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingWorkflows ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">
                {(avgDurationMs / 1000).toFixed(2)}s
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">
              Execution Volume (Last 14 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingDaily ? (
              <div className="h-48 flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : !dailyStats || dailyStats.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground">
                No execution data
              </div>
            ) : (
              <div className="flex h-48 items-end gap-2">
                {dailyStats.map((stat, i) => {
                  const maxTotal = Math.max(
                    ...dailyStats.map((s) => s.total),
                    1,
                  );
                  const heightPct = (stat.total / maxTotal) * 100;
                  return (
                    <div
                      key={i}
                      className="flex flex-1 flex-col items-center gap-1 group relative"
                    >
                      {/* Tooltip on hover */}
                      <div className="absolute -top-10 scale-0 transition-all rounded bg-popover px-2 py-1 text-xs text-popover-foreground shadow-sm group-hover:scale-100 z-10 whitespace-nowrap">
                        {stat.total} runs
                      </div>
                      <div
                        className="w-full rounded-md bg-primary/20 transition-all group-hover:bg-primary/40"
                        style={{ height: `${Math.max(heightPct, 5)}%` }}
                      >
                        {stat.failed > 0 && (
                          <div
                            className="w-full bg-red-500/50 rounded-b-md"
                            style={{
                              height: `${(stat.failed / stat.total) * 100}%`,
                            }}
                          />
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground hidden sm:block whitespace-nowrap overflow-hidden text-ellipsis w-full text-center">
                        {format(new Date(stat.date), "MMM d")}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Workflow Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingWorkflows ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : !workflowStats || workflowStats.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No workflow stats available
              </div>
            ) : (
              <div className="rounded-md border">
                <div className="grid grid-cols-12 border-b bg-muted/50 p-3 text-xs font-medium">
                  <div className="col-span-5">Workflow</div>
                  <div className="col-span-2 text-right">Total Runs</div>
                  <div className="col-span-3 text-right">Success Rate</div>
                  <div className="col-span-2 text-right">Avg Duration</div>
                </div>
                <div className="divide-y">
                  {workflowStats
                    .sort((a, b) => b.total - a.total)
                    .map((ws) => (
                      <div
                        key={ws.workflowId}
                        className="grid grid-cols-12 p-3 text-sm items-center"
                      >
                        <div className="col-span-5 font-medium flex items-center gap-2">
                          <PlayCircle className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate">{ws.workflowName}</span>
                        </div>
                        <div className="col-span-2 text-right">
                          {ws.total.toLocaleString()}
                        </div>
                        <div className="col-span-3 text-right">
                          <span
                            className={
                              ws.success / (ws.total || 1) < 0.9
                                ? "text-red-500 font-medium"
                                : "text-emerald-500"
                            }
                          >
                            {ws.total > 0
                              ? ((ws.success / ws.total) * 100).toFixed(1)
                              : 0}
                            %
                          </span>
                        </div>
                        <div className="col-span-2 text-right text-muted-foreground">
                          {ws.avgDurationMs
                            ? `${(ws.avgDurationMs / 1000).toFixed(2)}s`
                            : "-"}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
