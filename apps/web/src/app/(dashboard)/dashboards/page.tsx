"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Palette, Plus } from "lucide-react";
import Link from "next/link";

const dashboards = [
  { name: "Operations Overview", widgets: 6, lastModified: "2 hours ago", shared: true },
  { name: "Executive Summary", widgets: 4, lastModified: "1 day ago", shared: true },
  { name: "Error Monitoring", widgets: 3, lastModified: "3 days ago", shared: false },
];

export default function DashboardsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboards</h1>
          <p className="text-sm text-muted-foreground">Visualize workflow data and metrics</p>
        </div>
        <Button asChild>
          <Link href="/dashboards/new"><Plus className="mr-1 h-4 w-4" /> New Dashboard</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {dashboards.map((d) => (
          <Card key={d.name} className="cursor-pointer transition-colors hover:border-primary/50">
            <CardHeader>
              <Palette className="h-5 w-5 text-primary" />
              <CardTitle className="mt-2 text-sm">{d.name}</CardTitle>
              <CardDescription className="text-xs">{d.widgets} widgets</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{d.lastModified}</span>
              <Badge variant={d.shared ? "info" : "secondary"}>{d.shared ? "Shared" : "Private"}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
