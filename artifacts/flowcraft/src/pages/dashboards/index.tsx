import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListDashboards,
  useCreateDashboard,
  useDeleteDashboard,
  getListDashboardsQueryKey,
} from "@longox/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  LayoutDashboard,
  Plus,
  Search,
  MoreVertical,
  Pencil,
  Trash2,
  Globe,
  FileStack,
  BarChart2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function DashboardsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: dashboards = [], isLoading } = useListDashboards(
    search ? { search } : {},
    {
      query: { queryKey: getListDashboardsQueryKey(search ? { search } : {}) },
    },
  );

  const createMutation = useCreateDashboard({
    mutation: {
      onSuccess: (d) => {
        queryClient.invalidateQueries({
          queryKey: getListDashboardsQueryKey(),
        });
        setCreateOpen(false);
        setNewName("");
        setNewDesc("");
        toast({ title: "Dashboard created" });
        setLocation(`/dashboards/${d.id}`);
      },
      onError: () =>
        toast({ title: "Failed to create dashboard", variant: "destructive" }),
    },
  });

  const deleteMutation = useDeleteDashboard({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getListDashboardsQueryKey(),
        });
        setDeleteId(null);
        toast({ title: "Dashboard deleted" });
      },
      onError: () =>
        toast({ title: "Failed to delete dashboard", variant: "destructive" }),
    },
  });

  const handleCreate = () => {
    if (!newName.trim()) return;
    createMutation.mutate({
      data: { name: newName.trim(), description: newDesc || undefined },
    });
  };

  const filteredDashboards = search
    ? dashboards.filter((d) =>
        d.name.toLowerCase().includes(search.toLowerCase()),
      )
    : dashboards;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Dashboard Builder
          </h1>
          <p className="text-muted-foreground mt-1">
            Build and publish metric dashboards for your team
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Dashboard
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search dashboards…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {filteredDashboards.length} dashboard
          {filteredDashboards.length !== 1 ? "s" : ""}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : filteredDashboards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="bg-muted rounded-full p-4 mb-4">
            <LayoutDashboard className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-1">
            {search ? "No dashboards match your search" : "No dashboards yet"}
          </h3>
          <p className="text-muted-foreground text-sm mb-4">
            {search
              ? "Try a different keyword"
              : "Create your first dashboard to visualize metrics for your team"}
          </p>
          {!search && (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Dashboard
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDashboards.map((dashboard) => (
            <div
              key={dashboard.id}
              className="group relative rounded-xl border bg-card hover:shadow-md transition-all"
            >
              <Link href={`/dashboards/${dashboard.id}`} className="block p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="bg-primary/10 text-primary rounded-lg p-2.5">
                    <LayoutDashboard className="h-5 w-5" />
                  </div>
                  <Badge
                    variant={
                      dashboard.status === "published" ? "default" : "secondary"
                    }
                    className="text-xs"
                  >
                    {dashboard.status === "published" ? (
                      <>
                        <Globe className="h-3 w-3 mr-1" />
                        Live
                      </>
                    ) : (
                      <>
                        <FileStack className="h-3 w-3 mr-1" />
                        Draft
                      </>
                    )}
                  </Badge>
                </div>
                <h3 className="font-semibold text-base leading-tight mb-1">
                  {dashboard.name}
                </h3>
                {dashboard.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {dashboard.description}
                  </p>
                )}
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-3">
                  <span className="flex items-center gap-1">
                    <BarChart2 className="h-3.5 w-3.5" />
                    {(dashboard.widgets as unknown[]).length} widget
                    {(dashboard.widgets as unknown[]).length !== 1 ? "s" : ""}
                  </span>
                  <span>
                    Updated{" "}
                    {formatDistanceToNow(new Date(dashboard.updatedAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </Link>
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger
                    asChild
                    onClick={(e) => e.preventDefault()}
                  >
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => setLocation(`/dashboards/${dashboard.id}`)}
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => setDeleteId(dashboard.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Dashboard</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="dash-name">Name</Label>
              <Input
                id="dash-name"
                placeholder="e.g. Sales Overview"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dash-desc">Description (optional)</Label>
              <Textarea
                id="dash-desc"
                placeholder="What does this dashboard track?"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              onClick={handleCreate}
              disabled={!newName.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? "Creating…" : "Create Dashboard"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteId !== null}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete dashboard?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the dashboard and all its widgets.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() =>
                deleteId && deleteMutation.mutate({ id: deleteId })
              }
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
