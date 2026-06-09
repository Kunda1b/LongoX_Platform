import { useState } from "react";
import { Link } from "wouter";
import { useListExecutions } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/badges";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export default function Executions() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const { data: executions, isLoading } = useListExecutions({ 
    status: statusFilter !== "all" ? statusFilter as any : undefined 
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Executions</h1>
          <p className="text-muted-foreground mt-1">History and logs of your workflow runs.</p>
        </div>
        <div className="w-[180px]">
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Workflow</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Started At</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-12 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : executions?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No executions found.
                </TableCell>
              </TableRow>
            ) : (
              executions?.map((exec) => (
                <TableRow key={exec.id}>
                  <TableCell className="font-medium">
                    <Link href={`/workflows/${exec.workflowId}`} className="hover:underline">
                      {exec.workflowName}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={exec.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(exec.startedAt), "MMM d, yyyy HH:mm:ss")}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {exec.durationMs ? `${exec.durationMs}ms` : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/executions/${exec.id}`} className="text-primary hover:underline text-sm font-medium">
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
  );
}