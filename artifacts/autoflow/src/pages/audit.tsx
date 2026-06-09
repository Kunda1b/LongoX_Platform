import { useState } from "react";
import { useListAuditLog, getListAuditLogQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldCheck, RefreshCw, Search } from "lucide-react";
import { format } from "date-fns";

const resourceColors: Record<string, string> = {
  workflow: "bg-blue-100 text-blue-700",
  connector: "bg-violet-100 text-violet-700",
  credential: "bg-amber-100 text-amber-700",
  execution: "bg-emerald-100 text-emerald-700",
  app: "bg-pink-100 text-pink-700",
};

function actionLabel(action: string) {
  return action.replace(/\./g, " › ");
}

export default function AuditPage() {
  const qc = useQueryClient();
  const [resourceType, setResourceType] = useState<string>("");
  const [search, setSearch] = useState("");

  const logs = useListAuditLog({
    resourceType: resourceType || undefined,
    limit: 50,
  });

  function refresh() {
    qc.invalidateQueries({ queryKey: getListAuditLogQueryKey() });
  }

  const filtered = (logs.data ?? []).filter((l: { action: string }) =>
    !search || l.action.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Audit Log</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Security and activity events across the platform</p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh}>
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh
        </Button>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-8 h-8 text-sm" placeholder="Filter by action..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={resourceType || "all"} onValueChange={(v) => setResourceType(v === "all" ? "" : v)}>
          <SelectTrigger className="w-36 h-8 text-sm">
            <SelectValue placeholder="Resource type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All resources</SelectItem>
            <SelectItem value="workflow">Workflow</SelectItem>
            <SelectItem value="connector">Connector</SelectItem>
            <SelectItem value="credential">Credential</SelectItem>
            <SelectItem value="execution">Execution</SelectItem>
            <SelectItem value="app">App</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground w-44">Timestamp</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Action</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Resource</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground w-24">Actor</th>
            </tr>
          </thead>
          <tbody>
            {logs.isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="px-4 py-3"><Skeleton className="h-3 w-32" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-3 w-40" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-3 w-20" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-3 w-16" /></td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-12 text-sm text-muted-foreground">
                  <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
                  No audit events found
                </td>
              </tr>
            ) : (
              filtered.map((log: { id: number; action: string; actorType: string; resourceType: string; resourceId: string; createdAt: string }) => (
                <tr key={log.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-2.5 text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                    {format(new Date(log.createdAt), "MMM d, HH:mm:ss")}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="font-mono text-xs">{actionLabel(log.action)}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${resourceColors[log.resourceType] ?? "bg-gray-100 text-gray-600"}`}>
                        {log.resourceType}
                      </span>
                      <span className="text-xs text-muted-foreground">#{log.resourceId}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge variant="secondary" className="text-xs">{log.actorType}</Badge>
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
