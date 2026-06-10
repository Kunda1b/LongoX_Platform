import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListTenants,
  useCreateTenant,
  useUpdateTenant,
  useDeleteTenant,
  getListTenantsQueryKey,
} from "@autoflow/api-client-react";
import type { Tenant } from "@autoflow/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Building2, Plus, Pencil, Trash2, CheckCircle2, XCircle } from "lucide-react";

const PLAN_COLORS: Record<string, string> = {
  free: "bg-slate-100 text-slate-700",
  pro: "bg-blue-100 text-blue-700",
  enterprise: "bg-violet-100 text-violet-700",
};

type TenantForm = { name: string; slug: string; plan: string; isActive: boolean };
const EMPTY_FORM: TenantForm = { name: "", slug: "", plan: "free", isActive: true };

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function TenantsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: tenants = [], isLoading } = useListTenants();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Tenant | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [form, setForm] = useState<TenantForm>(EMPTY_FORM);

  const createMutation = useCreateTenant({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTenantsQueryKey() });
        toast({ title: "Tenant created!" });
        setCreateOpen(false);
        setForm(EMPTY_FORM);
      },
      onError: () => toast({ title: "Failed to create tenant", variant: "destructive" }),
    },
  });

  const updateMutation = useUpdateTenant({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTenantsQueryKey() });
        toast({ title: "Tenant updated" });
        setEditTarget(null);
      },
      onError: () => toast({ title: "Failed to update tenant", variant: "destructive" }),
    },
  });

  const deleteMutation = useDeleteTenant({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTenantsQueryKey() });
        toast({ title: "Tenant deleted" });
        setDeleteTarget(null);
      },
      onError: () => toast({ title: "Failed to delete tenant", variant: "destructive" }),
    },
  });

  function openCreate() {
    setForm(EMPTY_FORM);
    setCreateOpen(true);
  }

  function openEdit(t: Tenant) {
    setForm({ name: t.name, slug: t.slug, plan: t.plan, isActive: t.isActive });
    setEditTarget(t);
  }

  function handleNameChange(name: string) {
    setForm((f) => ({ ...f, name, slug: slugify(name) }));
  }

  function handleCreate() {
    createMutation.mutate({ data: { name: form.name.trim(), slug: form.slug.trim(), plan: form.plan as "free" | "pro" | "enterprise", isActive: form.isActive } });
  }

  function handleUpdate() {
    if (!editTarget) return;
    updateMutation.mutate({ id: editTarget.id, data: { name: form.name.trim(), slug: form.slug.trim(), plan: form.plan as "free" | "pro" | "enterprise", isActive: form.isActive } });
  }

  const isFormValid = form.name.trim() && form.slug.trim();

  return (
    <div className="space-y-6">
      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tenants</h1>
          <p className="text-muted-foreground mt-2">Manage organisations and their subscription plans.</p>
        </div>
        <Button className="gap-2 shrink-0" onClick={openCreate}>
          <Plus className="h-4 w-4" />New Tenant
        </Button>
      </div>

      {/* ─── Stats Row ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(["total", "enterprise", "pro", "free"] as const).map((key) => {
          const count = key === "total"
            ? tenants.length
            : tenants.filter((t) => t.plan === key).length;
          const labels: Record<string, string> = { total: "Total Tenants", enterprise: "Enterprise", pro: "Pro", free: "Free" };
          const colors: Record<string, string> = { total: "text-foreground", enterprise: "text-violet-600", pro: "text-blue-600", free: "text-slate-600" };
          return (
            <Card key={key}>
              <CardContent className="pt-5 pb-4">
                <div className={`text-2xl font-bold ${colors[key]}`}>{count}</div>
                <div className="text-sm text-muted-foreground">{labels[key]}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ─── Tenant Cards ────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="text-muted-foreground text-sm">Loading tenants…</div>
      ) : tenants.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Building2 className="h-10 w-10 mx-auto mb-4 opacity-30" />
          <p className="font-medium">No tenants yet</p>
          <p className="text-sm mt-1">Create your first tenant to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {tenants.map((t) => (
            <Card key={t.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base leading-tight">{t.name}</CardTitle>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">{t.slug}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" onClick={() => openEdit(t)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-destructive" onClick={() => setDeleteTarget(t.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={`text-[10px] uppercase font-semibold px-2 ${PLAN_COLORS[t.plan] ?? ""}`}>
                    {t.plan}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs">
                    {t.isActive
                      ? <><CheckCircle2 className="h-3.5 w-3.5 text-green-500" /><span className="text-green-600">Active</span></>
                      : <><XCircle className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-muted-foreground">Inactive</span></>
                    }
                  </div>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {new Date(t.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ─── Create Dialog ────────────────────────────────────────────────────── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>New Tenant</DialogTitle></DialogHeader>
          <TenantForm form={form} setForm={setForm} onNameChange={handleNameChange} />
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleCreate} disabled={!isFormValid || createMutation.isPending}>
              {createMutation.isPending ? "Creating…" : "Create Tenant"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Edit Dialog ─────────────────────────────────────────────────────── */}
      <Dialog open={editTarget !== null} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Edit Tenant</DialogTitle></DialogHeader>
          <TenantForm form={form} setForm={setForm} onNameChange={(n) => setForm((f) => ({ ...f, name: n }))} />
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleUpdate} disabled={!isFormValid || updateMutation.isPending}>
              {updateMutation.isPending ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation ─────────────────────────────────────────────── */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this tenant?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove the tenant and all associated data.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget !== null && deleteMutation.mutate({ id: deleteTarget })}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function TenantForm({
  form, setForm, onNameChange,
}: {
  form: TenantForm;
  setForm: React.Dispatch<React.SetStateAction<TenantForm>>;
  onNameChange: (name: string) => void;
}) {
  return (
    <div className="space-y-4 py-2">
      <div className="space-y-1.5">
        <Label>Name <span className="text-destructive">*</span></Label>
        <Input placeholder="Acme Corp" value={form.name} onChange={(e) => onNameChange(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>Slug <span className="text-destructive">*</span></Label>
        <Input placeholder="acme-corp" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} className="font-mono" />
        <p className="text-xs text-muted-foreground">Unique identifier used in URLs and API calls.</p>
      </div>
      <div className="space-y-1.5">
        <Label>Plan</Label>
        <Select value={form.plan} onValueChange={(v) => setForm((f) => ({ ...f, plan: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="pro">Pro</SelectItem>
            <SelectItem value="enterprise">Enterprise</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-3">
        <Switch checked={form.isActive} onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))} id="tenant-active" />
        <Label htmlFor="tenant-active">Active</Label>
      </div>
    </div>
  );
}
