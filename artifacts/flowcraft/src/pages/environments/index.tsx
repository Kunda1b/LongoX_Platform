import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Environment } from "@workspace/api-client-react";
import {
  useCreateEnvironment,
  useDeleteEnvironment,
  useUpdateEnvironment,
  getListEnvironmentsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Globe, Server, Code2, GitBranch, ShieldCheck } from "lucide-react";

const ENV_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  dev: { label: "Development", color: "text-blue-600", bg: "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800", icon: Code2 },
  staging: { label: "Staging", color: "text-amber-600", bg: "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800", icon: Server },
  prod: { label: "Production", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800", icon: Globe },
};

interface EnvFormState { name: string; type: string; description: string }

const EMPTY_FORM: EnvFormState = { name: "", type: "dev", description: "" };

export default function EnvironmentsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: environments = [], isLoading } = useQuery<Environment[]>({
    queryKey: getListEnvironmentsQueryKey(),
    queryFn: () => fetch("/api/environments").then((r) => r.json()),
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [editEnv, setEditEnv] = useState<Environment | null>(null);
  const [deleteEnv, setDeleteEnv] = useState<Environment | null>(null);
  const [form, setForm] = useState<EnvFormState>(EMPTY_FORM);

  const createMutation = useCreateEnvironment({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListEnvironmentsQueryKey() });
        setCreateOpen(false);
        setForm(EMPTY_FORM);
        toast({ title: "Environment created" });
      },
    },
  });

  const updateMutation = useUpdateEnvironment({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListEnvironmentsQueryKey() });
        setEditEnv(null);
        toast({ title: "Environment updated" });
      },
    },
  });

  const deleteMutation = useDeleteEnvironment({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListEnvironmentsQueryKey() });
        setDeleteEnv(null);
        toast({ title: "Environment deleted" });
      },
    },
  });

  function handleCreate() {
    if (!form.name.trim()) return;
    createMutation.mutate({ data: { name: form.name, type: form.type, description: form.description } });
  }

  function handleUpdate() {
    if (!editEnv || !form.name.trim()) return;
    updateMutation.mutate({ id: editEnv.id, data: { name: form.name, type: form.type, description: form.description } });
  }

  function openEdit(env: Environment) {
    setEditEnv(env);
    setForm({ name: env.name, type: env.type, description: env.description ?? "" });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Environments</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage deployment environments for workflow promotion (dev → staging → prod).
          </p>
        </div>
        <Button onClick={() => { setForm(EMPTY_FORM); setCreateOpen(true); }} className="gap-2">
          <Plus size={16} />
          New Environment
        </Button>
      </div>

      {/* Promotion flow diagram */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/40 rounded-lg px-4 py-3">
        <Code2 size={14} className="text-blue-500 flex-shrink-0" />
        <span className="font-medium text-blue-600">Development</span>
        <span className="mx-1">→</span>
        <Server size={14} className="text-amber-500 flex-shrink-0" />
        <span className="font-medium text-amber-600">Staging</span>
        <span className="mx-1">→</span>
        <Globe size={14} className="text-emerald-500 flex-shrink-0" />
        <span className="font-medium text-emerald-600">Production</span>
        <span className="ml-auto flex items-center gap-1.5">
          <ShieldCheck size={13} />
          Promote workflows from Workflow detail page
        </span>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-40" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {environments.map((env) => {
            const cfg = ENV_CONFIG[env.type] ?? ENV_CONFIG.dev;
            const Icon = cfg.icon;
            return (
              <Card key={env.id} className={`border ${cfg.bg} transition-all`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg bg-white/60 dark:bg-black/20`}>
                        <Icon size={18} className={cfg.color} />
                      </div>
                      <div>
                        <CardTitle className="text-base">{env.name}</CardTitle>
                        <Badge variant="outline" className={`mt-0.5 text-xs ${cfg.color} border-current/30`}>
                          {cfg.label}
                        </Badge>
                      </div>
                    </div>
                    {env.isDefault && (
                      <Badge variant="secondary" className="text-xs">Default</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                    {env.description ?? "No description."}
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <GitBranch size={13} />
                      <span>{env.workflowCount} workflow{env.workflowCount !== 1 ? "s" : ""} promoted</span>
                    </div>
                    {!env.isDefault && (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(env)}>
                          <Pencil size={13} />
                        </Button>
                        <Button
                          variant="ghost" size="sm"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          onClick={() => setDeleteEnv(env)}
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Environment</DialogTitle>
          </DialogHeader>
          <EnvForm form={form} onChange={setForm} />
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleCreate} disabled={!form.name.trim() || createMutation.isPending}>
              {createMutation.isPending ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editEnv} onOpenChange={(o) => !o && setEditEnv(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Environment</DialogTitle>
          </DialogHeader>
          <EnvForm form={form} onChange={setForm} />
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleUpdate} disabled={!form.name.trim() || updateMutation.isPending}>
              {updateMutation.isPending ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteEnv} onOpenChange={(o) => !o && setDeleteEnv(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete environment?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteEnv?.name}" will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => deleteEnv && deleteMutation.mutate({ id: deleteEnv.id })}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function EnvForm({ form, onChange }: { form: EnvFormState; onChange: (f: EnvFormState) => void }) {
  return (
    <div className="space-y-4 py-2">
      <div className="space-y-1.5">
        <Label htmlFor="env-name">Name</Label>
        <Input
          id="env-name"
          placeholder="e.g. Production EU"
          value={form.name}
          onChange={(e) => onChange({ ...form, name: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="env-type">Type</Label>
        <Select value={form.type} onValueChange={(v) => onChange({ ...form, type: v })}>
          <SelectTrigger id="env-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="dev">Development</SelectItem>
            <SelectItem value="staging">Staging</SelectItem>
            <SelectItem value="prod">Production</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="env-desc">Description <span className="text-muted-foreground">(optional)</span></Label>
        <Textarea
          id="env-desc"
          placeholder="Describe this environment…"
          rows={3}
          value={form.description}
          onChange={(e) => onChange({ ...form, description: e.target.value })}
        />
      </div>
    </div>
  );
}
