"use client";

import { useListRoles, useListPermissions } from "@longox/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, Plus, UserPlus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function RBACPage() {
  const { data: roles, isLoading: rolesLoading } = useListRoles();
  const { data: permissions, isLoading: permissionsLoading } = useListPermissions();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">RBAC</h1>
          <p className="text-sm text-muted-foreground">
            Role-based access control
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <UserPlus className="mr-1 h-4 w-4" /> Invite User
          </Button>
          <Button>
            <Plus className="mr-1 h-4 w-4" /> Add Role
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {rolesLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))
        ) : roles?.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-12 text-center">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
              <Shield className="size-6" />
            </div>
            <div className="flex max-w-sm flex-col items-center gap-1">
              <div className="text-lg font-medium tracking-tight">
                No roles defined
              </div>
              <p className="text-sm text-muted-foreground">
                Create roles to manage access control
              </p>
            </div>
            <Button className="mt-2">
              <Plus className="mr-1 h-4 w-4" /> Create first role
            </Button>
          </div>
        ) : (
          roles?.map((role) => (
            <Card key={role.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm">{role.name}</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Badge variant="secondary">
                  {role.permissionCount || 0} permissions
                </Badge>
                {role.description && (
                  <p className="text-xs text-muted-foreground">
                    {role.description}
                  </p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {!rolesLoading && roles && roles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Available Permissions ({permissions?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {permissionsLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                {permissions?.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-lg border p-2"
                  >
                    <div>
                      <span className="text-sm font-medium">
                        {p.resource}.{p.action}
                      </span>
                      {p.description && (
                        <p className="text-xs text-muted-foreground">
                          {p.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
