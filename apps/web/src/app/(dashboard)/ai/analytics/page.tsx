"use client";

import { useGetAiUsageSummary } from "@longox/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Activity, DollarSign, Zap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function AIAnalyticsPage() {
  const { data: usage, isLoading } = useGetAiUsageSummary();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AI Analytics</h1>
        <p className="text-sm text-muted-foreground">
          AI usage and cost metrics
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <div className="text-2xl font-bold">
                  {usage?.totalRequests?.toLocaleString() || "0"}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Tokens</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <div className="text-2xl font-bold">
                  {(
                    (usage?.totalInputTokens || 0) +
                    (usage?.totalOutputTokens || 0)
                  ).toLocaleString() || "0"}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Cost</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <div className="text-2xl font-bold">
                  ${(usage?.totalCost || 0).toFixed(2)}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Input Tokens</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <div className="text-2xl font-bold">
                  {usage?.totalInputTokens?.toLocaleString() || "0"}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {!isLoading && usage?.byProvider && usage.byProvider.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Usage by Provider</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(usage.byProvider as Array<{ provider: string; requests: number; cost: number }>).map((p) => (
                <div
                  key={p.provider}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <span className="text-sm font-medium">{p.provider}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">
                      {p.requests.toLocaleString()} requests
                    </span>
                    <span className="text-sm font-medium">
                      ${p.cost.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
