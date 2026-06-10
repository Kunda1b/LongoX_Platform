"use client";

import { use } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RotateCcw, XCircle } from "lucide-react";

export default function ExecutionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const steps = [
    { name: "Validate input", status: "completed", duration: "2s" },
    { name: "Fetch order details", status: "completed", duration: "3s" },
    { name: "Process payment", status: "completed", duration: "5s" },
    { name: "Send notification", status: "failed", duration: "2s", error: "Slack API returned 429" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Execution Details</h1>
            <Badge variant="destructive">failed</Badge>
          </div>
          <p className="text-sm text-muted-foreground font-mono">{id}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm"><RotateCcw className="mr-1 h-4 w-4" /> Retry</Button>
          <Button variant="destructive" size="sm"><XCircle className="mr-1 h-4 w-4" /> Cancel</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Workflow</CardTitle></CardHeader>
          <CardContent className="text-sm font-medium">Order Processing</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Started</CardTitle></CardHeader>
          <CardContent className="text-sm">5 minutes ago</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Duration</CardTitle></CardHeader>
          <CardContent className="text-sm">12s</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Trigger</CardTitle></CardHeader>
          <CardContent className="text-sm">Schedule</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Execution Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {steps.map((step, i) => (
              <div key={i} className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${
                      step.status === "completed" ? "bg-emerald-500" : "bg-destructive"
                    }`}>
                      {step.status === "completed" ? "✓" : "✗"}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{step.name}</p>
                      {step.error && <p className="text-xs text-destructive">{step.error}</p>}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{step.duration}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
