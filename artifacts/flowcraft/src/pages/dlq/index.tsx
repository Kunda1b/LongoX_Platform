import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListDlqEntries,
  useRetryDlqEntry,
  useDismissDlqEntry,
  getListDlqEntriesQueryKey,
} from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, CheckCircle2, RefreshCw, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";

function nodeTypeColor(nodeType: string) {
  if (nodeType.startsWith("trigger.")) return "bg-green-100 text-green-800";
  if (nodeType.startsWith("action.")) return "bg-blue-100 text-blue-800";
  if (nodeType.startsWith("ai.")) return "bg-purple-100 text-purple-800";
  if (nodeType.startsWith("logic.")) return "bg-yellow-100 text-yellow-800";
  if (nodeType.startsWith("data.")) return "bg-orange-100 text-orange-800";
  return "bg-gray-100 text-gray-800";
}

export default function DlqPage() {
  const [filter, setFilter] = useState<"all" | "pending" | "resolved">("pending");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const resolvedParam = filter === "pending" ? false : filter === "resolved" ? true : undefined;
  const queryParams = resolvedParam !== undefined ? { resolved: resolvedParam } : {};

  const { data: entries = [], isLoading, refetch } = useListDlqEntries(queryParams);

  const retryMutation = useRetryDlqEntry({
    mutation: {
      onSuccess: () => {
        toast({ title: "Execution re-queued", description: "The workflow will run again shortly." });
        queryClient.invalidateQueries({ queryKey: getListDlqEntriesQueryKey() });
      },
      onError: () => toast({ title: "Retry failed", variant: "destructive" }),
    },
  });

  const dismissMutation = useDismissDlqEntry({
    mutation: {
      onSuccess: () => {
        toast({ title: "Entry dismissed" });
        queryClient.invalidateQueries({ queryKey: getListDlqEntriesQueryKey() });
      },
      onError: () => toast({ title: "Dismiss failed", variant: "destructive" }),
    },
  });

  const pending = entries.filter((e) => !e.resolvedAt);
  const resolved = entries.filter((e) => !!e.resolvedAt);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dead-Letter Queue</h1>
          <p className="text-muted-foreground text-sm mt-1">Failed job entries that exhausted all retry attempts</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg"><AlertTriangle className="h-5 w-5 text-red-600" /></div>
              <div>
                <div className="text-2xl font-bold">{pending.length}</div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg"><CheckCircle2 className="h-5 w-5 text-green-600" /></div>
              <div>
                <div className="text-2xl font-bold">{resolved.length}</div>
                <div className="text-sm text-muted-foreground">Resolved</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg"><RefreshCw className="h-5 w-5 text-blue-600" /></div>
              <div>
                <div className="text-2xl font-bold">{entries.filter((e) => e.resolution === "retried").length}</div>
                <div className="text-sm text-muted-foreground">Retried</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Failed Jobs</CardTitle>
              <CardDescription>Jobs that failed after all retry attempts</CardDescription>
            </div>
            <Tabs value={filter} onValueChange={(v) => setFilter(v as "all" | "pending" | "resolved")}>
              <TabsList>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="resolved">Resolved</TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">Loading…</div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
              <p className="font-medium">No {filter !== "all" ? filter : ""} entries</p>
              <p className="text-sm">All jobs are running cleanly.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Workflow</TableHead>
                  <TableHead>Failed Node</TableHead>
                  <TableHead>Error</TableHead>
                  <TableHead>Attempts</TableHead>
                  <TableHead>Failed At</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <Link href={`/workflows/${entry.workflowId}`} className="font-medium text-primary hover:underline">
                        {entry.workflowName}
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        <Link href={`/executions/${entry.executionId}`} className="hover:underline">
                          Run #{entry.executionId}
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{entry.nodeName}</div>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-mono ${nodeTypeColor(entry.nodeType)}`}>
                        {entry.nodeType}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="text-sm text-destructive truncate" title={entry.errorMessage}>{entry.errorMessage}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{entry.attempts}×</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground" title={entry.createdAt}>
                        {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
                      </span>
                    </TableCell>
                    <TableCell>
                      {entry.resolvedAt ? (
                        <Badge variant="outline" className="text-green-700 border-green-300">
                          {entry.resolution === "retried" ? "Retried" : "Dismissed"}
                        </Badge>
                      ) : (
                        <Badge variant="destructive">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {!entry.resolvedAt && (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => retryMutation.mutate({ id: entry.id })}
                            disabled={retryMutation.isPending}
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Retry
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-muted-foreground"
                            onClick={() => dismissMutation.mutate({ id: entry.id })}
                            disabled={dismissMutation.isPending}
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            Dismiss
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
