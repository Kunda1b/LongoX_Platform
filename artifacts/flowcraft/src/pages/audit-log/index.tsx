import { useState } from "react";
import { useListAuditLog } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, Search, Shield } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";

const ACTION_COLORS: Record<string, string> = {
  "workflow.created": "bg-green-100 text-green-800",
  "workflow.updated": "bg-blue-100 text-blue-800",
  "workflow.deleted": "bg-red-100 text-red-800",
  "workflow.active": "bg-emerald-100 text-emerald-800",
  "workflow.inactive": "bg-gray-100 text-gray-800",
  "workflow.duplicated": "bg-indigo-100 text-indigo-800",
  "execution.started": "bg-blue-100 text-blue-800",
  "execution.completed": "bg-green-100 text-green-800",
  "execution.failed": "bg-red-100 text-red-800",
  "execution.retried": "bg-yellow-100 text-yellow-800",
  "execution.node_failed": "bg-orange-100 text-orange-800",
};

function actionBadge(action: string) {
  const cls = ACTION_COLORS[action] ?? "bg-gray-100 text-gray-800";
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>
      {action}
    </span>
  );
}

function actorBadge(actorType: string) {
  if (actorType === "webhook") return <Badge variant="outline" className="text-purple-700 border-purple-300">webhook</Badge>;
  if (actorType === "system") return <Badge variant="secondary">system</Badge>;
  return <Badge variant="outline">user</Badge>;
}

function resourceLink(resourceType: string, resourceId: string) {
  if (resourceType === "workflow") return <Link href={`/workflows/${resourceId}`} className="text-primary hover:underline font-mono text-sm">workflow/{resourceId}</Link>;
  if (resourceType === "execution") return <Link href={`/executions/${resourceId}`} className="text-primary hover:underline font-mono text-sm">execution/{resourceId}</Link>;
  return <span className="font-mono text-sm">{resourceType}/{resourceId}</span>;
}

const RESOURCE_TYPES = ["all", "workflow", "execution"];
const ACTION_OPTIONS = ["all", "workflow.created", "workflow.updated", "workflow.deleted", "execution.started", "execution.completed", "execution.failed", "execution.retried"];

export default function AuditLogPage() {
  const [search, setSearch] = useState("");
  const [resourceType, setResourceType] = useState("all");
  const [selectedAction, setSelectedAction] = useState("all");

  const queryParams: Record<string, string> = {};
  if (resourceType !== "all") queryParams.resourceType = resourceType;
  if (selectedAction !== "all") queryParams.action = selectedAction;

  const { data: entries = [], isLoading, refetch } = useListAuditLog(queryParams);

  const filtered = entries.filter((e) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return e.action.includes(q) || e.resourceType.includes(q) || e.resourceId.includes(q) ||
      (e.actorId ?? "").toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Audit Log</h1>
          <p className="text-muted-foreground text-sm mt-1">Full event trail for workflows and executions</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search events…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={resourceType} onValueChange={setResourceType}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Resource" />
          </SelectTrigger>
          <SelectContent>
            {RESOURCE_TYPES.map((r) => <SelectItem key={r} value={r}>{r === "all" ? "All resources" : r}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={selectedAction} onValueChange={setSelectedAction}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent>
            {ACTION_OPTIONS.map((a) => <SelectItem key={a} value={a}>{a === "all" ? "All actions" : a}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Events ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
              <Shield className="h-10 w-10" />
              <p className="font-medium">No events found</p>
              <p className="text-sm">Run workflows to see audit events here.</p>
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map((entry) => (
                <div key={entry.id} className="px-6 py-4 hover:bg-muted/40 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="pt-0.5">{actionBadge(entry.action)}</div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {resourceLink(entry.resourceType, entry.resourceId)}
                          <span className="text-muted-foreground text-xs">by</span>
                          {actorBadge(entry.actorType)}
                          {entry.actorId && <span className="text-xs text-muted-foreground">{entry.actorId}</span>}
                        </div>
                        {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                          <details className="mt-1">
                            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                              View metadata
                            </summary>
                            <pre className="mt-1 text-xs bg-muted rounded p-2 overflow-auto max-h-32">
                              {JSON.stringify(entry.metadata, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap pt-1" title={entry.createdAt}>
                      {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
