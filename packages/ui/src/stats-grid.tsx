import { Card, CardContent, CardHeader, CardTitle } from "@autoflow/design-system";
import { Skeleton } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface StatCard {
  title: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  description?: string;
  loading?: boolean;
}

export interface StatsGridProps {
  stats: StatCard[];
  columns?: 2 | 3 | 4;
}

export function StatsGrid({ stats, columns = 4 }: StatsGridProps) {
  return (
    <div
      className={`grid gap-3 sm:gap-4 ${
        columns === 2 ? "grid-cols-2" : columns === 3 ? "grid-cols-1 md:grid-cols-3" : "grid-cols-2 md:grid-cols-4"
      }`}
    >
      {stats.map((stat, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 pt-4 sm:px-6 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground leading-tight">
              {stat.title}
            </CardTitle>
            {stat.icon && <stat.icon className="h-4 w-4 text-primary" />}
          </CardHeader>
          <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
            {stat.loading ? (
              <div className="h-7 w-20 bg-muted animate-pulse rounded" />
            ) : (
              <div className="text-xl sm:text-2xl font-bold">{stat.value}</div>
            )}
            {stat.description && (
              <p className="text-xs text-muted-foreground mt-1 hidden sm:block">{stat.description}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
