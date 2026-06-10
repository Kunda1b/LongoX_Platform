import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  Info,
  AlertTriangle,
  X,
  Monitor,
  Mail,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useNotificationStore } from "@/stores/notification-store";
import { useAuth } from "@/lib/auth-context";

type Notification = {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  body?: string;
  channel: string;
  status: "unread" | "read" | "delivered" | "failed";
  createdAt: string;
};

const TYPE_STYLES: Record<string, { color: string; icon: typeof Bell }> = {
  success: { color: "text-green-500", icon: CheckCircle2 },
  error: { color: "text-red-500", icon: AlertCircle },
  warning: { color: "text-amber-500", icon: AlertTriangle },
  info: { color: "text-blue-500", icon: Info },
};

const CHANNEL_ICONS: Record<string, typeof Monitor> = {
  in_app: Monitor,
  email: Mail,
  webhook: Globe,
};

export function NotificationCenter() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const { notifications, unreadCount, panelOpen, setNotifications, markRead, setPanelOpen } =
    useNotificationStore();

  const { data } = useQuery<Notification[]>({
    queryKey: ["notifications", "recent"],
    queryFn: () =>
      fetch("/api/notifications?limit=20").then((r) => r.json()),
    enabled: !!token,
  });

  useEffect(() => {
    if (data) {
      setNotifications(data);
    }
  }, [data, setNotifications]);

  const readMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/notifications/${id}/read`, { method: "POST" }),
    onSuccess: (_data, id) => {
      markRead(id);
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  return (
    <Popover open={panelOpen} onOpenChange={setPanelOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[9px] flex items-center justify-center rounded-full bg-destructive text-destructive-foreground"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end" sideOffset={8}>
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Notifications</span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1.5">
                {unreadCount} new
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setPanelOpen(false)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>

        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-xs font-medium">No notifications</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.slice(0, 20).map((n) => {
                const { color, icon: Icon } = TYPE_STYLES[n.type] ?? TYPE_STYLES.info;
                const ChannelIcon = CHANNEL_ICONS[n.channel] ?? Monitor;
                return (
                  <div
                    key={n.id}
                    className={cn(
                      "flex items-start gap-3 px-4 py-3 transition-colors",
                      n.status === "unread"
                        ? "bg-blue-50/50 dark:bg-blue-950/10"
                        : "hover:bg-muted/30"
                    )}
                  >
                    <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", color)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium truncate">
                          {n.title}
                        </span>
                        <ChannelIcon className="h-3 w-3 shrink-0 text-muted-foreground" />
                      </div>
                      {n.body && (
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                          {n.body}
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground/60 mt-1">
                        {new Date(n.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {n.status === "unread" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-[10px] px-2 shrink-0"
                        onClick={() => readMutation.mutate(n.id)}
                      >
                        Mark read
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <div className="border-t px-4 py-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-muted-foreground"
            onClick={() => {
              setPanelOpen(false);
              window.location.href = "/notifications";
            }}
          >
            View all notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
