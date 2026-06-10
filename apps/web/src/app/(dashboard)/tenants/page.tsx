"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Plus } from "lucide-react";

const tenants = [
  { name: "Acme Corp", plan: "enterprise", users: 12, status: "active" },
  { name: "Globex Inc", plan: "pro", users: 5, status: "active" },
  { name: "Initech", plan: "free", users: 2, status: "suspended" },
];

export default function TenantsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tenants</h1>
          <p className="text-sm text-muted-foreground">
            Multi-tenant administration
          </p>
        </div>
        <Button>
          <Plus className="mr-1 h-4 w-4" /> Add Tenant
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tenants.map((t) => (
          <Card key={t.name}>
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div>
                <CardTitle className="text-sm">{t.name}</CardTitle>
                <p className="text-xs text-muted-foreground capitalize">
                  {t.plan} plan
                </p>
              </div>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {t.users} users
              </span>
              <Badge
                variant={t.status === "active" ? "success" : "destructive"}
              >
                {t.status}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
