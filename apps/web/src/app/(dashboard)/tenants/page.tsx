"use client";

import { useListTenants } from "@longox/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function TenantsPage() {
  const { data: tenants, isLoading } = useListTenants();

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
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))
        ) : tenants?.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-12 text-center">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
              <Users className="size-6" />
            </div>
            <div className="flex max-w-sm flex-col items-center gap-1">
              <div className="text-lg font-medium tracking-tight">
                No tenants yet
              </div>
              <p className="text-sm text-muted-foreground">
                Add tenants to manage multi-tenant access
              </p>
            </div>
            <Button className="mt-2">
              <Plus className="mr-1 h-4 w-4" /> Add your first tenant
            </Button>
          </div>
        ) : (
          tenants?.map((t) => (
            <Card key={t.id}>
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div>
                  <CardTitle className="text-sm">{t.name}</CardTitle>
                  <p className="text-xs text-muted-foreground">{t.slug}</p>
                </div>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="capitalize">
                    {t.plan}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Created {new Date(t.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <Badge variant={t.isActive ? "success" : "destructive"}>
                  {t.isActive ? "active" : "inactive"}
                </Badge>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
