import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListRoles,
  useListPermissions,
  useListUserRoles,
  useGetRole,
  useCreateRole,
  useDeleteRole,
  useAssignRole,
  useRevokeRole,
  getListRolesQueryKey,
  getListUserRolesQueryKey,
} from "@autoflow/api-client-react";
import type { Role, Permission } from "@autoflow/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Shield, Plus, Trash2, Users, Lock, UserCheck } from "lucide-react";

const RESOURCE_COLORS: Record<string, string> = {
  workflows: "bg-blue-100 text-blue-700",
  connectors: "bg-teal-100 text-teal-700",
  apps: "bg-amber-100 text-amber-700",
  credentials: "bg-red-100 text-red-700",
  analytics: "bg-indigo-100 text-indigo-700",
  billing: "bg-green-100 text-green-700",
  users: "bg-orange-100 text-orange-700",
  tenants: "bg-violet-100 text-violet-700",
};

function groupPermissions(perms: Permission[]) {
  const groups: Record<string, Permission[]> = {};
  for (const p of perms) {
    if (!groups[p.resource]) groups[p.resource] = [];
    groups[p.resource].push(p);
  }
  return groups;
}

export default function RbacPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: roles = [], isLoading: rolesLoading } = useListRoles({});
  const { data: permissions = [] } = useListPermissions();
  const { data: userRoles = [], isLoading: userRolesLoading } = useListUserRoles({});

  const [activeTab, setActiveTab] = useState("roles");

  // Role creation
  const [createRoleOpen, setCreateRoleOpen] = useState(false);
  const [roleForm, setRoleForm] = useState({ name: "", description: "" });
  const [deleteRoleTarget, setDeleteRoleTarget] = useState<number | null>(null);

  // Assign role to user
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({ userId: "", roleId: "" });
  const [revokeTarget, setRevokeTarget] = useState<number | null>(null);

  const createRoleMutation = useCreateRole({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListRolesQueryKey() });
        toast({ title: "Role created!" });
        setCreateRoleOpen(false);
        setRoleForm({ name: "", description: "" });
      },
      onError: () => toast({ title: "Failed to create role", variant: "destructive" }),
    },
  });

  const deleteRoleMutation = useDeleteRole({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListRolesQueryKey() });
        toast({ title: "Role deleted" });
        setDeleteRoleTarget(null);
      },
      onError: () => toast({ title: "Failed to delete role", variant: "destructive" }),
    },
  });

  const assignMutation = useAssignRole({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListUserRolesQueryKey() });
        toast({ title: "Role assigned!" });
        setAssignOpen(false);
        setAssignForm({ userId: "", roleId: "" });
      },
      onError: () => toast({ title: "Failed to assign role", variant: "destructive" }),
    },
  });

  const revokeMutation = useRevokeRole({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListUserRolesQueryKey() });
        toast({ title: "Role revoked" });
        setRevokeTarget(null);
      },
      onError: () => toast({ title: "Failed to revoke role", variant: "destructive" }),
    },
  });

  const permGroups = groupPermissions(permissions);

  return (
    <div className="space-y-6">
      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Access Control</h1>
          <p className="text-muted-foreground mt-2">Manage roles, permissions, and user access across the platform.</p>
        </div>
      </div>

      {/* ─── Stats ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Roles", value: roles.length, icon: Shield, color: "text-violet-600" },
          { label: "Permissions", value: permissions.length, icon: Lock, color: "text-blue-600" },
          { label: "Assignments", value: userRoles.length, icon: UserCheck, color: "text-green-600" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="pt-5 pb-4 flex items-center gap-3">
              <Icon className={`h-8 w-8 ${color} opacity-80`} />
              <div>
                <div className="text-2xl font-bold">{value}</div>
                <div className="text-sm text-muted-foreground">{label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ─── Tabs ────────────────────────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="roles" className="gap-2"><Shield className="h-4 w-4" />Roles</TabsTrigger>
          <TabsTrigger value="permissions" className="gap-2"><Lock className="h-4 w-4" />Permissions</TabsTrigger>
          <TabsTrigger value="assignments" className="gap-2"><Users className="h-4 w-4" />User Assignments</TabsTrigger>
        </TabsList>

        {/* ─ Roles tab ─────────────────────────────────────────────────────── */}
        <TabsContent value="roles" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Roles</h2>
            <Button size="sm" className="gap-2" onClick={() => setCreateRoleOpen(true)}>
              <Plus className="h-4 w-4" />New Role
            </Button>
          </div>
          {rolesLoading ? (
            <div className="text-muted-foreground text-sm">Loading…</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {roles.map((role) => (
                <RoleCard key={role.id} role={role} onDelete={() => setDeleteRoleTarget(role.id)} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ─ Permissions tab ───────────────────────────────────────────────── */}
        <TabsContent value="permissions" className="mt-6">
          <h2 className="text-lg font-semibold mb-4">System Permissions</h2>
          <div className="space-y-6">
            {Object.entries(permGroups).map(([resource, perms]) => (
              <div key={resource}>
                <div className="flex items-center gap-2 mb-3">
                  <Badge className={`text-xs font-semibold px-2 ${RESOURCE_COLORS[resource] ?? "bg-muted text-muted-foreground"}`}>
                    {resource}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{perms.length} permissions</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {perms.map((p) => (
                    <div key={p.id} className="flex items-start gap-2.5 p-3 rounded-lg border bg-card">
                      <Lock className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
                      <div>
                        <div className="text-sm font-medium">{p.action}</div>
                        {p.description && <div className="text-xs text-muted-foreground mt-0.5">{p.description}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* ─ User Assignments tab ──────────────────────────────────────────── */}
        <TabsContent value="assignments" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">User Role Assignments</h2>
            <Button size="sm" className="gap-2" onClick={() => setAssignOpen(true)}>
              <Plus className="h-4 w-4" />Assign Role
            </Button>
          </div>
          {userRolesLoading ? (
            <div className="text-muted-foreground text-sm">Loading…</div>
          ) : userRoles.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <UserCheck className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No role assignments yet</p>
              <p className="text-sm mt-1">Assign a role to a user to get started.</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">User ID</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Role</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Tenant</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Assigned</th>
                    <th className="w-10 px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {userRoles.map((ur, i) => (
                    <tr key={ur.id} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                      <td className="px-4 py-2.5 font-mono text-xs">{ur.userId}</td>
                      <td className="px-4 py-2.5">
                        <Badge variant="secondary" className="text-xs">{ur.roleName}</Badge>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground text-xs">{ur.tenantName ?? "—"}</td>
                      <td className="px-4 py-2.5 text-muted-foreground text-xs">{new Date(ur.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-2.5">
                        <button className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-destructive" onClick={() => setRevokeTarget(ur.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ─── Create Role Dialog ──────────────────────────────────────────────── */}
      <Dialog open={createRoleOpen} onOpenChange={setCreateRoleOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>New Role</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Name <span className="text-destructive">*</span></Label>
              <Input placeholder="e.g. Analyst" value={roleForm.name} onChange={(e) => setRoleForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input placeholder="What can this role do?" value={roleForm.description} onChange={(e) => setRoleForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={() => createRoleMutation.mutate({ data: { name: roleForm.name, description: roleForm.description || undefined } })} disabled={!roleForm.name.trim() || createRoleMutation.isPending}>
              {createRoleMutation.isPending ? "Creating…" : "Create Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Assign Role Dialog ──────────────────────────────────────────────── */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Assign Role to User</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>User ID <span className="text-destructive">*</span></Label>
              <Input placeholder="user@example.com or UUID" value={assignForm.userId} onChange={(e) => setAssignForm((f) => ({ ...f, userId: e.target.value }))} className="font-mono text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label>Role <span className="text-destructive">*</span></Label>
              <div className="grid gap-2">
                {roles.map((r) => (
                  <label key={r.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${assignForm.roleId === String(r.id) ? "border-primary bg-primary/5" : "hover:bg-muted/40"}`}>
                    <Checkbox
                      checked={assignForm.roleId === String(r.id)}
                      onCheckedChange={() => setAssignForm((f) => ({ ...f, roleId: String(r.id) }))}
                    />
                    <div>
                      <div className="font-medium text-sm">{r.name}</div>
                      {r.description && <div className="text-xs text-muted-foreground">{r.description}</div>}
                    </div>
                    <Badge variant="outline" className="ml-auto text-xs">{r.permissionCount} perms</Badge>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button
              onClick={() => assignMutation.mutate({ data: { userId: assignForm.userId, roleId: Number(assignForm.roleId) } })}
              disabled={!assignForm.userId.trim() || !assignForm.roleId || assignMutation.isPending}
            >
              {assignMutation.isPending ? "Assigning…" : "Assign Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Role Confirmation ─────────────────────────────────────────── */}
      <AlertDialog open={deleteRoleTarget !== null} onOpenChange={(o) => !o && setDeleteRoleTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this role?</AlertDialogTitle>
            <AlertDialogDescription>This will remove the role and all its permission assignments. User role assignments using this role will also be removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteRoleTarget !== null && deleteRoleMutation.mutate({ id: deleteRoleTarget })}
              disabled={deleteRoleMutation.isPending}
            >
              {deleteRoleMutation.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Revoke Assignment Confirmation ──────────────────────────────────── */}
      <AlertDialog open={revokeTarget !== null} onOpenChange={(o) => !o && setRevokeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke this role assignment?</AlertDialogTitle>
            <AlertDialogDescription>The user will lose all permissions granted by this role.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => revokeTarget !== null && revokeMutation.mutate({ id: revokeTarget })}
              disabled={revokeMutation.isPending}
            >
              {revokeMutation.isPending ? "Revoking…" : "Revoke"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function RoleCard({ role, onDelete }: { role: Role; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const { data: detail } = useGetRole(role.id, { query: { enabled: expanded, queryKey: [] } });

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-violet-600" />
            <div>
              <CardTitle className="text-base">{role.name}</CardTitle>
              {role.description && <p className="text-xs text-muted-foreground mt-0.5">{role.description}</p>}
            </div>
          </div>
          <button className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-destructive transition-colors" onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <Badge variant="outline" className="text-xs">{role.permissionCount} permissions</Badge>
          {role.tenantId && <Badge variant="secondary" className="text-xs">Tenant {role.tenantId}</Badge>}
          <button
            className="text-xs text-primary hover:underline ml-auto"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? "Hide" : "View"} permissions
          </button>
        </div>
        {expanded && detail && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {detail.permissions.map((p: Permission) => (
              <Badge key={p.id} variant="outline" className={`text-[10px] px-1.5 ${RESOURCE_COLORS[p.resource] ?? ""}`}>
                {p.resource}:{p.action}
              </Badge>
            ))}
            {detail.permissions.length === 0 && <span className="text-xs text-muted-foreground">No permissions assigned</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
