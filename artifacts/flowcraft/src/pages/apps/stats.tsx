import { useGetAppStats } from "@autoflow/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, AppWindow, FileText, LayoutDashboard, FormInput } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function AppStats() {
  const { data: stats, isLoading } = useGetAppStats();

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">App Statistics</h1>
        <p className="text-muted-foreground mt-1">Usage and overview across all internal tools.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Apps" value={isLoading ? null : stats?.totalApps} />
        <StatCard title="Published" value={isLoading ? null : stats?.publishedApps} />
        <StatCard title="Drafts" value={isLoading ? null : stats?.draftApps} />
        <StatCard title="Total Views" value={isLoading ? null : stats?.totalViews} />
      </div>

      <h2 className="text-xl font-semibold pt-6">Apps by Type</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))
        ) : (
          stats?.byType.map((typeStats) => (
            <Card key={typeStats.type}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase flex items-center gap-2">
                  {typeStats.type === 'dashboard' && <LayoutDashboard className="h-4 w-4" />}
                  {typeStats.type === 'crud' && <AppWindow className="h-4 w-4" />}
                  {typeStats.type === 'form' && <FormInput className="h-4 w-4" />}
                  {typeStats.type === 'report' && <FileText className="h-4 w-4" />}
                  {typeStats.type}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{typeStats.count}</div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string, value: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {value === null ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <div className="text-3xl font-bold">{value}</div>
        )}
      </CardContent>
    </Card>
  );
}