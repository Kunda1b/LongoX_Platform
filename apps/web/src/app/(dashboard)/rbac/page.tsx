"use client";

import { useState } from "react";
import {
  useListRoles,
  useListMembers,
  assignMemberRole,
} from "@longox/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Crown, Shield, Hammer, Eye, Check, X, Users } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

type RoleName = "Owner" | "Admin" | "Builder" | "Viewer";

interface RoleMeta {
  icon: React.ElementType;
  color: string;
  badge: string;
  can: string[];
  cannot: string[];
}

const ROLE_META: Record<RoleName, RoleMeta> = {
  Owner: {
    icon: Crown,
    color: "text-amber-600",
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    can: [
      "Delete workspace",
      "Transfer ownership",
      "Manage billing & subscriptions",
      "Manage all users & roles",
      "Access everything",
    ],
    cannot: [],
  },
  Admin: {
    icon: Shield,
    color: "text-blue-600",
    badge: "bg-blue-100 text-blue-700 border-blue-200",
    can: [
      "Create & publish workflows",
      "Manage connectors",
      "Manage users & roles",
      "Manage dashboards",
    ],
    cannot: [
      "Delete workspace",
      "Transfer ownership",
      "Manage subscriptions",
    ],
  },
  Builder: {
    icon: Hammer,
    color: "text-violet-600",
    badge: "bg-violet-100 text-violet-700 border-violet-200",
    can: [
      "Create & edit workflows",
      "Create dashboards",
      "Use AI agents & tools",
    ],
    cannot: ["Manage users", "Change billing", "Change security settings"],
  },
  Viewer: {
    icon: Eye,
    color: "text-slate-600",
    badge: "bg-slate-100 text-slate-700 border-slate-200",
    can: ["View dashboards", "View workflow runs", "View reports"],
    cannot: ["Edit anything"],
  },
};

const ROLE_ORDER: RoleName[] = ["Owner", "Admin", "Builder", "Viewer"];

interface ApiRole {
  id: number;
  name: string;
  description: string | null;
  permissionCount: number;
}

function RoleCard({ role }: { role: ApiRole }) {
  const meta = ROLE_META[role.name as RoleName];
  if (!meta) return null;
  const Icon = meta.icon;

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-lg bg-muted ${meta.color}`}
            >
              <Icon className="h-4 w-4" />
            </div>
            <CardTitle className="text-base">{role.name}</CardTitle>
          </div>
          <Badge
            variant="outline"
            className={`shrink-0 text-xs ${meta.badge}`}
          >
            {role.permissionCount} permissions
          </Badge>
        </div>
        {role.description && (
          <p className="text-xs text-muted-foreground leading-relaxed">
            {role.description}
          </p>
        )}
      </CardHeader>
      <CardContent className="flex-1 space-y-1.5 pt-0">
        {meta.can.map((item) => (
          <div key={item} className="flex items-start gap-1.5 text-xs">
            <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" />
            <span>{item}</span>
          </div>
        ))}
        {meta.cannot.map((item) => (
          <div
            key={item}
            className="flex items-start gap-1.5 text-xs text-muted-foreground"
          >
            <X className="mt-0.5 h-3 w-3 shrink-0 text-rose-400" />
            <span>{item}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

interface ApiMember {
  userId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  isActive: boolean;
  joinedAt: string;
  lastLoginAt: string | null;
  role: { id: number; name: string; description: string | null } | null;
}

function MemberRow({
  member,
  roles,
  onRoleChange,
}: {
  member: ApiMember;
  roles: ApiRole[];
  onRoleChange: (userId: string, roleId: number) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const meta = member.role ? ROLE_META[member.role.name as RoleName] : null;

  const initials = member.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleRoleChange = async (roleId: string) => {
    setSaving(true);
    try {
      await onRoleChange(member.userId, Number(roleId));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
      <Avatar className="h-9 w-9 shrink-0">
        {member.avatarUrl && (
          <AvatarImage src={member.avatarUrl} alt={member.name} />
        )}
        <AvatarFallback className="text-xs font-semibold">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{member.name}</span>
          {!member.isActive && (
            <Badge variant="outline" className="text-[10px]">
              Inactive
            </Badge>
          )}
        </div>
        <p className="truncate text-xs text-muted-foreground">{member.email}</p>
      </div>

      <div className="shrink-0">
        <Select
          defaultValue={member.role ? String(member.role.id) : undefined}
          onValueChange={handleRoleChange}
          disabled={saving}
        >
          <SelectTrigger className="h-8 w-[120px] text-xs">
            <SelectValue placeholder="Assign role" />
          </SelectTrigger>
          <SelectContent>
            {ROLE_ORDER.map((name) => {
              const role = roles.find((r) => r.name === name);
              if (!role) return null;
              const m = ROLE_META[name];
              const RIcon = m.icon;
              return (
                <SelectItem key={role.id} value={String(role.id)}>
                  <div className="flex items-center gap-2">
                    <RIcon className={`h-3 w-3 ${m.color}`} />
                    {name}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export default function RBACPage() {
  const queryClient = useQueryClient();
  const { data: roles, isLoading: rolesLoading } = useListRoles();
  const { data: members, isLoading: membersLoading } = useListMembers();

  const sortedRoles = roles
    ? [...roles].sort(
        (a, b) => ROLE_ORDER.indexOf(a.name as RoleName) - ROLE_ORDER.indexOf(b.name as RoleName),
      )
    : [];

  const handleRoleChange = async (userId: string, roleId: number) => {
    await assignMemberRole(userId, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roleId }),
    });
    queryClient.invalidateQueries({ queryKey: ["/api/members"] });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Workspace Roles</h1>
        <p className="text-sm text-muted-foreground">
          Four roles define what each member can do in your workspace.
        </p>
      </div>

      {/* Role cards */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Role Hierarchy
        </h2>
        {rolesLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-52 w-full" />
            ))}
          </div>
        ) : sortedRoles.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-12 text-center">
            <Shield className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="font-medium">No roles seeded yet</p>
              <p className="text-sm text-muted-foreground">
                Roles are initialized automatically on first RBAC API call.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {sortedRoles.map((role) => (
              <RoleCard key={role.id} role={role} />
            ))}
          </div>
        )}
      </section>

      {/* Members table */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Members ({members?.length ?? 0})
          </h2>
          <Button variant="outline" size="sm" disabled>
            <Users className="mr-1.5 h-3.5 w-3.5" />
            Invite member
          </Button>
        </div>

        {membersLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : !members || members.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-12 text-center">
            <Users className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No members found in this workspace.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {members.map((member) => (
              <MemberRow
                key={member.userId}
                member={member}
                roles={sortedRoles}
                onRoleChange={handleRoleChange}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
