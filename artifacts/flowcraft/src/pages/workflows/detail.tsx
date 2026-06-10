import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import {
  useGetWorkflow,
  useRunWorkflow,
  useListNodeTypes,
  useDuplicateWorkflow,
  useCreateTemplate,
  usePublishWorkflow,
  useListWorkflowVersions,
  useListWorkflowPromotions,
  getGetWorkflowQueryKey,
  getListExecutionsQueryKey,
  getListWorkflowsQueryKey,
  getListTemplatesQueryKey,
  getListWorkflowVersionsQueryKey,
  getListWorkflowPromotionsQueryKey,
} from "@longox/api-client-react";
import type { Environment, WorkflowPromotion } from "@longox/api-client-react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/badges";
import {
  ArrowLeft,
  Play,
  Settings2,
  Copy,
  BookmarkPlus,
  Rocket,
  History,
  CheckCircle2,
  Clock,
  Globe,
  ArrowRight,
} from "lucide-react";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
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
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow, format } from "date-fns";

const CATEGORIES = [
  "Sales",
  "Support",
  "Data",
  "Reporting",
  "Operations",
  "Developer",
  "Research",
];

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
  const [templateComplexity, setTemplateComplexity] = useState<
    "beginner" | "intermediate" | "advanced"
  >("beginner");
  const [templateTags, setTemplateTags] = useState("");

  const [publishOpen, setPublishOpen] = useState(false);
  const [changeNote, setChangeNote] = useState("");
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);

  const [deployOpen, setDeployOpen] = useState(false);
  const [deployFrom, setDeployFrom] = useState("dev");
  const [deployTo, setDeployTo] = useState("staging");
  const [deployNotes, setDeployNotes] = useState("");

  const { data: workflow, isLoading: isLoadingWf } = useGetWorkflow(
    workflowId,
    {
      query: {
        enabled: !!workflowId,
        queryKey: getGetWorkflowQueryKey(workflowId),
      },
    },
  );

  const { data: nodeTypes = [] } = useListNodeTypes();

  const { data: versions = [], isLoading: versionsLoading } =
    useListWorkflowVersions(workflowId, {
      query: {
        enabled: versionHistoryOpen && !!workflowId,
        queryKey: getListWorkflowVersionsQueryKey(workflowId),
      },
    });

  const { data: promotions = [] } = useListWorkflowPromotions(workflowId, {
    query: {
      enabled: versionHistoryOpen && !!workflowId,
      queryKey: getListWorkflowPromotionsQueryKey(workflowId),
    },
  });

  const { data: environments = [] } = useQuery<Environment[]>({
    queryKey: ["environments"],
    queryFn: () => fetch("/api/environments").then((r) => r.json()),
  });

  const promoteMutation = useMutation<
    WorkflowPromotion,
    Error,
    { fromEnvironment: string; toEnvironment: string; notes: string }
  >({
    mutationFn: ({ fromEnvironment, toEnvironment, notes }) =>
      fetch(`/api/workflows/${workflowId}/promotions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromEnvironment, toEnvironment, notes }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: getListWorkflowPromotionsQueryKey(workflowId),
      });
      setDeployOpen(false);
      setDeployNotes("");
      toast({
        title: `Promoted to ${deployTo}`,
        description: "Workflow deployed successfully.",
      });
    },
    onError: () => toast({ title: "Promotion failed", variant: "destructive" }),
  });

  const runMutation = useRunWorkflow({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getGetWorkflowQueryKey(workflowId),
        });
        queryClient.invalidateQueries({
          queryKey: getListExecutionsQueryKey(),
        });
        toast({ title: "Workflow started successfully" });
      },
      onError: () =>
        toast({ title: "Failed to start workflow", variant: "destructive" }),
    },
  });

  const duplicateMutation = useDuplicateWorkflow({
    mutation: {
      onSuccess: (newWf) => {
        queryClient.invalidateQueries({ queryKey: getListWorkflowsQueryKey() });
        toast({ title: "Workflow duplicated" });
        setLocation(`/workflows/${newWf.id}`);
      },
      onError: () =>
        toast({
          title: "Failed to duplicate workflow",
          variant: "destructive",
        }),
    },
  });

  const saveAsTemplateMutation = useCreateTemplate({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTemplatesQueryKey() });
        toast({
          title: "Saved as template!",
          description: "Find it in the Templates gallery.",
        });
        setSaveAsTemplateOpen(false);
      },
      onError: () =>
        toast({ title: "Failed to save as template", variant: "destructive" }),
    },
  });

  const publishMutation = usePublishWorkflow({
    mutation: {
      onSuccess: (version) => {
        queryClient.invalidateQueries({
          queryKey: getGetWorkflowQueryKey(workflowId),
        });
        queryClient.invalidateQueries({
          queryKey: getListWorkflowVersionsQueryKey(workflowId),
        });
        queryClient.invalidateQueries({ queryKey: getListWorkflowsQueryKey() });
        setPublishOpen(false);
        setChangeNote("");
        toast({
          title: `Published v${version.version}`,
          description: "Workflow is now live and active.",
        });
      },
      onError: () => toast({ title: "Publish failed", variant: "destructive" }),
    },
  });

  const handleSaveAsTemplate = () => {
    if (!workflow) return;
    const tags = templateTags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const nodes = (workflow.nodes ?? []) as Parameters<
      typeof saveAsTemplateMutation.mutate
    >[0]["data"]["nodes"];
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

  const handlePublish = () => {
    publishMutation.mutate({ id: workflowId });
  };

  const handleSaved = () => {
    queryClient.invalidateQueries({
      queryKey: getGetWorkflowQueryKey(workflowId),
    });
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
            <Link href="/workflows">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{workflow.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge status={workflow.status} />
              <span className="text-sm text-muted-foreground border-l pl-2">
                {workflow.triggerType}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground"
            onClick={() => setVersionHistoryOpen(true)}
          >
            <History className="h-4 w-4" />
            History
          </Button>
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
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={runMutation.isPending || workflow.status !== "active"}
            onClick={() => runMutation.mutate({ id: workflow.id })}
          >
            <Play className="h-4 w-4" />
            {runMutation.isPending ? "Starting..." : "Run Now"}
          </Button>
          <Button
            size="sm"
            className="gap-2 bg-primary"
            onClick={() => setPublishOpen(true)}
            disabled={publishMutation.isPending}
          >
            <Rocket className="h-4 w-4" />
            Publish
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-2"
            onClick={() => setDeployOpen(true)}
          >
            <Globe className="h-4 w-4" />
            Deploy
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

      {/* ─── Publish Dialog ────────────────────────────────────────────────── */}
      <Dialog open={publishOpen} onOpenChange={setPublishOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-primary" />
              Publish Workflow
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-lg bg-muted/50 border p-4 space-y-1">
              <p className="text-sm font-medium">{workflow.name}</p>
              <p className="text-xs text-muted-foreground">
                {(workflow.nodes ?? []).length} nodes · {workflow.triggerType}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="change-note">Change note (optional)</Label>
              <Textarea
                id="change-note"
                placeholder="Describe what changed in this version…"
                value={changeNote}
                onChange={(e) => setChangeNote(e.target.value)}
                rows={3}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Publishing creates an immutable version snapshot and marks this
              workflow as <strong>active</strong>.
            </p>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              onClick={handlePublish}
              disabled={publishMutation.isPending}
              className="gap-2"
            >
              <Rocket className="h-4 w-4" />
              {publishMutation.isPending ? "Publishing…" : "Publish Now"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Version History Drawer ───────────────────────────────────────── */}
      <Sheet open={versionHistoryOpen} onOpenChange={setVersionHistoryOpen}>
        <SheetContent className="w-[400px] sm:w-[500px] flex flex-col">
          <SheetHeader className="shrink-0">
            <SheetTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Version History
            </SheetTitle>
            <SheetDescription>
              Published snapshots and deployments of{" "}
              <strong>{workflow.name}</strong>
            </SheetDescription>
          </SheetHeader>

          <Separator className="my-4 shrink-0" />

          <ScrollArea className="flex-1 -mx-6 px-6">
            {/* Published versions */}
            {versionsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-20 rounded-lg bg-muted animate-pulse"
                  />
                ))}
              </div>
            ) : versions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <History className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="font-medium">No published versions yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Click <strong>Publish</strong> to create the first immutable
                  snapshot.
                </p>
              </div>
            ) : (
              <div className="space-y-2 pb-4">
                {[...versions].reverse().map((v, idx) => (
                  <div
                    key={v.id}
                    className="rounded-lg border bg-card p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={v.published ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {v.published && (
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                          )}
                          v{v.version}
                        </Badge>
                        {idx === 0 && (
                          <Badge
                            variant="outline"
                            className="text-xs text-primary border-primary/40"
                          >
                            Latest
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(v.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    {v.changeNote && (
                      <p className="text-sm text-muted-foreground">
                        {v.changeNote}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{(v.nodes as unknown[]).length} nodes</span>
                      <span>·</span>
                      <span>
                        {format(
                          new Date(v.createdAt),
                          "MMM d, yyyy 'at' h:mm a",
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Deployment history */}
            {promotions.length > 0 && (
              <>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-2 mb-3">
                  Deployment History
                </p>
                <div className="space-y-2 pb-4">
                  {promotions.map((p) => (
                    <div
                      key={p.id}
                      className="rounded-lg border bg-muted/30 p-3 flex items-center gap-3"
                    >
                      <div className="flex items-center gap-1.5 text-sm font-medium flex-1 min-w-0">
                        <Badge variant="outline" className="text-xs shrink-0">
                          {p.fromEnvironment}
                        </Badge>
                        <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                        <Badge className="text-xs shrink-0 bg-emerald-600">
                          {p.toEnvironment}
                        </Badge>
                        {p.notes && (
                          <span className="text-xs text-muted-foreground truncate ml-1">
                            {p.notes}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatDistanceToNow(new Date(p.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </ScrollArea>

          <div className="shrink-0 pt-4 border-t flex gap-2">
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => {
                setVersionHistoryOpen(false);
                setDeployOpen(true);
              }}
            >
              <Globe className="h-4 w-4" />
              Deploy
            </Button>
            <Button
              className="flex-1 gap-2"
              onClick={() => {
                setVersionHistoryOpen(false);
                setPublishOpen(true);
              }}
            >
              <Rocket className="h-4 w-4" />
              Publish
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* ─── Deploy / Promote Dialog ──────────────────────────────────────── */}
      <Dialog open={deployOpen} onOpenChange={setDeployOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Deploy Workflow
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-lg bg-muted/50 border p-4 space-y-1">
              <p className="text-sm font-medium">{workflow.name}</p>
              <p className="text-xs text-muted-foreground">
                {(workflow.nodes ?? []).length} nodes · {workflow.triggerType}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>From environment</Label>
                <Select value={deployFrom} onValueChange={setDeployFrom}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {environments.map((e) => (
                      <SelectItem key={e.id} value={e.type}>
                        {e.name}
                      </SelectItem>
                    ))}
                    {environments.length === 0 && (
                      <>
                        <SelectItem value="dev">Development</SelectItem>
                        <SelectItem value="staging">Staging</SelectItem>
                        <SelectItem value="prod">Production</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>To environment</Label>
                <Select value={deployTo} onValueChange={setDeployTo}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {environments.map((e) => (
                      <SelectItem key={e.id} value={e.type}>
                        {e.name}
                      </SelectItem>
                    ))}
                    {environments.length === 0 && (
                      <>
                        <SelectItem value="dev">Development</SelectItem>
                        <SelectItem value="staging">Staging</SelectItem>
                        <SelectItem value="prod">Production</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="deploy-notes">Notes (optional)</Label>
              <Textarea
                id="deploy-notes"
                placeholder="Describe this deployment…"
                value={deployNotes}
                onChange={(e) => setDeployNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              onClick={() =>
                promoteMutation.mutate({
                  fromEnvironment: deployFrom,
                  toEnvironment: deployTo,
                  notes: deployNotes,
                })
              }
              disabled={promoteMutation.isPending || deployFrom === deployTo}
              className="gap-2"
            >
              <Globe className="h-4 w-4" />
              {promoteMutation.isPending
                ? "Deploying…"
                : `Deploy to ${deployTo}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Save as Template Dialog ─────────────────────────────────────── */}
      <Dialog open={saveAsTemplateOpen} onOpenChange={setSaveAsTemplateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Save as Template</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>
                Template Name <span className="text-destructive">*</span>
              </Label>
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
                <Select
                  value={templateCategory}
                  onValueChange={setTemplateCategory}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Complexity</Label>
                <Select
                  value={templateComplexity}
                  onValueChange={(v) =>
                    setTemplateComplexity(v as typeof templateComplexity)
                  }
                >
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
              The workflow's current nodes ({(workflow.nodes ?? []).length}{" "}
              nodes) and trigger type ({workflow.triggerType}) will be saved
              with the template.
            </p>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              onClick={handleSaveAsTemplate}
              disabled={
                !templateName.trim() || saveAsTemplateMutation.isPending
              }
            >
              {saveAsTemplateMutation.isPending ? "Saving..." : "Save Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
