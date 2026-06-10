"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Puzzle, Plus } from "lucide-react";
import Link from "next/link";

const apps = [
  {
    name: "Slack Bot",
    desc: "Slack integration for notifications",
    status: "published",
    installs: 12,
  },
  {
    name: "Analytics Dashboard",
    desc: "Embedded analytics for workflows",
    status: "draft",
    installs: 0,
  },
  {
    name: "Custom Portal",
    desc: "Customer-facing workflow portal",
    status: "published",
    installs: 5,
  },
];

export default function AppsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Apps</h1>
          <p className="text-sm text-muted-foreground">
            Manage your integrated applications
          </p>
        </div>
        <Button>
          <Plus className="mr-1 h-4 w-4" /> New App
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {apps.map((app) => (
          <Card
            key={app.name}
            className="cursor-pointer transition-colors hover:border-primary/50"
          >
            <CardHeader>
              <Puzzle className="h-5 w-5 text-primary" />
              <CardTitle className="mt-2 text-sm">{app.name}</CardTitle>
              <CardDescription className="text-xs">{app.desc}</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <Badge
                variant={app.status === "published" ? "success" : "secondary"}
              >
                {app.status}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {app.installs} installs
              </span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
