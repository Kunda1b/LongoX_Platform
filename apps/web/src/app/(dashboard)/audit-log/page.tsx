"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ScrollText, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const entries = [
  { action: "workflow.created", user: "alice@acme.com", timestamp: "2 min ago", severity: "info" },
  { action: "credential.deleted", user: "bob@acme.com", timestamp: "15 min ago", severity: "warning" },
  { action: "user.invited", user: "admin@acme.com", timestamp: "1 hour ago", severity: "info" },
  { action: "workflow.execution_failed", user: "system", timestamp: "2 hours ago", severity: "error" },
];

export default function AuditLogPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ScrollText className="h-5 w-5" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Audit Log</h1>
            <p className="text-sm text-muted-foreground">Track all system events and changes</p>
          </div>
        </div>
        <Button variant="outline" size="sm"><Download className="mr-1 h-4 w-4" /> Export</Button>
      </div>

      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search audit log..." className="pl-9" />
      </div>

      <div className="rounded-lg border">
        <div className="grid grid-cols-12 gap-4 border-b bg-muted/50 px-4 py-3 text-xs font-medium text-muted-foreground">
          <div className="col-span-4">Action</div>
          <div className="col-span-3">User</div>
          <div className="col-span-3">Timestamp</div>
          <div className="col-span-2">Severity</div>
        </div>
        {entries.map((e, i) => (
          <div key={i} className="grid grid-cols-12 gap-4 border-b px-4 py-3 text-sm last:border-0">
            <div className="col-span-4 font-mono text-xs">{e.action}</div>
            <div className="col-span-3 text-xs">{e.user}</div>
            <div className="col-span-3 text-muted-foreground text-xs">{e.timestamp}</div>
            <div className="col-span-2">
              <Badge variant={e.severity === "error" ? "destructive" : e.severity === "warning" ? "warning" : "info"}>
                {e.severity}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
