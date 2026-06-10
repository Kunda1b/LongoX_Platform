import { useState } from "react";
import { Link } from "wouter";
import { useListExecutions } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/badges";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Executions() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const { data: executions, isLoading } = useListExecutions({ 
    status: statusFilter !== "all" ? statusFilter as never : undefined 
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Executions</h1>
          <p className="text-muted-foreground mt-1">History and logs of your workflow runs.</p>
        </div>
        <div className="w-full sm:w-[180px]">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="running">Running</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border rounded-lg bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Workflow</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Started</TableHead>
                <TableHead className="hidden md:table-cell">Duration</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-12 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : executions?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12">
                    <div className="flex flex-col items-center justify-center gap-4 text-center">
                      <div className="bg-muted text-foreground flex size-12 items-center justify-center rounded-lg">
                        <Activity className="size-6" />
                      </div>
                      <div className="flex max-w-sm flex-col items-center gap-1">
                        <div className="text-lg font-medium tracking-tight">No executions yet</div>
                        <p className="text-muted-foreground text-sm">Run a workflow to see its execution history here.</p>
                      </div>
                      <Button variant="outline" asChild className="mt-2">
                        <Link href="/workflows">Go to workflows</Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                executions?.map((exec) => (
                  <TableRow key={exec.id}>
                    <TableCell className="font-medium">
                      <div className="min-w-0">
                        <Link href={`/workflows/${exec.workflowId}`} className="hover:underline truncate block max-w-[140px] sm:max-w-none">
                          {exec.workflowName}
                        </Link>
                        {/* Show time inline on mobile since the column is hidden */}
                        <span className="text-xs text-muted-foreground sm:hidden block mt-0.5">
                          {formatDistanceToNow(new Date(exec.startedAt), { addSuffix: true })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={exec.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm hidden sm:table-cell whitespace-nowrap">
                      {format(new Date(exec.startedAt), "MMM d, HH:mm")}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm hidden md:table-cell whitespace-nowrap">
                      {exec.durationMs ? `${exec.durationMs}ms` : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/executions/${exec.id}`} className="text-primary hover:underline text-sm font-medium whitespace-nowrap">
                        View Logs
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
