"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KeyRound, Plus, Eye, Trash2 } from "lucide-react";

const credentials = [
  { name: "Slack API Token", type: "api_key", status: "valid", lastUsed: "2 hours ago" },
  { name: "PostgreSQL Password", type: "password", status: "valid", lastUsed: "5 hours ago" },
  { name: "GitHub PAT", type: "token", status: "expired", lastUsed: "3 days ago" },
  { name: "AWS Access Key", type: "access_key", status: "valid", lastUsed: "1 day ago" },
];

export default function CredentialsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Credentials</h1>
          <p className="text-sm text-muted-foreground">Securely store and manage secrets</p>
        </div>
        <Button><Plus className="mr-1 h-4 w-4" /> Add Credential</Button>
      </div>

      <div className="rounded-lg border">
        <div className="grid grid-cols-12 gap-4 border-b bg-muted/50 px-4 py-3 text-xs font-medium text-muted-foreground">
          <div className="col-span-3">Name</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-3">Last Used</div>
          <div className="col-span-2">Actions</div>
        </div>
        {credentials.map((c) => (
          <div key={c.name} className="grid grid-cols-12 gap-4 border-b px-4 py-3 text-sm last:border-0">
            <div className="col-span-3 flex items-center gap-2 font-medium">
              <KeyRound className="h-4 w-4 text-muted-foreground" />
              {c.name}
            </div>
            <div className="col-span-2 text-muted-foreground capitalize">{c.type.replace("_", " ")}</div>
            <div className="col-span-2">
              <Badge variant={c.status === "valid" ? "success" : "destructive"}>{c.status}</Badge>
            </div>
            <div className="col-span-3 text-muted-foreground">{c.lastUsed}</div>
            <div className="col-span-2 flex gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
