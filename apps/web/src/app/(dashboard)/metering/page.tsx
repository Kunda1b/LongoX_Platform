"use client";

import {
  useGetUsageSummary,
  useListUsageEvents,
} from "@longox/api-client-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, Zap, Database, Cpu, Plug, Globe } from "lucide-react";

const METRIC_ICONS: Record<string, typeof Activity> = {
  "workflow.run": Activity,
  "connector.call": Plug,
  "ai.token": Zap,
  "api.call": Globe,
  "storage.used": Database,
  "webhook.received": Globe,
  "user.seat": Cpu,
};

const METRIC_LABELS: Record<string, string> = {
  "workflow.run": "Workflow Executions",
  "connector.call": "Connector Calls",
  "ai.token": "AI Tokens Used",
  "api.call": "API Calls",
  "storage.used": "Storage Used",
  "webhook.received": "Webhooks Received",
  "user.seat": "Active Users",
};

export default function MeteringPage() {
  const { data: usage, isLoading: usageLoading } = useGetUsageSummary();
  const { data: events, isLoading: eventsLoading } = useListUsageEvents();

  const totalEvents = Array.isArray(events) ? events.length : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Usage & Metering</h1>
        <p className="text-sm text-muted-foreground">
          Track resource usage across workflows, connectors, AI, and storage
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Executions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {usageLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {(usage as any)?.totalExecutions?.toLocaleString() ?? "0"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {(usage as any)?.executionsThisMonth?.toLocaleString() ?? "0"}{" "}
                  this month
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Workflows</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {usageLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {(usage as any)?.totalWorkflows?.toLocaleString() ?? "0"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {(usage as any)?.activeWorkflows?.toLocaleString() ?? "0"}{" "}
                  active
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Connectors</CardTitle>
            <Plug className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {usageLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {(usage as any)?.usedConnectors?.toLocaleString() ?? "0"}
                </div>
                <p className="text-xs text-muted-foreground">
                  of {(usage as any)?.totalConnectors?.toLocaleString() ?? "0"}{" "}
                  available
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Events Today</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEvents}</div>
            <p className="text-xs text-muted-foreground">
              Metering events recorded
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Usage Events */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Usage Events</CardTitle>
          <CardDescription>
            Latest metering events across all services
          </CardDescription>
        </CardHeader>
        <CardContent>
          {eventsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !Array.isArray(events) || events.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No usage events recorded yet
            </p>
          ) : (
            <div className="space-y-2">
              {(events as any[]).slice(0, 20).map((event: any) => {
                const Icon = METRIC_ICONS[event.eventType] ?? Activity;
                return (
                  <div
                    key={event.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <span className="text-sm font-medium">
                          {METRIC_LABELS[event.eventType] ?? event.eventType}
                        </span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          {event.quantity} × {event.source ?? "system"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        +{event.quantity}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(
                          event.createdAt ?? event.timestamp,
                        ).toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
