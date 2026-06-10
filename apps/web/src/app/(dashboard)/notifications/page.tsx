"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, Settings, CheckCheck } from "lucide-react";

const notifications = [
  {
    title: "Workflow failed",
    message: "Order Processing failed at step 'Send notification'",
    time: "5 min ago",
    read: false,
  },
  {
    title: "Credential expiring",
    message: "GitHub PAT will expire in 7 days",
    time: "1 hour ago",
    read: false,
  },
  {
    title: "New version available",
    message: "LongoX v2.4.0 is ready to deploy",
    time: "1 day ago",
    read: true,
  },
];

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
            <p className="text-sm text-muted-foreground">
              System alerts and updates
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm">
            <CheckCheck className="mr-1 h-4 w-4" /> Mark all read
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {notifications.map((n, i) => (
          <Card key={i} className={n.read ? "" : "border-primary/30"}>
            <CardContent className="flex items-start justify-between p-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{n.title}</p>
                  {!n.read && (
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {n.message}
                </p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {n.time}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
