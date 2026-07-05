"use client";

import { useState } from "react";
import { useListAuditLog } from "@longox/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ScrollText, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

function auditSeverity(action: string): "error" | "warning" | "info" {
  if (action.includes("failed") || action.includes("error")) return "error";
  if (action.includes("delete")) return "warning";
  return "info";
}

export function AuditLogList() {
  const [search, setSearch] = useState("");
  const { data: entries, isLoading } = useListAuditLog({});

  const filteredEntries = entries?.filter(
    (e) =>
      e.action.toLowerCase().includes(search.toLowerCase()) ||
      (e.actorId ?? "").toLowerCase().includes(search.toLowerCase()) ||
      e.actorType.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ScrollText className="h-5 w-5" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Audit Log</h1>
            <p className="text-sm text-muted-foreground">
              Track all system events and changes
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm">
          <Download className="mr-1 h-4 w-4" /> Export
        </Button>
      </div>

      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search audit log..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-lg border">
        <div className="grid grid-cols-12 gap-4 border-b bg-muted/50 px-4 py-3 text-xs font-medium text-muted-foreground">
          <div className="col-span-3">Action</div>
          <div className="col-span-2">Actor</div>
          <div className="col-span-2">Resource</div>
          <div className="col-span-3">Timestamp</div>
          <div className="col-span-2">Severity</div>
        </div>

        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="grid grid-cols-12 gap-4 border-b px-4 py-3 last:border-0"
            >
              <div className="col-span-12">
                <Skeleton className="h-5 w-full" />
              </div>
            </div>
          ))
        ) : filteredEntries?.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No audit log entries found.
          </div>
        ) : (
          filteredEntries?.map((e) => {
            const severity = auditSeverity(e.action);
            return (
              <div
                key={e.id}
                className="grid grid-cols-12 gap-4 border-b px-4 py-3 text-sm last:border-0"
              >
                <div
                  className="col-span-3 font-mono text-xs truncate"
                  title={e.action}
                >
                  {e.action}
                </div>
                <div className="col-span-2 text-xs truncate">
                  {e.actorType}
                  {e.actorId ? (
                    <span className="text-muted-foreground">
                      {" "}
                      ({e.actorId})
                    </span>
                  ) : null}
                </div>
                <div className="col-span-2 text-muted-foreground text-xs truncate">
                  {e.resourceType}/{e.resourceId}
                </div>
                <div className="col-span-3 text-muted-foreground text-xs">
                  {formatDistanceToNow(new Date(e.createdAt), {
                    addSuffix: true,
                  })}
                </div>
                <div className="col-span-2">
                  <Badge
                    variant={
                      severity === "error"
                        ? "destructive"
                        : severity === "warning"
                          ? "warning"
                          : "info"
                    }
                  >
                    {severity}
                  </Badge>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
