import { useState } from "react";
import { Link } from "wouter";
import {
  useListApps, getListAppsQueryKey, useCreateApp, useDeleteApp, useGetAppStats,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LayoutGrid, Plus, ExternalLink, Trash2, Eye, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const statusColors: Record<string, string> = {
  published: "bg-emerald-100 text-emerald-700 border-emerald-200",
  draft: "bg-amber-100 text-amber-700 border-amber-200",
  archived: "bg-gray-100 text-gray-600 border-gray-200",
};

export default function AppsPage() {
  const qc = useQueryClient();
  const apps = useListApps();
  const stats = useGetAppStats();
  const createMut = useCreateApp();
  const deleteMut = useDeleteApp();

  const [createOpen, setCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", description: "", type: "dashboard" });

  function handleCreate() {
    createMut.mutate(
      { data: { name: form.name, description: form.description, type: form.type as "dashboard" | "crud" | "form" | "report" } },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListAppsQueryKey() });
          setCreateOpen(false);
          setForm({ name: "", description: "", type: "dashboard" });
        },
      }
    );
  }

  function handleDelete() {
    if (!deleteId) return;
    deleteMut.mutate({ id: deleteId }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListAppsQueryKey() });
        setDeleteId(null);
      },
    });
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Apps</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Internal tools and dashboards built with BuildKit</p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" /> New App
        </Button>
      </div>

      {/* Stats row */}
      {!stats.isLoading && stats.data && (
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total Apps", value: stats.data.totalApps },
            { label: "Published", value: stats.data.publishedApps },
            { label: "Draft", value: stats.data.draftApps },
            { label: "Total Views", value: stats.data.totalViews },
          ].map(({ label, value }) => (
            <div key={label} className="border rounded-lg px-4 py-3 bg-card">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-xl font-bold mt-0.5 tabular-nums">{value ?? 0}</p>
            </div>
          ))}
        </div>
      )}

      {apps.isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-36" />)}
        </div>
      ) : (apps.data ?? []).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <LayoutGrid className="w-10 h-10 text-muted-foreground/40 mb-3" />
          <p className="font-medium text-sm">No apps yet</p>
          <p className="text-xs text-muted-foreground mt-1">Build internal dashboards and tools with drag-and-drop components.</p>
          <Button size="sm" className="mt-4" onClick={() => setCreateOpen(true)}>Create App</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {(apps.data ?? []).map((app) => (
            <div key={app.id} className="border rounded-lg p-4 bg-card hover:border-primary/40 transition-colors flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 text-primary shrink-0">
                  <LayoutGrid className="w-4.5 h-4.5" />
                </div>
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[0.7rem] font-medium border ${statusColors[app.status] ?? statusColors.draft}`}>
                  {app.status}
                </span>
              </div>
              <div>
                <p className="font-medium text-sm">{app.name}</p>
                {app.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{app.description}</p>}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{app.pageCount} page{app.pageCount !== 1 ? "s" : ""}</span>
                <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{app.viewCount} views</span>
                <span className="capitalize ml-auto">{app.type}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Edited {app.lastEditedAt ? formatDistanceToNow(new Date(app.lastEditedAt), { addSuffix: true }) : "—"}
                </span>
                <div className="flex items-center gap-1">
                  <Link href={`/apps/${app.id}`}>
                    <a>
                      <Button variant="outline" size="sm" className="h-6 text-xs px-2">
                        <ExternalLink className="w-3 h-3 mr-1" /> Open
                      </Button>
                    </a>
                  </Link>
                  <Button variant="ghost" size="icon" className="w-6 h-6 text-muted-foreground hover:text-destructive" onClick={() => setDeleteId(app.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New App</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="app-name">Name</Label>
              <Input id="app-name" placeholder="e.g. Sales Dashboard" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="app-desc">Description</Label>
              <Textarea id="app-desc" placeholder="What does this app do?" rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="app-type">Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                <SelectTrigger id="app-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="dashboard">Dashboard</SelectItem>
                  <SelectItem value="form">Form</SelectItem>
                  <SelectItem value="table">Table</SelectItem>
                  <SelectItem value="report">Report</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button disabled={!form.name || createMut.isPending} onClick={handleCreate}>
              {createMut.isPending ? "Creating..." : "Create App"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete app?</AlertDialogTitle>
            <AlertDialogDescription>This app and all its pages will be permanently deleted.</AlertDialogDescription>
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
