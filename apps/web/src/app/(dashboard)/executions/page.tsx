"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, RotateCcw } from "lucide-react";
import Link from "next/link";

const executions = [
  {
    id: "exec-001",
    workflow: "Order Processing",
    status: "completed",
    started: "2 min ago",
    duration: "12s",
  },
  {
    id: "exec-002",
    workflow: "Data Sync Pipeline",
    status: "running",
    started: "30s ago",
    duration: "...",
  },
  {
    id: "exec-003",
    workflow: "Email Notification",
    status: "failed",
    started: "1h ago",
    duration: "8s",
  },
  {
    id: "exec-004",
    workflow: "Slack Alerting",
    status: "queued",
    started: "just now",
    duration: "-",
  },
];

export default function ExecutionsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Executions</h1>
          <p className="text-sm text-muted-foreground">
            View and manage workflow executions
          </p>
        </div>
        <Button variant="outline" size="sm">
          <RotateCcw className="mr-1 h-4 w-4" /> Refresh
        </Button>
      </div>

      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search executions..." className="pl-9" />
      </div>

      <div className="rounded-lg border">
        <div className="grid grid-cols-12 gap-4 border-b bg-muted/50 px-4 py-3 text-xs font-medium text-muted-foreground">
          <div className="col-span-3">ID</div>
          <div className="col-span-3">Workflow</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Started</div>
          <div className="col-span-2">Duration</div>
        </div>
        {executions.map((ex) => (
          <Link key={ex.id} href={`/executions/${ex.id}`}>
            <div className="grid cursor-pointer grid-cols-12 gap-4 border-b px-4 py-3 text-sm transition-colors hover:bg-muted/30 last:border-0">
              <div className="col-span-3 font-mono text-xs">{ex.id}</div>
              <div className="col-span-3">{ex.workflow}</div>
              <div className="col-span-2">
                <Badge
                  variant={
                    ex.status === "completed"
                      ? "success"
                      : ex.status === "running"
                        ? "info"
                        : ex.status === "failed"
                          ? "destructive"
                          : "secondary"
                  }
                >
                  {ex.status}
                </Badge>
              </div>
              <div className="col-span-2 text-muted-foreground">
                {ex.started}
              </div>
              <div className="col-span-2 text-muted-foreground">
                {ex.duration}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
