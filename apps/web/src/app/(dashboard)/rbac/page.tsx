"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, Plus, UserPlus } from "lucide-react";

const roles = [
  { name: "Admin", users: 3, permissions: "Full access" },
  { name: "Editor", users: 8, permissions: "Create and edit workflows" },
  { name: "Viewer", users: 12, permissions: "Read-only access" },
];

export default function RBACPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">RBAC</h1>
          <p className="text-sm text-muted-foreground">Role-based access control</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><UserPlus className="mr-1 h-4 w-4" /> Invite User</Button>
          <Button><Plus className="mr-1 h-4 w-4" /> Add Role</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {roles.map((r) => (
          <Card key={r.name}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm">{r.name}</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Badge variant="secondary">{r.users} users</Badge>
              <p className="text-xs text-muted-foreground">{r.permissions}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
