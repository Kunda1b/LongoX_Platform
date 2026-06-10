import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListFeatureFlags, useCreateFeatureFlag, useUpdateFeatureFlag, useDeleteFeatureFlag, getListFeatureFlagsQueryKey,
} from "@autoflow/api-client-react";
import type { FeatureFlag } from "@autoflow/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Flag, Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from "lucide-react";

type FlagForm = { key: string; name: string; description: string; enabled: boolean; rolloutPercentage: number };
const EMPTY: FlagForm = { key: "", name: "", description: "", enabled: false, rolloutPercentage: 0 };

function slugifyKey(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/(^_|_$)/g, "");
}

export default function FeatureFlagsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: flags = [], isLoading } = useListFeatureFlags();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<FeatureFlag | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [form, setForm] = useState<FlagForm>(EMPTY);

  const createMutation = useCreateFeatureFlag({
    mutation: {
      onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListFeatureFlagsQueryKey() }); toast({ title: "Feature flag created!" }); setCreateOpen(false); setForm(EMPTY); },
      onError: () => toast({ title: "Failed to create flag", variant: "destructive" }),
    },
  });

  const updateMutation = useUpdateFeatureFlag({
    mutation: {
      onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListFeatureFlagsQueryKey() }); toast({ title: "Flag updated" }); setEditTarget(null); },
      onError: () => toast({ title: "Failed to update flag", variant: "destructive" }),
    },
  });

  const deleteMutation = useDeleteFeatureFlag({
    mutation: {
      onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListFeatureFlagsQueryKey() }); toast({ title: "Flag deleted" }); setDeleteTarget(null); },
      onError: () => toast({ title: "Failed to delete flag", variant: "destructive" }),
    },
  });

  function toggleFlag(flag: FeatureFlag) {
    updateMutation.mutate({ id: flag.id, data: { key: flag.key, name: flag.name, enabled: !flag.enabled } });
  }

  function openEdit(flag: FeatureFlag) {
    setForm({ key: flag.key, name: flag.name, description: flag.description ?? "", enabled: flag.enabled, rolloutPercentage: flag.rolloutPercentage });
    setEditTarget(flag);
  }

  const enabledCount = flags.filter((f) => f.enabled).length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Feature Flags</h1>
          <p className="text-muted-foreground mt-2">Control feature rollout with percentage-based targeting.</p>
        </div>
        <Button className="gap-2 shrink-0" onClick={() => { setForm(EMPTY); setCreateOpen(true); }}>
          <Plus className="h-4 w-4" />New Flag
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[{ label: "Total Flags", value: flags.length, color: "text-foreground" }, { label: "Enabled", value: enabledCount, color: "text-green-600" }, { label: "Disabled", value: flags.length - enabledCount, color: "text-muted-foreground" }].map(({ label, value, color }) => (
          <Card key={label}><CardContent className="pt-5 pb-4"><div className={`text-2xl font-bold ${color}`}>{value}</div><div className="text-sm text-muted-foreground">{label}</div></CardContent></Card>
        ))}
      </div>

      {isLoading ? (
        <div className="text-muted-foreground text-sm">Loading…</div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Flag</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden md:table-cell">Key</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Rollout</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Status</th>
                <th className="w-24 px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {flags.map((flag, i) => (
                <tr key={flag.id} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Flag className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <div className="font-medium">{flag.name}</div>
                        {flag.description && <div className="text-xs text-muted-foreground">{flag.description}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell font-mono text-xs text-muted-foreground">{flag.key}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden hidden sm:block">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${flag.rolloutPercentage}%` }} />
                      </div>
                      <span className="text-xs font-medium">{flag.rolloutPercentage}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Switch checked={flag.enabled} onCheckedChange={() => toggleFlag(flag)} disabled={updateMutation.isPending} />
                      <Badge className={`text-[10px] px-1.5 ${flag.enabled ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                        {flag.enabled ? "ON" : "OFF"}
                      </Badge>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground" onClick={() => openEdit(flag)}><Pencil className="h-3.5 w-3.5" /></button>
                      <button className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-destructive" onClick={() => setDeleteTarget(flag.id)}><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {flags.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                  <Flag className="h-8 w-8 mx-auto mb-2 opacity-30" />No feature flags yet
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Dialogs */}
      {[{ open: createOpen, onOpenChange: setCreateOpen, title: "New Feature Flag", onSubmit: () => createMutation.mutate({ data: { key: form.key, name: form.name, description: form.description || undefined, enabled: form.enabled, rolloutPercentage: form.rolloutPercentage } }), isPending: createMutation.isPending, label: "Create Flag" },
        { open: editTarget !== null, onOpenChange: (o: boolean) => !o && setEditTarget(null), title: "Edit Feature Flag", onSubmit: () => editTarget && updateMutation.mutate({ id: editTarget.id, data: { key: form.key, name: form.name, description: form.description || undefined, enabled: form.enabled, rolloutPercentage: form.rolloutPercentage } }), isPending: updateMutation.isPending, label: "Save Changes" }
      ].map(({ open, onOpenChange, title, onSubmit, isPending, label }) => (
        <Dialog key={title} open={open} onOpenChange={onOpenChange}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Name <span className="text-destructive">*</span></Label>
                <Input placeholder="My Feature" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, key: slugifyKey(e.target.value) }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Key <span className="text-destructive">*</span></Label>
                <Input placeholder="my_feature" value={form.key} onChange={(e) => setForm((f) => ({ ...f, key: e.target.value }))} className="font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Input placeholder="What does this flag control?" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Rollout Percentage</Label>
                  <span className="text-sm font-semibold">{form.rolloutPercentage}%</span>
                </div>
                <Slider min={0} max={100} step={5} value={[form.rolloutPercentage]} onValueChange={([v]) => setForm((f) => ({ ...f, rolloutPercentage: v }))} />
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.enabled} onCheckedChange={(v) => setForm((f) => ({ ...f, enabled: v }))} id="flag-enabled" />
                <Label htmlFor="flag-enabled">{form.enabled ? <span className="flex items-center gap-1"><ToggleRight className="h-4 w-4 text-green-600" />Enabled</span> : <span className="flex items-center gap-1"><ToggleLeft className="h-4 w-4 text-muted-foreground" />Disabled</span>}</Label>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button onClick={onSubmit} disabled={!form.key.trim() || !form.name.trim() || isPending}>{isPending ? "Saving…" : label}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ))}

      <AlertDialog open={deleteTarget !== null} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete this flag?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteTarget !== null && deleteMutation.mutate({ id: deleteTarget })} disabled={deleteMutation.isPending}>{deleteMutation.isPending ? "Deleting…" : "Delete"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
