"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { useRole } from "@/hooks/use-role";
import { PermissionGate } from "@/components/permission-gate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  UserPlus,
  Trash2,
  Mail,
  Clock,
  Shield,
  Crown,
  Wrench,
  Eye,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "/api";

const ROLE_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType; color: string; description: string }
> = {
  owner: {
    label: "Owner",
    icon: Crown,
    color: "bg-amber-100 text-amber-800 border-amber-200",
    description: "Full access including billing and workspace deletion",
  },
  admin: {
    label: "Admin",
    icon: Shield,
    color: "bg-blue-100 text-blue-800 border-blue-200",
    description: "Manage users, workflows, and integrations",
  },
  builder: {
    label: "Builder",
    icon: Wrench,
    color: "bg-purple-100 text-purple-800 border-purple-200",
    description: "Create workflows, dashboards, and AI agents",
  },
  viewer: {
    label: "Viewer",
    icon: Eye,
    color: "bg-gray-100 text-gray-700 border-gray-200",
    description: "Read-only access",
  },
};

type Member = {
  userId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  isActive: boolean;
  joinedAt: string;
  lastLoginAt: string | null;
  role: { id: string; name: string; description: string | null } | null;
};

type Invitation = {
  id: string;
  email: string;
  role: { id: string; name: string };
  status: string;
  invitedBy: string;
  expiresAt: string;
  createdAt: string;
};

type SystemRole = {
  id: string;
  name: string;
  description: string | null;
};

function RoleBadge({ roleName }: { roleName: string }) {
  const cfg = ROLE_CONFIG[roleName.toLowerCase()];
  if (!cfg) {
    return (
      <Badge variant="outline" className="capitalize text-xs">
        {roleName}
      </Badge>
    );
  }
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${cfg.color}`}
    >
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

function MemberInitials({
  name,
  avatarUrl,
}: {
  name: string;
  avatarUrl: string | null;
}) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className="h-8 w-8 rounded-full object-cover"
      />
    );
  }
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
      {initials}
    </div>
  );
}

export default function TeamPage() {
  const { token, user } = useAuth();
  const { isAtLeast } = useRole();

  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [systemRoles, setSystemRoles] = useState<SystemRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRoleId, setInviteRoleId] = useState<string>("");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [membersRes, invitationsRes, rolesRes] = await Promise.all([
        fetch(`${API}/members`, { headers }),
        fetch(`${API}/invitations`, { headers }),
        fetch(`${API}/roles`, { headers }),
      ]);

      if (!membersRes.ok) throw new Error("Failed to load members");

      setMembers(await membersRes.json());
      setInvitations(invitationsRes.ok ? await invitationsRes.json() : []);

      if (rolesRes.ok) {
        const allRoles: SystemRole[] = await rolesRes.json();
        // Only show customer-assignable roles (not owner or platform roles)
        const assignable = allRoles.filter((r) =>
          ["admin", "builder", "viewer"].includes(r.name.toLowerCase()),
        );
        setSystemRoles(assignable);
        if (assignable.length > 0 && !inviteRoleId) {
          setInviteRoleId(String(assignable.find((r) => r.name.toLowerCase() === "builder")?.id ?? assignable[0]?.id));
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load team data");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteRoleId) return;
    setInviting(true);
    setInviteError(null);
    try {
      const res = await fetch(`${API}/invitations`, {
        method: "POST",
        headers,
        body: JSON.stringify({ email: inviteEmail.trim(), roleId: String(inviteRoleId) }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to send invitation");
      }
      setInviteSuccess(true);
      setInviteEmail("");
      load();
      setTimeout(() => {
        setInviteOpen(false);
        setInviteSuccess(false);
      }, 2000);
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "Failed to send invitation");
    } finally {
      setInviting(false);
    }
  }

  async function handleCancelInvitation(id: string) {
    await fetch(`${API}/invitations/${id}`, { method: "DELETE", headers });
    setInvitations((prev) => prev.filter((i) => i.id !== id));
  }

  async function handleRoleChange(userId: string, roleId: string) {
    await fetch(`${API}/members/${userId}/role`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ roleId }),
    });
    load();
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading team members…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Team Members</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage who has access to your workspace and what they can do.
          </p>
        </div>
        <PermissionGate permission="users:write">
          <Button onClick={() => setInviteOpen(true)} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Invite member
          </Button>
        </PermissionGate>
      </div>

      {/* Role overview */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(ROLE_CONFIG).map(([key, cfg]) => {
          const Icon = cfg.icon;
          const count = members.filter(
            (m) => m.role?.name.toLowerCase() === key,
          ).length;
          return (
            <div
              key={key}
              className="rounded-lg border bg-card p-4 flex items-start gap-3"
            >
              <div className={`mt-0.5 rounded-md p-1.5 ${cfg.color.replace("text-", "bg-").split(" ")[0]}/20`}>
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">{cfg.label}</p>
                <p className="text-xs text-muted-foreground">{count} member{count !== 1 ? "s" : ""}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Current members */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Members ({members.length})
        </h2>
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">User</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Role</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Joined</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Last active</th>
                <PermissionGate permission="users:write">
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                </PermissionGate>
              </tr>
            </thead>
            <tbody className="divide-y">
              {members.map((member) => {
                const isMe = String(member.userId) === String(user?.id);
                const isOwner = member.role?.name.toLowerCase() === "owner";
                return (
                  <tr key={member.userId} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <MemberInitials name={member.name} avatarUrl={member.avatarUrl} />
                        <div className="min-w-0">
                          <p className="font-medium truncate">
                            {member.name}
                            {isMe && (
                              <span className="ml-1.5 text-[10px] text-muted-foreground font-normal">(you)</span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {isAtLeast("admin") && !isMe && !isOwner && systemRoles.length > 0 ? (
                        <Select
                          value={String(member.role?.id ?? "")}
                          onValueChange={(v) => handleRoleChange(member.userId as any, v)}
                        >
                          <SelectTrigger className="h-7 w-32 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {systemRoles.map((r) => (
                              <SelectItem key={r.id} value={String(r.id)}>
                                {r.name.charAt(0).toUpperCase() + r.name.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <RoleBadge roleName={member.role?.name ?? "viewer"} />
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs hidden md:table-cell">
                      {new Date(member.joinedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs hidden lg:table-cell">
                      {member.lastLoginAt
                        ? new Date(member.lastLoginAt).toLocaleDateString()
                        : "Never"}
                    </td>
                    <PermissionGate permission="users:write">
                      <td className="px-4 py-3 text-right">
                        {!isMe && !isOwner && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                            title="Remove member"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </td>
                    </PermissionGate>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Pending invitations */}
      {invitations.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Pending Invitations ({invitations.length})
          </h2>
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Role</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Invited by</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Expires</th>
                  <PermissionGate permission="users:write">
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                  </PermissionGate>
                </tr>
              </thead>
              <tbody className="divide-y">
                {invitations.map((inv) => (
                  <tr key={inv.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <span className="font-medium">{inv.email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <RoleBadge roleName={inv.role.name} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs hidden md:table-cell">
                      {inv.invitedBy}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(inv.expiresAt).toLocaleDateString()}
                      </div>
                    </td>
                    <PermissionGate permission="users:write">
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                          title="Cancel invitation"
                          onClick={() => handleCancelInvitation(inv.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </PermissionGate>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Role reference */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Role Reference
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {Object.entries(ROLE_CONFIG).map(([key, cfg]) => {
            const Icon = cfg.icon;
            return (
              <div key={key} className="rounded-lg border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">{cfg.label}</span>
                </div>
                <p className="text-xs text-muted-foreground">{cfg.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Invite dialog */}
      <Dialog open={inviteOpen} onOpenChange={(o) => { setInviteOpen(o); setInviteError(null); setInviteSuccess(false); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite team member</DialogTitle>
            <DialogDescription>
              Send an invitation email with a role assignment. The link expires in 7 days.
            </DialogDescription>
          </DialogHeader>
          {inviteSuccess ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <Mail className="h-6 w-6 text-green-600" />
              </div>
              <p className="font-medium text-sm">Invitation sent!</p>
              <p className="text-xs text-muted-foreground">
                An email was sent to <strong>{inviteEmail}</strong>
              </p>
            </div>
          ) : (
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Email address</label>
                <Input
                  type="email"
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Role</label>
                <Select value={inviteRoleId} onValueChange={setInviteRoleId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {systemRoles.map((r) => {
                      const cfg = ROLE_CONFIG[r.name.toLowerCase()];
                      return (
                        <SelectItem key={r.id} value={String(r.id)}>
                          <div>
                            <p className="font-medium">
                              {r.name.charAt(0).toUpperCase() + r.name.slice(1)}
                            </p>
                            {cfg && (
                              <p className="text-xs text-muted-foreground">{cfg.description}</p>
                            )}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              {inviteError && (
                <p className="text-sm text-destructive">{inviteError}</p>
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={inviting || !inviteEmail || !inviteRoleId}>
                  {inviting ? "Sending…" : "Send invitation"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
