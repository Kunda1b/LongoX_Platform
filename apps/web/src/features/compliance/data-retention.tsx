"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Save, Clock, HardDrive, Trash2, Eye, Shield } from "lucide-react";

interface RetentionSettings {
  auditLogRetentionDays: number;
  executionRetentionDays: number;
  notificationRetentionDays: number;
  autoDeleteAfterDays: number;
  gdprDataExportEnabled: boolean;
  anonymizeAfterDays: number;
}

export function DataRetention() {
  const [settings, setSettings] = useState<RetentionSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetch("/api/compliance/retention")
      .then((res) => res.json())
      .then(setSettings)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await fetch("/api/compliance/retention", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast({ title: "Retention policies updated" });
    } catch {
      toast({ title: "Failed to save retention policies", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const updateField = <K extends keyof RetentionSettings>(
    key: K,
    value: RetentionSettings[K],
  ) => {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        Failed to load retention settings.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Data Retention</h1>
            <p className="text-sm text-muted-foreground">
              Configure how long data is retained before automatic cleanup
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-1 h-4 w-4" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-muted-foreground" />
              Audit Log Retention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                value={settings.auditLogRetentionDays}
                onChange={(e) =>
                  updateField("auditLogRetentionDays", Number(e.target.value))
                }
                className="w-24"
                min={1}
                max={365}
              />
              <span className="text-sm text-muted-foreground">days</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Audit log entries older than this will be automatically purged
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-muted-foreground" />
              Execution History Retention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                value={settings.executionRetentionDays}
                onChange={(e) =>
                  updateField("executionRetentionDays", Number(e.target.value))
                }
                className="w-24"
                min={1}
                max={365}
              />
              <span className="text-sm text-muted-foreground">days</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Workflow execution records older than this will be cleaned up
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              Notification Retention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                value={settings.notificationRetentionDays}
                onChange={(e) =>
                  updateField("notificationRetentionDays", Number(e.target.value))
                }
                className="w-24"
                min={1}
                max={365}
              />
              <span className="text-sm text-muted-foreground">days</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Notifications older than this will be automatically archived
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              Data Anonymization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                value={settings.anonymizeAfterDays}
                onChange={(e) =>
                  updateField("anonymizeAfterDays", Number(e.target.value))
                }
                className="w-24"
                min={30}
                max={730}
              />
              <span className="text-sm text-muted-foreground">days</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Inactive user data is anonymized after this period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-muted-foreground" />
              Auto-Delete Inactive Tenants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                value={settings.autoDeleteAfterDays}
                onChange={(e) =>
                  updateField("autoDeleteAfterDays", Number(e.target.value))
                }
                className="w-24"
                min={30}
                max={730}
              />
              <span className="text-sm text-muted-foreground">days</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Tenant data is flagged for deletion after this period of inactivity
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              GDPR Data Export
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Enable GDPR data export</p>
                <p className="text-xs text-muted-foreground">
                  Allow users to export their personal data
                </p>
              </div>
              <Switch
                checked={settings.gdprDataExportEnabled}
                onCheckedChange={(checked) =>
                  updateField("gdprDataExportEnabled", checked)
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
