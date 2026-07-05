"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  User,
  KeyRound,
  Bell,
  Loader2,
  Save,
  Camera,
  Trash2,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "/api";

type NotificationPrefs = {
  emailWorkflowStatus: boolean;
  emailExecutionFailures: boolean;
  emailWeeklyDigest: boolean;
  inAppWorkflowStatus: boolean;
  inAppExecutionFailures: boolean;
  inAppConnectorAlerts: boolean;
};

const DEFAULT_PREFS: NotificationPrefs = {
  emailWorkflowStatus: true,
  emailExecutionFailures: true,
  emailWeeklyDigest: false,
  inAppWorkflowStatus: true,
  inAppExecutionFailures: true,
  inAppConnectorAlerts: true,
};

function authHeaders(token: string | null): Record<string, string> {
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ─── Avatar Upload ─────────────────────────────────────────────────────────────

function AvatarUpload({
  avatarUrl,
  name,
  token,
  onUpdate,
}: {
  avatarUrl: string | null;
  name: string;
  token: string | null;
  onUpdate: (url: string | null) => void;
}) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(avatarUrl);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    setPreview(avatarUrl);
  }, [avatarUrl]);

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please choose an image under 2 MB.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;

      // Resize to max 256×256 via canvas before uploading
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        const size = Math.min(img.width, img.height, 256);
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d")!;
        const sx = (img.width - size) / 2;
        const sy = (img.height - size) / 2;
        ctx.drawImage(img, sx, sy, size, size, 0, 0, size, size);
        const resized = canvas.toDataURL("image/jpeg", 0.85);

        setPreview(resized);
        setUploading(true);
        try {
          const res = await fetch(`${API}/auth/avatar`, {
            method: "POST",
            headers: authHeaders(token),
            body: JSON.stringify({ avatar: resized }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error ?? "Upload failed");
          onUpdate(data.avatarUrl);
          toast({
            title: "Avatar updated",
            description: "Your profile photo has been saved.",
          });
        } catch (err) {
          setPreview(avatarUrl);
          toast({
            title: "Upload failed",
            description:
              err instanceof Error ? err.message : "Something went wrong",
            variant: "destructive",
          });
        } finally {
          setUploading(false);
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    // Reset so the same file can be re-selected
    e.target.value = "";
  };

  const handleRemove = async () => {
    setRemoving(true);
    try {
      const res = await fetch(`${API}/auth/avatar`, {
        method: "DELETE",
        headers: authHeaders(token),
      });
      if (!res.ok) throw new Error("Failed to remove avatar");
      setPreview(null);
      onUpdate(null);
      toast({
        title: "Avatar removed",
        description: "Your profile photo has been removed.",
      });
    } catch (err) {
      toast({
        title: "Remove failed",
        description:
          err instanceof Error ? err.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <div className="h-20 w-20 rounded-full overflow-hidden border-2 border-border bg-muted flex items-center justify-center text-xl font-semibold text-muted-foreground select-none">
          {preview ? (
            <img
              src={preview}
              alt="Avatar"
              className="h-full w-full object-cover"
            />
          ) : (
            <span>{initials || <User className="h-8 w-8" />}</span>
          )}
        </div>
        {(uploading || removing) && (
          <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-white" />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">Profile photo</p>
        <p className="text-xs text-muted-foreground">
          JPG, PNG, GIF up to 2 MB. Cropped to square.
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || removing}
          >
            <Camera className="mr-1.5 h-3.5 w-3.5" />
            {preview ? "Change photo" : "Upload photo"}
          </Button>
          {preview && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={uploading || removing}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Remove
            </Button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}

// ─── Profile Tab ──────────────────────────────────────────────────────────────

function ProfileTab() {
  const { user, token, updateUser } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState(user?.name ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(user?.name ?? "");
  }, [user?.name]);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === user?.name) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/auth/profile`, {
        method: "PATCH",
        headers: authHeaders(token),
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update profile");
      updateUser({ name: data.user.name });
      toast({
        title: "Profile updated",
        description: "Your name has been saved.",
      });
    } catch (err) {
      toast({
        title: "Update failed",
        description:
          err instanceof Error ? err.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <User className="h-4 w-4" />
          Profile Information
        </CardTitle>
        <CardDescription>
          Update your display name and profile photo. Your email address and
          role cannot be changed here.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <AvatarUpload
          avatarUrl={user?.avatarUrl ?? null}
          name={user?.name ?? ""}
          token={token}
          onUpdate={(url) => updateUser({ avatarUrl: url })}
        />
        <Separator />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="profile-name">Full name</Label>
            <Input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-email">Email address</Label>
            <Input
              id="profile-email"
              type="email"
              value={user?.email ?? ""}
              disabled
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-role">Role</Label>
            <Input id="profile-role" value={user?.role ?? ""} disabled />
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving || !name.trim() || name.trim() === user?.name}
        >
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save changes
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Password Tab ─────────────────────────────────────────────────────────────

function PasswordTab() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [saving, setSaving] = useState(false);

  const set =
    (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const passwordMismatch =
    form.confirmPassword.length > 0 &&
    form.newPassword !== form.confirmPassword;

  const canSave =
    form.currentPassword.trim().length > 0 &&
    form.newPassword.trim().length >= 8 &&
    form.newPassword === form.confirmPassword;

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/auth/password`, {
        method: "PATCH",
        headers: authHeaders(token),
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update password");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast({
        title: "Password changed",
        description: "Your password has been updated.",
      });
    } catch (err) {
      toast({
        title: "Update failed",
        description:
          err instanceof Error ? err.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <KeyRound className="h-4 w-4" />
          Change Password
        </CardTitle>
        <CardDescription>
          Choose a strong password of at least 8 characters.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 max-w-sm">
          <div className="space-y-2">
            <Label htmlFor="current-password">Current password</Label>
            <Input
              id="current-password"
              type="password"
              value={form.currentPassword}
              onChange={set("currentPassword")}
              autoComplete="current-password"
            />
          </div>
          <Separator />
          <div className="space-y-2">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type="password"
              value={form.newPassword}
              onChange={set("newPassword")}
              autoComplete="new-password"
            />
            {form.newPassword.length > 0 && form.newPassword.length < 8 && (
              <p className="text-xs text-muted-foreground">
                At least 8 characters required
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm new password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={form.confirmPassword}
              onChange={set("confirmPassword")}
              autoComplete="new-password"
            />
            {passwordMismatch && (
              <p className="text-xs text-destructive">
                Passwords don&apos;t match
              </p>
            )}
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving || !canSave}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <KeyRound className="mr-2 h-4 w-4" />
          )}
          Update password
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Notifications Tab ────────────────────────────────────────────────────────

type PrefRowProps = {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
};

function PrefRow({
  id,
  label,
  description,
  checked,
  onCheckedChange,
}: PrefRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="space-y-0.5 min-w-0">
        <Label htmlFor={id} className="text-sm font-medium cursor-pointer">
          {label}
        </Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

function NotificationsTab() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/auth/notification-preferences`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data: NotificationPrefs) =>
        setPrefs({ ...DEFAULT_PREFS, ...data }),
      )
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const toggle = (key: keyof NotificationPrefs) => (val: boolean) =>
    setPrefs((prev) => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/auth/notification-preferences`, {
        method: "PATCH",
        headers: authHeaders(token),
        body: JSON.stringify(prefs),
      });
      if (!res.ok) throw new Error("Failed to save preferences");
      toast({
        title: "Preferences saved",
        description: "Your notification settings have been updated.",
      });
    } catch {
      toast({
        title: "Save failed",
        description: "Could not save preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Bell className="h-4 w-4" />
          Notification Preferences
        </CardTitle>
        <CardDescription>
          Choose how and when you want to be notified about activity in your
          workspace.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <p className="text-sm font-semibold">Email notifications</p>
          <p className="text-xs text-muted-foreground mt-0.5 mb-1">
            Sent to your registered email address.
          </p>
          <div className="divide-y">
            <PrefRow
              id="email-workflow-status"
              label="Workflow status updates"
              description="When a workflow is activated, paused, or deleted"
              checked={prefs.emailWorkflowStatus}
              onCheckedChange={toggle("emailWorkflowStatus")}
            />
            <PrefRow
              id="email-execution-failures"
              label="Execution failures"
              description="When a workflow run fails or encounters an error"
              checked={prefs.emailExecutionFailures}
              onCheckedChange={toggle("emailExecutionFailures")}
            />
            <PrefRow
              id="email-weekly-digest"
              label="Weekly digest"
              description="A weekly summary of your automation activity"
              checked={prefs.emailWeeklyDigest}
              onCheckedChange={toggle("emailWeeklyDigest")}
            />
          </div>
        </div>

        <Separator />

        <div>
          <p className="text-sm font-semibold">In-app notifications</p>
          <p className="text-xs text-muted-foreground mt-0.5 mb-1">
            Shown inside the LongoX dashboard.
          </p>
          <div className="divide-y">
            <PrefRow
              id="inapp-workflow-status"
              label="Workflow status updates"
              description="When a workflow changes state"
              checked={prefs.inAppWorkflowStatus}
              onCheckedChange={toggle("inAppWorkflowStatus")}
            />
            <PrefRow
              id="inapp-execution-failures"
              label="Execution failures"
              description="When a workflow run fails"
              checked={prefs.inAppExecutionFailures}
              onCheckedChange={toggle("inAppExecutionFailures")}
            />
            <PrefRow
              id="inapp-connector-alerts"
              label="Connector alerts"
              description="When a connector needs attention or re-authentication"
              checked={prefs.inAppConnectorAlerts}
              onCheckedChange={toggle("inAppConnectorAlerts")}
            />
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save preferences
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function SettingsForm() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account details, password, and notification preferences.
        </p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile" className="gap-1.5">
            <User className="h-3.5 w-3.5" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="password" className="gap-1.5">
            <KeyRound className="h-3.5 w-3.5" />
            Password
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5">
            <Bell className="h-3.5 w-3.5" />
            Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4">
          <ProfileTab />
        </TabsContent>
        <TabsContent value="password" className="mt-4">
          <PasswordTab />
        </TabsContent>
        <TabsContent value="notifications" className="mt-4">
          <NotificationsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
