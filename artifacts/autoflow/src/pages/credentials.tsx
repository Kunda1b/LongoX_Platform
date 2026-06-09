import { useState } from "react";
import { useListCredentials, getListCredentialsQueryKey, useCreateCredential, useDeleteCredential } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { KeyRound, Plus, Trash2, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function CredentialsPage() {
  const qc = useQueryClient();
  const creds = useListCredentials();
  const createMut = useCreateCredential();
  const deleteMut = useDeleteCredential();

  const [createOpen, setCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", connectorId: 1, connectorName: "Slack" });

  function handleCreate() {
    createMut.mutate(
      { data: { name: form.name, connectorId: form.connectorId, connectorName: form.connectorName, fields: [] } },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListCredentialsQueryKey() });
          setCreateOpen(false);
          setForm({ name: "", connectorId: 1, connectorName: "Slack" });
        },
      }
    );
  }

  function handleDelete() {
    if (!deleteId) return;
    deleteMut.mutate(
      { id: deleteId },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListCredentialsQueryKey() });
          setDeleteId(null);
        },
      }
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Credentials</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Saved connector authentication credentials</p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" /> Add Credential
        </Button>
      </div>

      {creds.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
        </div>
      ) : (creds.data ?? []).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <KeyRound className="w-10 h-10 text-muted-foreground/40 mb-3" />
          <p className="font-medium text-sm">No credentials yet</p>
          <p className="text-xs text-muted-foreground mt-1">Save connector credentials to use them in your workflows.</p>
          <Button size="sm" className="mt-4" onClick={() => setCreateOpen(true)}>Add Credential</Button>
        </div>
      ) : (
        <div className="space-y-2">
          {(creds.data ?? []).map((c: { id: number; name: string; connectorName: string; fields: string[]; createdAt: string }) => (
            <Card key={c.id}>
              <CardContent className="py-3.5 px-4 flex items-center gap-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10 text-primary shrink-0">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{c.name}</span>
                    <Badge variant="secondary" className="text-xs">{c.connectorName}</Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-muted-foreground">
                      {(c.fields ?? []).length} field{(c.fields ?? []).length !== 1 ? "s" : ""} stored
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Added {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => setDeleteId(c.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Credential</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="cred-name">Name</Label>
              <Input id="cred-name" placeholder="e.g. Slack Production" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cred-connector">Connector</Label>
              <Input id="cred-connector" placeholder="Connector name" value={form.connectorName} onChange={(e) => setForm((f) => ({ ...f, connectorName: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button disabled={!form.name || createMut.isPending} onClick={handleCreate}>
              {createMut.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete credential?</AlertDialogTitle>
            <AlertDialogDescription>This credential will be permanently removed. Workflows using it will fail.</AlertDialogDescription>
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
