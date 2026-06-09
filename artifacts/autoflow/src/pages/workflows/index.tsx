import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  useListWorkflows,
  getListWorkflowsQueryKey,
  useCreateWorkflow,
  useDeleteWorkflow,
  useToggleWorkflow,
  useDuplicateWorkflow,
  useRunWorkflow,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  GitBranch, Plus, Search, MoreHorizontal, Play, Copy, Trash2,
  CheckCircle2, AlertCircle, Clock, PauseCircle, Edit
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const triggerLabels: Record<string, string> = {
  webhook: "Webhook",
  schedule: "Schedule",
  manual: "Manual",
  event: "Event",
};

function statusBadge(status: string) {
  const cfg: Record<string, { cls: string; label: string }> = {
    active: { cls: "bg-emerald-100 text-emerald-700 border-emerald-200", label: "Active" },
    inactive: { cls: "bg-gray-100 text-gray-600 border-gray-200", label: "Inactive" },
    draft: { cls: "bg-amber-100 text-amber-700 border-amber-200", label: "Draft" },
  };
  const c = cfg[status] ?? cfg.draft;
  return <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[0.7rem] font-medium border ${c.cls}`}>{c.label}</span>;
}

function lastRunBadge(status: string | null) {
  if (!status) return null;
  if (status === "success") return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
  if (status === "failed") return <AlertCircle className="w-3.5 h-3.5 text-red-500" />;
  return <Clock className="w-3.5 h-3.5 text-blue-500" />;
}

export default function WorkflowsPage() {
  const qc = useQueryClient();
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", description: "", triggerType: "webhook" });

  const workflows = useListWorkflows({ status: statusFilter !== "all" ? statusFilter as "active" | "inactive" | "draft" : undefined, search: search || undefined });
  const createMut = useCreateWorkflow();
  const deleteMut = useDeleteWorkflow();
  const toggleMut = useToggleWorkflow();
  const dupMut = useDuplicateWorkflow();
  const runMut = useRunWorkflow();

  function handleCreate() {
    createMut.mutate(
      { data: { name: form.name, description: form.description, triggerType: form.triggerType } },
      {
        onSuccess: (wf) => {
          qc.invalidateQueries({ queryKey: getListWorkflowsQueryKey() });
          setCreateOpen(false);
          setForm({ name: "", description: "", triggerType: "webhook" });
          navigate(`/workflows/${wf.id}`);
        },
      }
    );
  }

  function handleDelete() {
    if (!deleteId) return;
    deleteMut.mutate({ id: deleteId }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListWorkflowsQueryKey() });
        setDeleteId(null);
      },
    });
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Workflows</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Build and manage your automation workflows</p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" /> New Workflow
        </Button>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-8 h-8 text-sm" placeholder="Search workflows..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32 h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {workflows.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
        </div>
      ) : (workflows.data ?? []).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <GitBranch className="w-10 h-10 text-muted-foreground/40 mb-3" />
          <p className="font-medium text-sm">No workflows found</p>
          <p className="text-xs text-muted-foreground mt-1">Create your first workflow to start automating tasks.</p>
          <Button size="sm" className="mt-4" onClick={() => setCreateOpen(true)}>New Workflow</Button>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Name</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground w-24">Status</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground w-24">Trigger</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground w-24">Runs</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground w-36">Last Run</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {(workflows.data ?? []).map((wf) => (
                <tr key={wf.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/workflows/${wf.id}`}>
                      <a className="font-medium hover:text-primary transition-colors">{wf.name}</a>
                    </Link>
                    {wf.description && <p className="text-xs text-muted-foreground truncate max-w-xs mt-0.5">{wf.description}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {statusBadge(wf.status)}
                      {wf.status !== "draft" && (
                        <Switch
                          className="scale-75"
                          checked={wf.status === "active"}
                          onCheckedChange={() => toggleMut.mutate({ id: wf.id }, { onSuccess: () => qc.invalidateQueries({ queryKey: getListWorkflowsQueryKey() }) })}
                        />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-muted-foreground">{triggerLabels[wf.triggerType] ?? wf.triggerType}</span>
                  </td>
                  <td className="px-4 py-3 tabular-nums text-xs text-muted-foreground">{wf.executionCount}</td>
                  <td className="px-4 py-3">
                    {wf.lastRunAt ? (
                      <div className="flex items-center gap-1.5">
                        {lastRunBadge(wf.lastRunStatus ?? null)}
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(wf.lastRunAt), { addSuffix: true })}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Never</span>
                    )}
                  </td>
                  <td className="px-2 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="w-7 h-7">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => navigate(`/workflows/${wf.id}`)}>
                          <Edit className="w-3.5 h-3.5 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => runMut.mutate({ id: wf.id }, { onSuccess: (ex) => navigate(`/executions/${ex.id}`) })}>
                          <Play className="w-3.5 h-3.5 mr-2" /> Run now
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => dupMut.mutate({ id: wf.id }, { onSuccess: () => qc.invalidateQueries({ queryKey: getListWorkflowsQueryKey() }) })}>
                          <Copy className="w-3.5 h-3.5 mr-2" /> Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(wf.id)}>
                          <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Workflow</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="wf-name">Name</Label>
              <Input id="wf-name" placeholder="e.g. New Lead Enrichment" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wf-desc">Description</Label>
              <Textarea id="wf-desc" placeholder="What does this workflow do?" rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wf-trigger">Trigger</Label>
              <Select value={form.triggerType} onValueChange={(v) => setForm((f) => ({ ...f, triggerType: v }))}>
                <SelectTrigger id="wf-trigger"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="webhook">Webhook</SelectItem>
                  <SelectItem value="schedule">Schedule</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button disabled={!form.name || createMut.isPending} onClick={handleCreate}>
              {createMut.isPending ? "Creating..." : "Create & Edit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete workflow?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the workflow and all its execution history.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
