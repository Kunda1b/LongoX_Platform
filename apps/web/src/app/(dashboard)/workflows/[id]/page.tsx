"use client";

import { use } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Pause, Edit, Trash2 } from "lucide-react";
import Link from "next/link";

export default function WorkflowDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Order Processing</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>ID: {id}</span>
              <Badge variant="success">active</Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/builder/${id}`}><Edit className="mr-1 h-4 w-4" /> Edit</Link>
          </Button>
          <Button variant="outline" size="sm"><Pause className="mr-1 h-4 w-4" /> Pause</Button>
          <Button size="sm"><Play className="mr-1 h-4 w-4" /> Run</Button>
          <Button variant="destructive" size="sm"><Trash2 className="h-4 w-4" /></Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Total Runs</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">142</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Success Rate</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">98.6%</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Last Run</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">2h ago</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Workflow Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground">Created:</span> Jan 15, 2026</div>
            <div><span className="text-muted-foreground">Updated:</span> 2 hours ago</div>
            <div><span className="text-muted-foreground">Connector:</span> Slack, Postgres</div>
            <div><span className="text-muted-foreground">Schedule:</span> Every 15 minutes</div>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground">
              This workflow processes incoming orders from the API endpoint, validates them against the database, and sends notifications via Slack.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
