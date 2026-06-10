"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Workflow, Plus, GripVertical, Save, Play } from "lucide-react";

export default function BuilderPage() {
  return (
    <div className="flex h-[calc(100vh-3rem)] flex-col">
      <div className="flex items-center justify-between border-b pb-4 mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold tracking-tight">Workflow Builder</h1>
          <span className="text-xs text-muted-foreground">Untitled Workflow</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm"><Save className="mr-1 h-4 w-4" /> Save</Button>
          <Button size="sm"><Play className="mr-1 h-4 w-4" /> Run</Button>
        </div>
      </div>

      <div className="flex flex-1 gap-4">
        <Card className="w-64 shrink-0">
          <CardHeader>
            <CardTitle className="text-sm">Nodes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {["Trigger", "Action", "Condition", "Transform", "Delay", "Notification"].map((node) => (
              <div key={node} className="flex cursor-grab items-center gap-2 rounded-lg border p-2 text-sm transition-colors hover:bg-muted/50">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                {node}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="flex-1">
          <CardContent className="flex h-full items-center justify-center p-12">
            <div className="text-center">
              <Workflow className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-sm text-muted-foreground">
                Drag nodes from the sidebar to start building your workflow
              </p>
              <Button variant="outline" className="mt-4"><Plus className="mr-1 h-4 w-4" /> Add Trigger</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
