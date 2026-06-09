import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListPrompts, useCreatePrompt, useUpdatePrompt, useDeletePrompt, usePublishPrompt,
  useListPromptVersions, getListPromptsQueryKey,
} from "@workspace/api-client-react";
import type { Prompt } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Plus, Pencil, Trash2, CheckCircle2, Clock, Send, History } from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  review: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
};

type PromptForm = { name: string; description: string; content: string; tagsInput: string };
const EMPTY: PromptForm = { name: "", description: "", content: "", tagsInput: "" };

export default function PromptsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: prompts = [], isLoading } = useListPrompts();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Prompt | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [versionTarget, setVersionTarget] = useState<Prompt | null>(null);
  const [form, setForm] = useState<PromptForm>(EMPTY);

  const { data: versions = [] } = useListPromptVersions(versionTarget?.id ?? 0, { query: { enabled: versionTarget !== null } });

  const createMutation = useCreatePrompt({
    mutation: {
      onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListPromptsQueryKey() }); toast({ title: "Prompt created!" }); setCreateOpen(false); setForm(EMPTY); },
      onError: () => toast({ title: "Failed to create prompt", variant: "destructive" }),
    },
  });

  const updateMutation = useUpdatePrompt({
    mutation: {
      onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListPromptsQueryKey() }); toast({ title: "Prompt updated" }); setEditTarget(null); },
      onError: () => toast({ title: "Failed to update prompt", variant: "destructive" }),
    },
  });

  const deleteMutation = useDeletePrompt({
    mutation: {
      onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListPromptsQueryKey() }); toast({ title: "Prompt deleted" }); setDeleteTarget(null); },
      onError: () => toast({ title: "Failed to delete prompt", variant: "destructive" }),
    },
  });

  const publishMutation = usePublishPrompt({
    mutation: {
      onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListPromptsQueryKey() }); toast({ title: "Prompt published!" }); },
      onError: () => toast({ title: "Failed to publish prompt", variant: "destructive" }),
    },
  });

  function openEdit(p: Prompt) {
    setForm({ name: p.name, description: p.description ?? "", content: p.content, tagsInput: (p.tags ?? []).join(", ") });
    setEditTarget(p);
  }

  function handleCreate() {
    const tags = form.tagsInput.split(",").map((t) => t.trim()).filter(Boolean);
    createMutation.mutate({ data: { name: form.name.trim(), description: form.description || undefined, content: form.content.trim(), tags } });
  }

  function handleUpdate() {
    if (!editTarget) return;
    const tags = form.tagsInput.split(",").map((t) => t.trim()).filter(Boolean);
    updateMutation.mutate({ id: editTarget.id, data: { name: form.name.trim(), description: form.description || undefined, content: form.content.trim(), tags } });
  }

  const draftCount = prompts.filter((p) => p.status === "draft").length;
  const reviewCount = prompts.filter((p) => p.status === "review").length;
  const approvedCount = prompts.filter((p) => p.status === "approved").length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Prompt Registry</h1>
          <p className="text-muted-foreground mt-2">Version-controlled prompt assets for your AI workflows.</p>
        </div>
        <Button className="gap-2 shrink-0" onClick={() => { setForm(EMPTY); setCreateOpen(true); }}>
          <Plus className="h-4 w-4" />New Prompt
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[{ label: "Draft", value: draftCount, color: "text-slate-600" }, { label: "In Review", value: reviewCount, color: "text-amber-600" }, { label: "Approved", value: approvedCount, color: "text-green-600" }].map(({ label, value, color }) => (
          <Card key={label}><CardContent className="pt-5 pb-4"><div className={`text-2xl font-bold ${color}`}>{value}</div><div className="text-sm text-muted-foreground">{label}</div></CardContent></Card>
        ))}
      </div>

      {isLoading ? (
        <div className="text-muted-foreground text-sm">Loading prompts…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {prompts.map((p) => (
            <Card key={p.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary shrink-0" />
                    <div>
                      <CardTitle className="text-base">{p.name}</CardTitle>
                      {p.description && <p className="text-xs text-muted-foreground mt-0.5">{p.description}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground" title="Version history" onClick={() => setVersionTarget(p)}><History className="h-3.5 w-3.5" /></button>
                    <button className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground" onClick={() => openEdit(p)}><Pencil className="h-3.5 w-3.5" /></button>
                    <button className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-destructive" onClick={() => setDeleteTarget(p.id)}><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 flex-1 flex flex-col gap-3">
                <pre className="text-xs text-muted-foreground bg-muted/40 rounded p-2 overflow-hidden line-clamp-3 whitespace-pre-wrap font-mono">{p.content}</pre>
                <div className="flex items-center gap-2 flex-wrap mt-auto">
                  <Badge className={`text-[10px] uppercase font-semibold px-1.5 ${STATUS_STYLES[p.status] ?? ""}`}>{p.status}</Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />v{p.version}</span>
                  {p.tags?.slice(0, 2).map((tag) => <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>)}
                  {p.status !== "approved" && (
                    <Button size="sm" variant="outline" className="ml-auto h-7 gap-1 text-xs" onClick={() => publishMutation.mutate({ id: p.id })} disabled={publishMutation.isPending}>
                      <Send className="h-3 w-3" />Publish
                    </Button>
                  )}
                  {p.status === "approved" && <CheckCircle2 className="h-4 w-4 text-green-500 ml-auto" />}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit dialogs */}
      {[{ open: createOpen, onOpenChange: setCreateOpen, title: "New Prompt", onSubmit: handleCreate, isPending: createMutation.isPending, label: "Create Prompt" },
        { open: editTarget !== null, onOpenChange: (o: boolean) => !o && setEditTarget(null), title: "Edit Prompt", onSubmit: handleUpdate, isPending: updateMutation.isPending, label: "Save Changes" }].map(({ open, onOpenChange, title, onSubmit, isPending, label }) => (
        <Dialog key={title} open={open} onOpenChange={onOpenChange}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <Label>Name <span className="text-destructive">*</span></Label>
                  <Input placeholder="My Prompt" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <Label>Description</Label>
                  <Input placeholder="What does this prompt do?" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Content <span className="text-destructive">*</span></Label>
                <Textarea placeholder="Use {{variable}} for template variables…" rows={8} value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} className="font-mono text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label>Tags</Label>
                <Input placeholder="summarize, json, crm (comma-separated)" value={form.tagsInput} onChange={(e) => setForm((f) => ({ ...f, tagsInput: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button onClick={onSubmit} disabled={!form.name.trim() || !form.content.trim() || isPending}>{isPending ? "Saving…" : label}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ))}

      <AlertDialog open={deleteTarget !== null} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete this prompt?</AlertDialogTitle><AlertDialogDescription>All versions will be permanently removed.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteTarget !== null && deleteMutation.mutate({ id: deleteTarget })} disabled={deleteMutation.isPending}>{deleteMutation.isPending ? "Deleting…" : "Delete"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet open={versionTarget !== null} onOpenChange={(o) => !o && setVersionTarget(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader><SheetTitle>Version History — {versionTarget?.name}</SheetTitle></SheetHeader>
          <div className="mt-6 space-y-4">
            {versions.map((v) => (
              <div key={v.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className={`text-[10px] uppercase font-semibold ${STATUS_STYLES[v.status] ?? ""}`}>{v.status}</Badge>
                  <span className="text-xs font-medium">v{v.version}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{new Date(v.createdAt).toLocaleDateString()}</span>
                </div>
                <pre className="text-xs text-muted-foreground bg-muted/40 rounded p-2 overflow-auto max-h-32 whitespace-pre-wrap font-mono">{v.content}</pre>
                {v.notes && <p className="text-xs text-muted-foreground italic">{v.notes}</p>}
              </div>
            ))}
            {versions.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No versions found.</p>}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
