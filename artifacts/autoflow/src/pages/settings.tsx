import { Settings2, User, Bell, Lock, Palette, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

const sections = [
  { label: "General", icon: Settings2, active: true },
  { label: "Profile", icon: User, active: false },
  { label: "Notifications", icon: Bell, active: false },
  { label: "Security", icon: Lock, active: false },
  { label: "Appearance", icon: Palette, active: false },
  { label: "API & Webhooks", icon: Globe, active: false },
];

export default function SettingsPage() {
  return (
    <div className="flex h-full">
      <aside className="w-48 shrink-0 border-r bg-muted/30 py-4">
        <p className="px-4 text-[0.7rem] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Settings</p>
        {sections.map(({ label, icon: Icon, active }) => (
          <button
            key={label}
            className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm transition-colors ${
              active ? "bg-primary/10 text-primary font-medium" : "text-foreground/70 hover:bg-accent hover:text-foreground"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </aside>

      <div className="flex-1 p-8 overflow-y-auto max-w-2xl">
        <div className="mb-6">
          <h1 className="text-xl font-semibold">General Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your workspace preferences</p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Workspace</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="ws-name">Workspace Name</Label>
                <Input id="ws-name" defaultValue="My Organization" className="max-w-sm" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ws-slug">Workspace Slug</Label>
                <div className="flex items-center gap-2 max-w-sm">
                  <span className="text-sm text-muted-foreground">autoflow.app/</span>
                  <Input id="ws-slug" defaultValue="my-org" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="timezone">Timezone</Label>
                <Input id="timezone" defaultValue="UTC" className="max-w-sm" />
              </div>
              <Button size="sm">Save Changes</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Execution Defaults</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Retry failed nodes automatically</p>
                  <p className="text-xs text-muted-foreground">Retry up to 3 times with exponential backoff</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Save execution steps</p>
                  <p className="text-xs text-muted-foreground">Store per-node input/output for debugging</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Execution timeout</p>
                  <p className="text-xs text-muted-foreground">Kill executions exceeding this duration</p>
                </div>
                <div className="flex items-center gap-2">
                  <Input defaultValue="300" className="w-20 text-right" />
                  <span className="text-sm text-muted-foreground">seconds</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Free Plan</span>
                    <Badge variant="secondary" className="text-xs">Active</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">10 active workflows, 1,000 executions/month</p>
                </div>
                <Button size="sm" variant="outline">Upgrade</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
