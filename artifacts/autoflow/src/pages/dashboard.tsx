import { Link } from "wouter";
import { useGetDashboardSummary, useGetRecentActivity, useGetExecutionAnalytics } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { GitBranch, PlayCircle, CheckCircle2, AlertCircle, Zap, TrendingUp, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

function StatCard({ title, value, sub, icon: Icon, color }: { title: string; value: string | number; sub?: string; icon: React.ElementType; color: string }) {
  return (
    <Card>
      <CardContent className="pt-5 pb-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
            <p className="text-2xl font-bold mt-1 tabular-nums">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
          <div className={`flex items-center justify-center w-9 h-9 rounded-lg ${color}`}>
            <Icon className="w-4.5 h-4.5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    success: "bg-emerald-100 text-emerald-700 border-emerald-200",
    failed: "bg-red-100 text-red-700 border-red-200",
    running: "bg-blue-100 text-blue-700 border-blue-200",
    cancelled: "bg-gray-100 text-gray-600 border-gray-200",
  };
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[0.7rem] font-medium border ${map[status] ?? map.cancelled}`}>
      {status}
    </span>
  );
}

export default function DashboardPage() {
  const summary = useGetDashboardSummary();
  const activity = useGetRecentActivity({ limit: 8 });
  const analytics = useGetExecutionAnalytics({ days: 14 });

  const chartData = analytics.data ?? [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Platform overview and execution health</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summary.isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Card key={i}><CardContent className="pt-5 pb-5"><Skeleton className="h-16" /></CardContent></Card>)
        ) : (
          <>
            <StatCard title="Active Workflows" value={summary.data?.activeWorkflows ?? 0} sub={`of ${summary.data?.totalWorkflows ?? 0} total`} icon={GitBranch} color="bg-primary/10 text-primary" />
            <StatCard title="Executions Today" value={summary.data?.executionsToday ?? 0} sub={`${summary.data?.failedToday ?? 0} failed`} icon={PlayCircle} color="bg-blue-100 text-blue-600" />
            <StatCard title="Success Rate" value={`${((summary.data?.successRate ?? 0) * 100).toFixed(1)}%`} sub="last 30 days" icon={TrendingUp} color="bg-emerald-100 text-emerald-600" />
            <StatCard title="Connectors" value={summary.data?.totalConnectors ?? 0} sub={`${summary.data?.totalApps ?? 0} apps built`} icon={Zap} color="bg-violet-100 text-violet-600" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Execution chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Executions — Last 14 Days</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, border: "1px solid hsl(var(--border))", borderRadius: 6 }}
                    formatter={(v: number, name: string) => [v, name === "success" ? "Success" : "Failed"]}
                  />
                  <Area type="monotone" dataKey="success" stroke="#10b981" strokeWidth={2} fill="url(#colorSuccess)" />
                  <Area type="monotone" dataKey="failed" stroke="#ef4444" strokeWidth={2} fill="url(#colorFailed)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <Link href="/executions">
              <a className="text-xs text-primary hover:underline">View all</a>
            </Link>
          </CardHeader>
          <CardContent className="space-y-0 p-0">
            {activity.isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                    <Skeleton className="w-5 h-5 rounded-full" />
                    <div className="flex-1 space-y-1"><Skeleton className="h-3 w-32" /><Skeleton className="h-2.5 w-20" /></div>
                  </div>
                ))
              : (activity.data ?? []).map((item: { id: number; workflowName: string; status: string; startedAt: string }) => (
                  <Link key={item.id} href={`/executions/${item.id}`}>
                    <a className="flex items-center gap-3 px-4 py-2.5 hover:bg-accent transition-colors border-b border-border last:border-0">
                      {item.status === "success" ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : item.status === "failed" ? (
                        <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                      ) : (
                        <Clock className="w-4 h-4 text-blue-500 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{item.workflowName}</p>
                        <p className="text-[0.7rem] text-muted-foreground">
                          {formatDistanceToNow(new Date(item.startedAt), { addSuffix: true })}
                        </p>
                      </div>
                      {statusBadge(item.status)}
                    </a>
                  </Link>
                ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
