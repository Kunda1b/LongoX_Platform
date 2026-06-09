import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetWorkflow,
  useRunWorkflow,
  useListNodeTypes,
  useDuplicateWorkflow,
  useCreateTemplate,
  getGetWorkflowQueryKey,
  getListExecutionsQueryKey,
  getListWorkflowsQueryKey,
  getListTemplatesQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/badges";
import { ArrowLeft, Play, Settings2, Copy, BookmarkPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { WorkflowBuilder } from "@/components/workflow-builder";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CATEGORIES = ["Sales", "Support", "Data", "Reporting", "Operations", "Developer", "Research"];

export default function WorkflowDetail() {
  const { id } = useParams<{ id: string }>();
  const workflowId = parseInt(id || "0", 10);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const [saveAsTemplateOpen, setSaveAsTemplateOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateDesc, setTemplateDesc] = useState("");
  const [templateCategory, setTemplateCategory] = useState("Operations");
  const [templateComplexity, setTemplateComplexity] = useState<"beginner" | "intermediate" | "advanced">("beginner");
  const [templateTags, setTemplateTags] = useState("");

  const { data: workflow, isLoading: isLoadingWf } = useGetWorkflow(workflowId, {
    query: { enabled: !!workflowId, queryKey: getGetWorkflowQueryKey(workflowId) },
  });

  const { data: nodeTypes = [] } = useListNodeTypes();

  const runMutation = useRunWorkflow({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetWorkflowQueryKey(workflowId) });
        queryClient.invalidateQueries({ queryKey: getListExecutionsQueryKey() });
        toast({ title: "Workflow started successfully" });
      },
      onError: () => toast({ title: "Failed to start workflow", variant: "destructive" }),
    },
  });

  const duplicateMutation = useDuplicateWorkflow({
    mutation: {
      onSuccess: (newWf) => {
        queryClient.invalidateQueries({ queryKey: getListWorkflowsQueryKey() });
        toast({ title: "Workflow duplicated" });
        setLocation(`/workflows/${newWf.id}`);
      },
      onError: () => toast({ title: "Failed to duplicate workflow", variant: "destructive" }),
    },
  });

  const saveAsTemplateMutation = useCreateTemplate({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTemplatesQueryKey() });
        toast({ title: "Saved as template!", description: "Find it in the Templates gallery." });
        setSaveAsTemplateOpen(false);
      },
      onError: () => toast({ title: "Failed to save as template", variant: "destructive" }),
    },
  });

  const handleSaveAsTemplate = () => {
    if (!workflow) return;
    const tags = templateTags.split(",").map((t) => t.trim()).filter(Boolean);
    const nodes = (workflow.nodes ?? []) as object[];
    saveAsTemplateMutation.mutate({
      data: {
        name: templateName || workflow.name,
        description: templateDesc || workflow.description || "",
        category: templateCategory,
        triggerType: workflow.triggerType,
        complexity: templateComplexity,
        tags,
        nodes,
      },
    });
  };

  const handleSaved = () => {
    queryClient.invalidateQueries({ queryKey: getGetWorkflowQueryKey(workflowId) });
  };

  const openSaveAsTemplate = () => {
    if (workflow) {
      setTemplateName(workflow.name);
      setTemplateDesc(workflow.description ?? "");
    }
    setSaveAsTemplateOpen(true);
  };

  if (isLoadingWf) return <div className="p-8">Loading...</div>;
  if (!workflow) return <div className="p-8">Workflow not found</div>;

  return (
    <div className="h-full flex flex-col">
      <header className="flex items-center justify-between pb-4 border-b shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/workflows"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{workflow.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge status={workflow.status} />
              <span className="text-sm text-muted-foreground border-l pl-2">{workflow.triggerType}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={openSaveAsTemplate}
          >
            <BookmarkPlus className="h-4 w-4" />
            Save as Template
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => duplicateMutation.mutate({ id: workflow.id })}
            disabled={duplicateMutation.isPending}
          >
            <Copy className="h-4 w-4" />
            Duplicate
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Settings2 className="h-4 w-4" />
            Settings
          </Button>
          <Button
            size="sm"
            className="gap-2"
            disabled={runMutation.isPending || workflow.status !== "active"}
            onClick={() => runMutation.mutate({ id: workflow.id })}
          >
            <Play className="h-4 w-4" />
            {runMutation.isPending ? "Starting..." : "Run Now"}
          </Button>
        </div>
      </header>

      <div className="flex-1 mt-4 min-h-0">
        <WorkflowBuilder
          workflowId={workflow.id}
          initialNodes={workflow.nodes ?? []}
          nodeTypesList={nodeTypes}
          onSaved={handleSaved}
        />
      </div>

      {/* ─── Save as Template Dialog ─────────────────────────────────────── */}
      <Dialog open={saveAsTemplateOpen} onOpenChange={setSaveAsTemplateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Save as Template</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Template Name <span className="text-destructive">*</span></Label>
              <Input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g. My Onboarding Flow"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                rows={3}
                value={templateDesc}
                onChange={(e) => setTemplateDesc(e.target.value)}
                placeholder="Describe what this workflow does…"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={templateCategory} onValueChange={setTemplateCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Complexity</Label>
                <Select value={templateComplexity} onValueChange={(v) => setTemplateComplexity(v as typeof templateComplexity)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Tags</Label>
              <Input
                placeholder="email, crm, automation (comma-separated)"
                value={templateTags}
                onChange={(e) => setTemplateTags(e.target.value)}
              />
            </div>

            <p className="text-xs text-muted-foreground">
              The workflow's current nodes ({(workflow.nodes ?? []).length} nodes) and trigger type ({workflow.triggerType}) will be saved with the template.
            </p>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              onClick={handleSaveAsTemplate}
              disabled={!templateName.trim() || saveAsTemplateMutation.isPending}
            >
              {saveAsTemplateMutation.isPending ? "Saving..." : "Save Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
