import { 
  useGetExecutionAnalytics, 
  useGetWorkflowAnalytics 
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { format } from "date-fns";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Progress } from "@/components/ui/progress";

export default function Analytics() {
  const { data: execAnalytics = [], isLoading: isLoadingExec } = useGetExecutionAnalytics({ days: 14 });
  const { data: wfAnalytics = [], isLoading: isLoadingWf } = useGetWorkflowAnalytics();

  const formattedChartData = execAnalytics.map(d => ({
    ...d,
    displayDate: format(new Date(d.date), "MMM dd")
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Process Analytics</h1>
        <p className="text-muted-foreground mt-2">Monitor automation performance and workflow reliability.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Execution Trend (14 Days)</CardTitle>
          <CardDescription>Daily volume of workflow runs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] w-full">
            {isLoadingExec ? (
              <div className="h-full w-full flex items-center justify-center text-muted-foreground">Loading chart...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={formattedChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px" }}
                    itemStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorTotal)" name="Total Runs" />
                  <Area type="monotone" dataKey="failed" stroke="hsl(var(--destructive))" fillOpacity={1} fill="url(#colorFailed)" name="Failed Runs" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Workflow Performance</CardTitle>
          <CardDescription>Detailed statistics per workflow</CardDescription>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground bg-muted/50 uppercase border-y border-border">
              <tr>
                <th className="px-6 py-4 font-medium">Workflow Name</th>
                <th className="px-6 py-4 font-medium text-right">Total Runs</th>
                <th className="px-6 py-4 font-medium text-right text-green-600">Success</th>
                <th className="px-6 py-4 font-medium text-right text-red-600">Failed</th>
                <th className="px-6 py-4 font-medium text-right">Avg Duration</th>
                <th className="px-6 py-4 font-medium w-48">Success Rate</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingWf ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">Loading data...</td>
                </tr>
              ) : wfAnalytics.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">No workflow data available.</td>
                </tr>
              ) : (
                wfAnalytics.map((stat) => (
                  <tr key={stat.workflowId} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">{stat.workflowName}</td>
                    <td className="px-6 py-4 text-right">{stat.totalRuns}</td>
                    <td className="px-6 py-4 text-right font-medium text-green-600">{stat.successCount}</td>
                    <td className="px-6 py-4 text-right font-medium text-red-600">{stat.failedCount}</td>
                    <td className="px-6 py-4 text-right text-muted-foreground">{stat.avgDurationMs ? `${Math.round(stat.avgDurationMs)}ms` : '-'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Progress value={stat.successRate} className="h-2 flex-1" />
                        <span className="text-xs font-medium w-10 text-right">{Math.round(stat.successRate)}%</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}