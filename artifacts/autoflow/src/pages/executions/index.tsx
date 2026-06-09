import { useState } from "react";
import { Link } from "wouter";
import { useListExecutions, getListExecutionsQueryKey, useRetryExecution } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, Search, CheckCircle2, AlertCircle, Clock, XCircle, RotateCcw } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

function statusIcon(status: string) {
  if (status === "success") return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
  if (status === "failed") return <AlertCircle className="w-4 h-4 text-red-500" />;
  if (status === "running") return <Clock className="w-4 h-4 text-blue-500" />;
  return <XCircle className="w-4 h-4 text-gray-400" />;
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

function fmtDuration(ms: number | null) {
  if (!ms) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export default function ExecutionsPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const executions = useListExecutions({
    status: statusFilter !== "all" ? statusFilter as "running" | "success" | "failed" | "cancelled" : undefined,
    limit: 50,
  });
  const retryMut = useRetryExecution();

  const filtered = (executions.data ?? []).filter((e: { workflowName: string }) =>
    !search || e.workflowName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Executions</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Execution history across all workflows</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => qc.invalidateQueries({ queryKey: getListExecutionsQueryKey() })}>
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh
        </Button>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-8 h-8 text-sm" placeholder="Filter by workflow..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32 h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="running">Running</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground w-8" />
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Workflow</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground w-24">Status</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground w-28">Duration</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground w-40">Started</th>
              <th className="w-24" />
            </tr>
          </thead>
          <tbody>
            {executions.isLoading ? (
              Array.from({ length: 7 }).map((_, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="px-4 py-3"><Skeleton className="w-4 h-4 rounded-full" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-3 w-40" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-3 w-20" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-3 w-16" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-3 w-28" /></td>
                  <td />
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-sm text-muted-foreground">No executions found</td>
              </tr>
            ) : (
              filtered.map((ex) => (
                <tr key={ex.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">{statusIcon(ex.status)}</td>
                  <td className="px-4 py-3">
                    <div>
                      <Link href={`/executions/${ex.id}`}>
                        <a className="font-medium hover:text-primary transition-colors">{ex.workflowName}</a>
                      </Link>
                      {ex.errorMessage && (
                        <p className="text-xs text-red-600 truncate max-w-xs mt-0.5">{ex.errorMessage}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">{statusBadge(ex.status)}</td>
                  <td className="px-4 py-3 tabular-nums text-xs text-muted-foreground">{fmtDuration(ex.durationMs ?? null)}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(ex.startedAt), { addSuffix: true })}
                  </td>
                  <td className="px-2 py-3 text-right">
                    {ex.status === "failed" && (
                      <Button
                        variant="ghost" size="sm" className="h-7 text-xs"
                        onClick={() => retryMut.mutate({ id: ex.id }, { onSuccess: () => qc.invalidateQueries({ queryKey: getListExecutionsQueryKey() }) })}
                      >
                        <RotateCcw className="w-3 h-3 mr-1" /> Retry
                      </Button>
                    )}
                    <Link href={`/executions/${ex.id}`}>
                      <a className="text-xs text-primary ml-2 hover:underline">Details</a>
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
