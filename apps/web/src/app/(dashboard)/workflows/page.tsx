"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";

const workflows = [
  { id: "wf-1", name: "Order Processing", status: "active", updated: "2 hours ago", runs: 142 },
  { id: "wf-2", name: "Data Sync Pipeline", status: "active", updated: "5 hours ago", runs: 89 },
  { id: "wf-3", name: "Email Notification", status: "paused", updated: "1 day ago", runs: 34 },
  { id: "wf-4", name: "Slack Alerting", status: "draft", updated: "3 days ago", runs: 0 },
];

export default function WorkflowsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Workflows</h1>
          <p className="text-sm text-muted-foreground">Manage your automation workflows</p>
        </div>
        <Button asChild>
          <Link href="/workflows/new">
            <Plus className="mr-1 h-4 w-4" /> New Workflow
          </Link>
        </Button>
      </div>

      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search workflows..." className="pl-9" />
      </div>

      <div className="rounded-lg border">
        <div className="grid grid-cols-12 gap-4 border-b bg-muted/50 px-4 py-3 text-xs font-medium text-muted-foreground">
          <div className="col-span-4">Name</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Runs</div>
          <div className="col-span-3">Updated</div>
          <div className="col-span-1" />
        </div>
        {workflows.map((wf) => (
          <Link key={wf.id} href={`/workflows/${wf.id}`}>
            <div className="grid cursor-pointer grid-cols-12 gap-4 border-b px-4 py-3 text-sm transition-colors hover:bg-muted/30 last:border-0">
              <div className="col-span-4 font-medium">{wf.name}</div>
              <div className="col-span-2">
                <Badge
                  variant={wf.status === "active" ? "success" : wf.status === "paused" ? "warning" : "secondary"}
                >
                  {wf.status}
                </Badge>
              </div>
              <div className="col-span-2 text-muted-foreground">{wf.runs}</div>
              <div className="col-span-3 text-muted-foreground">{wf.updated}</div>
              <div className="col-span-1 text-right">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <span className="sr-only">Menu</span>
                  ⋯
                </Button>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
