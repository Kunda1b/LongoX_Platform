import { useState } from "react";
import { useLocation } from "wouter";
import { useListTemplates, useUseTemplate, useCreateTemplate, useDeleteTemplate, getListTemplatesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Layers, Activity, Plus, Trash2, X } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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

const CATEGORIES = ["All", "Sales", "Support", "Data", "Reporting", "Operations", "Developer", "Research"];

const TRIGGER_TYPES = ["webhook", "schedule", "form", "email", "manual", "event"];

type CreateFormState = {
  name: string;
  description: string;
  category: string;
  triggerType: string;
  complexity: "beginner" | "intermediate" | "advanced";
  tagsInput: string;
};

const EMPTY_FORM: CreateFormState = {
  name: "",
  description: "",
  category: "Operations",
  triggerType: "webhook",
  complexity: "beginner",
  tagsInput: "",
};

export default function Templates() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<CreateFormState>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  const { data: templates = [], isLoading } = useListTemplates();

  const useMutation = useUseTemplate({
    mutation: {
      onSuccess: (newWorkflow) => {
        toast({ title: "Template applied!" });
        setLocation(`/workflows/${newWorkflow.id}`);
      },
      onError: () => toast({ title: "Failed to apply template", variant: "destructive" }),
    },
  });

  const createMutation = useCreateTemplate({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTemplatesQueryKey() });
        toast({ title: "Template created!" });
        setCreateOpen(false);
        setForm(EMPTY_FORM);
      },
      onError: () => toast({ title: "Failed to create template", variant: "destructive" }),
    },
  });

  const deleteMutation = useDeleteTemplate({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTemplatesQueryKey() });
        toast({ title: "Template deleted" });
        setDeleteTarget(null);
      },
      onError: () => toast({ title: "Failed to delete template", variant: "destructive" }),
    },
  });

  const handleCreate = () => {
    const tags = form.tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    createMutation.mutate({
      data: {
        name: form.name,
        description: form.description,
        category: form.category,
        triggerType: form.triggerType,
        complexity: form.complexity,
        tags,
        nodes: [],
      },
    });
  };

  const filtered = templates.filter((t) => {
    if (category !== "All" && t.category !== category) return false;
    if (
      search &&
      !t.name.toLowerCase().includes(search.toLowerCase()) &&
      !t.description.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  const getComplexityColor = (c: string) => {
    if (c === "beginner") return "bg-green-500/10 text-green-600 hover:bg-green-500/20";
    if (c === "intermediate") return "bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20";
    if (c === "advanced") return "bg-red-500/10 text-red-600 hover:bg-red-500/20";
    return "bg-gray-500/10 text-gray-600";
  };

  const formatUses = (uses: number) => {
    if (uses >= 1000) return `${(uses / 1000).toFixed(1)}k uses`;
    return `${uses} uses`;
  };

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workflow Templates</h1>
          <p className="text-muted-foreground mt-2">Start quickly with pre-built workflows for common tasks.</p>
        </div>
        <Button className="gap-2 shrink-0" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          New Template
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <Tabs value={category} onValueChange={setCategory} className="w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
          <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
            {CATEGORIES.map((c) => (
              <TabsTrigger key={c} value={c} className="px-3 py-1.5 text-sm">
                {c}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Loading templates...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((template) => (
            <Card key={template.id} className="flex flex-col h-full overflow-hidden hover:border-primary/50 transition-colors group">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={getComplexityColor(template.complexity)}>
                      {template.complexity}
                    </Badge>
                    {template.isCustom && (
                      <Badge variant="outline" className="text-[10px] uppercase font-semibold border-primary/40 text-primary bg-primary/5">
                        Custom
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                      <Activity className="h-3 w-3" />
                      {formatUses(template.uses)}
                    </span>
                    {template.isCustom && (
                      <button
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        title="Delete template"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(template.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1 min-h-[40px]">
                  {template.description}
                </p>
              </CardHeader>
              <CardContent className="pb-4 flex-1">
                <div className="flex flex-wrap gap-2 mb-4">
                  {template.tags?.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="text-[10px] uppercase font-semibold text-muted-foreground bg-muted/40"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Layers className="h-4 w-4" />
                    <span>{template.nodeCount} nodes</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                    <span className="truncate max-w-[120px]">{template.triggerType}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-0 mt-auto border-t bg-muted/20 p-4">
                <Button
                  className="w-full font-medium shadow-none hover:shadow-sm"
                  onClick={() => useMutation.mutate({ id: template.id })}
                  disabled={useMutation.isPending}
                >
                  {useMutation.isPending ? "Applying..." : "Use Template"}
                </Button>
              </CardFooter>
            </Card>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full flex min-w-0 flex-1 flex-col items-center justify-center gap-4 text-balance rounded-lg border border-dashed p-6 text-center md:p-12">
              <div className="bg-muted text-foreground flex size-12 shrink-0 items-center justify-center rounded-lg">
                <Layers className="size-6" />
              </div>
              <div className="flex max-w-sm flex-col items-center gap-1 text-center">
                <div className="text-lg font-medium tracking-tight text-foreground">No templates found</div>
                <p className="text-muted-foreground text-sm/relaxed">Try a different category or search term.</p>
              </div>
              <Button variant="outline" onClick={() => { setSearch(""); setCategory("All"); }} className="mt-2">
                Clear filters
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ─── Create Template Dialog ─────────────────────────────────────────── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Custom Template</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Name <span className="text-destructive">*</span></Label>
              <Input
                placeholder="e.g. Daily Digest Email"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                placeholder="What does this workflow do?"
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Category <span className="text-destructive">*</span></Label>
                <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.filter((c) => c !== "All").map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Trigger Type <span className="text-destructive">*</span></Label>
                <Select value={form.triggerType} onValueChange={(v) => setForm((f) => ({ ...f, triggerType: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRIGGER_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Complexity</Label>
              <Select value={form.complexity} onValueChange={(v) => setForm((f) => ({ ...f, complexity: v as CreateFormState["complexity"] }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Tags</Label>
              <Input
                placeholder="email, crm, reporting (comma-separated)"
                value={form.tagsInput}
                onChange={(e) => setForm((f) => ({ ...f, tagsInput: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              onClick={handleCreate}
              disabled={!form.name.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? "Creating..." : "Create Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation ────────────────────────────────────────────── */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this template?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The template will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget !== null && deleteMutation.mutate({ id: deleteTarget })}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
