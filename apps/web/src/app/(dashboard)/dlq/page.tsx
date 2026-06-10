"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HardDrive, RotateCcw, Trash2 } from "lucide-react";

const messages = [
  {
    id: "msg-001",
    workflow: "Order Processing",
    error: "Slack API timeout",
    date: "2 min ago",
    retries: 3,
  },
  {
    id: "msg-002",
    workflow: "Data Sync",
    error: "Postgres connection refused",
    date: "1 hour ago",
    retries: 5,
  },
  {
    id: "msg-003",
    workflow: "Email Notification",
    error: "SendGrid quota exceeded",
    date: "3 hours ago",
    retries: 2,
  },
];

export default function DLQPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HardDrive className="h-5 w-5" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Dead Letter Queue
            </h1>
            <p className="text-sm text-muted-foreground">
              Failed messages that could not be processed
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <RotateCcw className="mr-1 h-4 w-4" /> Retry All
          </Button>
          <Button variant="destructive" size="sm">
            <Trash2 className="mr-1 h-4 w-4" /> Clear All
          </Button>
        </div>
      </div>

      <div className="rounded-lg border">
        <div className="grid grid-cols-12 gap-4 border-b bg-muted/50 px-4 py-3 text-xs font-medium text-muted-foreground">
          <div className="col-span-3">ID</div>
          <div className="col-span-2">Workflow</div>
          <div className="col-span-3">Error</div>
          <div className="col-span-2">Date</div>
          <div className="col-span-2">Actions</div>
        </div>
        {messages.map((m) => (
          <div
            key={m.id}
            className="grid grid-cols-12 gap-4 border-b px-4 py-3 text-sm last:border-0"
          >
            <div className="col-span-3 font-mono text-xs">{m.id}</div>
            <div className="col-span-2">{m.workflow}</div>
            <div className="col-span-3 text-destructive text-xs">{m.error}</div>
            <div className="col-span-2 text-muted-foreground text-xs">
              {m.date}
            </div>
            <div className="col-span-2 flex gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
