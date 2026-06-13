"use client";

import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Save, KeyRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function SettingsForm() {
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSave = () => {
    toast({
      title: "Settings saved",
      description: "Your profile has been updated successfully.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-5 w-5" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your account settings
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" defaultValue={user?.name || ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue={user?.email || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input id="role" defaultValue={user?.role || ""} disabled />
            </div>
          </div>
          <Button onClick={handleSave}>
            <Save className="mr-1 h-4 w-4" /> Save Changes
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <KeyRound className="h-4 w-4" />
            API Keys
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {["Production", "Development"].map((env) => (
            <div
              key={env}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div>
                <p className="text-sm font-medium">{env}</p>
                <p className="text-xs text-muted-foreground font-mono">
                  fc_{env.toLowerCase()}_****a1b2
                </p>
              </div>
              <Button variant="outline" size="sm">
                Regenerate
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
