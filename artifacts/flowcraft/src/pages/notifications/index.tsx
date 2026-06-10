import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListNotifications, useListNotificationTemplates, useCreateNotification, useMarkNotificationRead,
  getListNotificationsQueryKey,
} from "@autoflow/api-client-react";
import type { Notification } from "@autoflow/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Bell, CheckCircle2, AlertCircle, Info, AlertTriangle, Plus, Mail, Globe, Monitor, BellRing } from "lucide-react";

const TYPE_STYLES: Record<string, { color: string; icon: typeof Bell }> = {
  success: { color: "text-green-600", icon: CheckCircle2 },
  error: { color: "text-red-600", icon: AlertCircle },
  warning: { color: "text-amber-600", icon: AlertTriangle },
  info: { color: "text-blue-600", icon: Info },
};

const CHANNEL_ICONS: Record<string, typeof Bell> = { in_app: Monitor, email: Mail, webhook: Globe };

const STATUS_BADGES: Record<string, string> = {
  unread: "bg-blue-100 text-blue-700",
  read: "bg-muted text-muted-foreground",
  delivered: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
};

type NotifForm = { type: string; title: string; body: string; channel: string; recipientId: string };
const EMPTY: NotifForm = { type: "info", title: "", body: "", channel: "in_app", recipientId: "" };

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("notifications");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<NotifForm>(EMPTY);

  const { data: notifications = [], isLoading } = useListNotifications({});
  const { data: templates = [] } = useListNotificationTemplates();

  const createMutation = useCreateNotification({
    mutation: {
      onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() }); toast({ title: "Notification sent!" }); setCreateOpen(false); setForm(EMPTY); },
      onError: () => toast({ title: "Failed to send notification", variant: "destructive" }),
    },
  });

  const readMutation = useMarkNotificationRead({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() }),
    },
  });

  const unreadCount = notifications.filter((n) => n.status === "unread").length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            Notifications
            {unreadCount > 0 && <Badge className="bg-primary text-primary-foreground rounded-full px-2">{unreadCount}</Badge>}
          </h1>
          <p className="text-muted-foreground mt-2">In-app, email, and webhook notification management.</p>
        </div>
        <Button className="gap-2 shrink-0" onClick={() => { setForm(EMPTY); setCreateOpen(true); }}>
          <Plus className="h-4 w-4" />Send Notification
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[{ label: "Total", value: notifications.length, color: "text-foreground" }, { label: "Unread", value: unreadCount, color: "text-blue-600" }, { label: "In-App", value: notifications.filter((n) => n.channel === "in_app").length, color: "text-violet-600" }, { label: "Templates", value: templates.length, color: "text-muted-foreground" }].map(({ label, value, color }) => (
          <Card key={label}><CardContent className="pt-5 pb-4"><div className={`text-2xl font-bold ${color}`}>{value}</div><div className="text-sm text-muted-foreground">{label}</div></CardContent></Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="notifications" className="gap-2"><BellRing className="h-4 w-4" />Notifications</TabsTrigger>
          <TabsTrigger value="templates" className="gap-2"><Mail className="h-4 w-4" />Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="mt-6">
          {isLoading ? (
            <div className="text-muted-foreground text-sm">Loading…</div>
          ) : (
            <div className="space-y-2">
              {notifications.map((n) => {
                const { color, icon: Icon } = TYPE_STYLES[n.type] ?? TYPE_STYLES.info;
                const ChannelIcon = CHANNEL_ICONS[n.channel] ?? Monitor;
                return (
                  <div key={n.id} className={`flex items-start gap-3 p-4 rounded-lg border transition-colors ${n.status === "unread" ? "bg-blue-50/50 border-blue-100 dark:bg-blue-950/10 dark:border-blue-900/30" : "bg-card"}`}>
                    <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${color}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{n.title}</span>
                        <Badge className={`text-[10px] px-1.5 ${STATUS_BADGES[n.status] ?? ""}`}>{n.status}</Badge>
                        <ChannelIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      {n.body && <p className="text-sm text-muted-foreground mt-0.5">{n.body}</p>}
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        {n.recipientId && <span>→ {n.recipientId}</span>}
                        <span>{new Date(n.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                    {n.status === "unread" && (
                      <Button size="sm" variant="ghost" className="h-7 text-xs shrink-0" onClick={() => readMutation.mutate({ id: n.id })}>Mark read</Button>
                    )}
                  </div>
                );
              })}
              {notifications.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                  <Bell className="h-10 w-10 mx-auto mb-4 opacity-30" />
                  <p className="font-medium">No notifications yet</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((t) => {
              const ChannelIcon = CHANNEL_ICONS[t.channel] ?? Monitor;
              return (
                <Card key={t.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <ChannelIcon className="h-4 w-4 text-muted-foreground" />
                      <CardTitle className="text-sm">{t.name}</CardTitle>
                      <Badge variant="outline" className="text-[10px] ml-auto">{t.channel}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {t.subject && <p className="text-xs font-medium mb-1">{t.subject}</p>}
                    <p className="text-xs text-muted-foreground">{t.body}</p>
                    {Array.isArray(t.variables) && t.variables.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {(t.variables as string[]).map((v) => <Badge key={v} variant="secondary" className="text-[10px]">{"{{" + v + "}}"}</Badge>)}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Send Notification</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Channel</Label>
                <Select value={form.channel} onValueChange={(v) => setForm((f) => ({ ...f, channel: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_app">In-App</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="webhook">Webhook</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Title <span className="text-destructive">*</span></Label>
              <Input placeholder="Notification title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Body</Label>
              <Textarea placeholder="Optional message body…" rows={3} value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Recipient ID</Label>
              <Input placeholder="user@example.com or user-id" value={form.recipientId} onChange={(e) => setForm((f) => ({ ...f, recipientId: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={() => createMutation.mutate({ data: { type: form.type, title: form.title, body: form.body || undefined, channel: form.channel as "in_app" | "email" | "webhook", recipientId: form.recipientId || undefined } })} disabled={!form.title.trim() || createMutation.isPending}>
              {createMutation.isPending ? "Sending…" : "Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
