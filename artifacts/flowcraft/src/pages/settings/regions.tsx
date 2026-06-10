import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListRegionPolicies, useCreateRegionPolicy, useUpdateRegionPolicy, useDeleteRegionPolicy, getListRegionPoliciesQueryKey,
} from "@autoflow/api-client-react";
import type { RegionPolicy } from "@autoflow/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Globe, Plus, Pencil, Trash2, Server } from "lucide-react";

const TIER_STYLES: Record<string, string> = {
  premium: "bg-violet-100 text-violet-700",
  standard: "bg-blue-100 text-blue-700",
  edge: "bg-amber-100 text-amber-700",
};

type RegionForm = { name: string; region: string; tier: string; replicationFactor: string; notes: string };
const EMPTY: RegionForm = { name: "", region: "", tier: "standard", replicationFactor: "1", notes: "" };

export default function RegionsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: policies = [], isLoading } = useListRegionPolicies();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<RegionPolicy | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [form, setForm] = useState<RegionForm>(EMPTY);

  const createMutation = useCreateRegionPolicy({
    mutation: {
      onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListRegionPoliciesQueryKey() }); toast({ title: "Region policy created!" }); setCreateOpen(false); setForm(EMPTY); },
      onError: () => toast({ title: "Failed to create policy", variant: "destructive" }),
    },
  });

  const updateMutation = useUpdateRegionPolicy({
    mutation: {
      onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListRegionPoliciesQueryKey() }); toast({ title: "Policy updated" }); setEditTarget(null); },
      onError: () => toast({ title: "Failed to update policy", variant: "destructive" }),
    },
  });

  const deleteMutation = useDeleteRegionPolicy({
    mutation: {
      onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListRegionPoliciesQueryKey() }); toast({ title: "Policy deleted" }); setDeleteTarget(null); },
      onError: () => toast({ title: "Failed to delete policy", variant: "destructive" }),
    },
  });

  function openEdit(p: RegionPolicy) {
    setForm({ name: p.name, region: p.region, tier: p.tier, replicationFactor: String(p.replicationFactor), notes: p.notes ?? "" });
    setEditTarget(p);
  }

  function handleCreate() {
    createMutation.mutate({ data: { name: form.name.trim(), region: form.region.trim(), tier: form.tier as "standard" | "premium" | "edge", replicationFactor: Number(form.replicationFactor), notes: form.notes || undefined } });
  }

  function handleUpdate() {
    if (!editTarget) return;
    updateMutation.mutate({ id: editTarget.id, data: { name: form.name.trim(), region: form.region.trim(), tier: form.tier as "standard" | "premium" | "edge", replicationFactor: Number(form.replicationFactor), notes: form.notes || undefined } });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Multi-Region Strategy</h1>
          <p className="text-muted-foreground mt-2">Define region policies, replication factors, and deployment tiers.</p>
        </div>
        <Button className="gap-2 shrink-0" onClick={() => { setForm(EMPTY); setCreateOpen(true); }}>
          <Plus className="h-4 w-4" />Add Region
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[{ label: "Total Regions", value: policies.length, color: "text-foreground" }, { label: "Premium", value: policies.filter((p) => p.tier === "premium").length, color: "text-violet-600" }, { label: "Avg Replication", value: policies.length > 0 ? (policies.reduce((s, p) => s + p.replicationFactor, 0) / policies.length).toFixed(1) : "—", color: "text-blue-600" }].map(({ label, value, color }) => (
          <Card key={label}><CardContent className="pt-5 pb-4"><div className={`text-2xl font-bold ${color}`}>{value}</div><div className="text-sm text-muted-foreground">{label}</div></CardContent></Card>
        ))}
      </div>

      {isLoading ? (
        <div className="text-muted-foreground text-sm">Loading…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {policies.map((p) => (
            <Card key={p.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle className="text-base">{p.name}</CardTitle>
                      <p className="text-xs font-mono text-muted-foreground">{p.region}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground" onClick={() => openEdit(p)}><Pencil className="h-3.5 w-3.5" /></button>
                    <button className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-destructive" onClick={() => setDeleteTarget(p.id)}><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  <Badge className={`text-[10px] uppercase font-semibold px-1.5 ${TIER_STYLES[p.tier] ?? ""}`}>{p.tier}</Badge>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Server className="h-3 w-3" /><span>×{p.replicationFactor} replicas</span>
                  </div>
                </div>
                {p.notes && <p className="text-xs text-muted-foreground">{p.notes}</p>}
              </CardContent>
            </Card>
          ))}
          {policies.length === 0 && (
            <div className="col-span-3 text-center py-16 text-muted-foreground">
              <Globe className="h-10 w-10 mx-auto mb-4 opacity-30" />
              <p className="font-medium">No region policies yet</p>
            </div>
          )}
        </div>
      )}

      {[{ open: createOpen, onOpenChange: setCreateOpen, title: "Add Region Policy", onSubmit: handleCreate, isPending: createMutation.isPending, label: "Add Region" },
        { open: editTarget !== null, onOpenChange: (o: boolean) => !o && setEditTarget(null), title: "Edit Region Policy", onSubmit: handleUpdate, isPending: updateMutation.isPending, label: "Save Changes" }
      ].map(({ open, onOpenChange, title, onSubmit, isPending, label }) => (
        <Dialog key={title} open={open} onOpenChange={onOpenChange}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Name <span className="text-destructive">*</span></Label>
                <Input placeholder="US East Primary" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Region Code <span className="text-destructive">*</span></Label>
                <Input placeholder="us-east-1" value={form.region} onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))} className="font-mono" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Tier</Label>
                  <Select value={form.tier} onValueChange={(v) => setForm((f) => ({ ...f, tier: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="edge">Edge</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Replication Factor</Label>
                  <Input type="number" min={1} max={5} value={form.replicationFactor} onChange={(e) => setForm((f) => ({ ...f, replicationFactor: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Textarea placeholder="Architecture notes, SLA requirements…" rows={3} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button onClick={onSubmit} disabled={!form.name.trim() || !form.region.trim() || isPending}>{isPending ? "Saving…" : label}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ))}

      <AlertDialog open={deleteTarget !== null} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete this region policy?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteTarget !== null && deleteMutation.mutate({ id: deleteTarget })} disabled={deleteMutation.isPending}>{deleteMutation.isPending ? "Deleting…" : "Delete"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
