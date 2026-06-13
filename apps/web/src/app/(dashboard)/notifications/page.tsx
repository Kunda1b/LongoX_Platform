"use client";

import { useListNotifications } from "@longox/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, Settings, CheckCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function NotificationsPage() {
  const { data: notifications, isLoading } = useListNotifications();

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
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))
        ) : notifications?.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-12 text-center">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
              <Bell className="size-6" />
            </div>
            <div className="flex max-w-sm flex-col items-center gap-1">
              <div className="text-lg font-medium tracking-tight">
                No notifications
              </div>
              <p className="text-sm text-muted-foreground">
                You're all caught up!
              </p>
            </div>
          </div>
        ) : (
          notifications?.map((n) => (
            <Card
              key={n.id}
              className={n.status === "unread" ? "border-primary/30" : ""}
            >
              <CardContent className="flex items-start justify-between p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{n.title}</p>
                    {n.status === "unread" && (
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    )}
                  </div>
                  {n.body && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {n.body}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {n.type}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {n.channel}
                    </Badge>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(n.createdAt).toLocaleString()}
                </span>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
