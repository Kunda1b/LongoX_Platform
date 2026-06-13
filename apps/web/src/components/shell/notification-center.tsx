"use client";

import { useState } from "react";
import { useListNotifications } from "@longox/api-client-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Bell, CheckCheck, Settings, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

export function NotificationCenter() {
  const { data: notifications } = useListNotifications();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const unreadCount = notifications?.filter((n) => n.status === "unread").length ?? 0;
  const recent = notifications?.slice(0, 5) ?? [];

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[min(calc(100vw-2rem),20rem)]">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <CheckCheck className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => router.push("/notifications")}>
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {recent.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No notifications
          </div>
        ) : (
          recent.map((n) => (
            <DropdownMenuItem
              key={n.id}
              className="flex flex-col items-start gap-1 cursor-pointer py-3"
              onSelect={() => router.push("/notifications")}
            >
              <div className="flex items-center gap-2 w-full">
                <span className="text-sm font-medium truncate flex-1">{n.title}</span>
                {n.status === "unread" && (
                  <div className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                )}
              </div>
              {n.body && (
                <p className="text-xs text-muted-foreground line-clamp-2">{n.body}</p>
              )}
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="outline" className="text-[10px] px-1 py-0">{n.type}</Badge>
                <span className="text-[10px] text-muted-foreground">
                  {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                </span>
              </div>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="flex items-center gap-2 justify-center text-sm cursor-pointer"
          onSelect={() => router.push("/notifications")}
        >
          <Settings className="h-4 w-4" />
          View all notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
