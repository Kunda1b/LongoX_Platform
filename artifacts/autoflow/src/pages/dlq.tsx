import { useState } from "react";
import { useListDlqEntries, getListDlqEntriesQueryKey, useRetryDlqEntry, useDismissDlqEntry } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, RotateCcw, X, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function DlqPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("unresolved");
  const retryMut = useRetryDlqEntry();
  const dismissMut = useDismissDlqEntry();

  const entries = useListDlqEntries({ resolved: filter === "resolved" ? true : filter === "unresolved" ? false : undefined, limit: 50 });

  function retry(id: number) {
    retryMut.mutate({ id }, { onSuccess: () => qc.invalidateQueries({ queryKey: getListDlqEntriesQueryKey() }) });
  }

  function dismiss(id: number) {
    dismissMut.mutate({ id }, { onSuccess: () => qc.invalidateQueries({ queryKey: getListDlqEntriesQueryKey() }) });
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Dead Letter Queue</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Failed jobs that could not be processed after retries</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-36 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unresolved">Unresolved</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => qc.invalidateQueries({ queryKey: getListDlqEntriesQueryKey() })}>
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh
          </Button>
        </div>
      </div>

      {entries.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : (entries.data ?? []).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertCircle className="w-10 h-10 text-muted-foreground/40 mb-3" />
          <p className="font-medium text-sm">No failed jobs</p>
          <p className="text-xs text-muted-foreground mt-1">
            {filter === "unresolved" ? "All jobs are processing successfully." : "No resolved jobs found."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {(entries.data ?? []).map((entry: {
            id: number; executionId: number; workflowId: number; workflowName: string;
            nodeId: string; nodeName: string; nodeType: string; errorMessage: string;
            attempts: number; jobData: Record<string, unknown>; createdAt: string;
            resolvedAt: string | null; resolution: string | null;
          }) => (
            <div key={entry.id} className={`border rounded-lg p-4 ${entry.resolvedAt ? "opacity-60" : ""}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${entry.resolvedAt ? "text-gray-400" : "text-red-500"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-1.5 mb-1">
                      <span className="text-sm font-medium">{entry.workflowName}</span>
                      <span className="text-muted-foreground text-xs">›</span>
                      <span className="text-sm text-muted-foreground">{entry.nodeName}</span>
                      <Badge variant="secondary" className="text-xs">{entry.nodeType}</Badge>
                      {entry.resolvedAt && <Badge className="text-xs bg-gray-100 text-gray-600 border-gray-200">{entry.resolution ?? "resolved"}</Badge>}
                    </div>
                    <p className="text-xs text-red-600 font-medium mb-1.5">{entry.errorMessage}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{entry.attempts} attempt{entry.attempts !== 1 ? "s" : ""}</span>
                      <span>Failed {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}</span>
                      <span>Execution #{entry.executionId}</span>
                    </div>
                    {Object.keys(entry.jobData ?? {}).length > 0 && (
                      <details className="mt-2">
                        <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">Job data</summary>
                        <pre className="text-xs bg-muted/60 rounded p-2 mt-1 overflow-x-auto">{JSON.stringify(entry.jobData, null, 2)}</pre>
                      </details>
                    )}
                  </div>
                </div>
                {!entry.resolvedAt && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => retry(entry.id)} disabled={retryMut.isPending}>
                      <RotateCcw className="w-3 h-3 mr-1" /> Retry
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground hover:text-foreground" onClick={() => dismiss(entry.id)} disabled={dismissMut.isPending}>
                      <X className="w-3 h-3 mr-1" /> Dismiss
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
