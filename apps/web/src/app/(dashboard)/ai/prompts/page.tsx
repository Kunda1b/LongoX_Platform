"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  Plus,
  Send,
  RotateCcw,
  History,
  Check,
  X,
  Loader2,
  FlaskConical,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

type Prompt = {
  id: number;
  name: string;
  description: string | null;
  content: string;
  version: number;
  status: string;
  tags: string[] | null;
  createdAt: string;
};

type PromptVersion = {
  id: number;
  promptId: number;
  content: string;
  version: number;
  status: string;
  notes: string | null;
  createdAt: string;
};

type ApprovalRecord = {
  id: number;
  promptId: number;
  version: number;
  requesterId: number | null;
  approverId: number | null;
  status: string;
  comment: string | null;
  decidedAt: string | null;
  createdAt: string;
};

type TestResult = {
  promptId: number;
  version: number;
  provider: string;
  model: string;
  renderedContent: string;
  response: string;
  usage: { inputTokens: number; outputTokens: number };
  cost: number;
  latencyMs: number;
};

export default function PromptsGovernancePage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [testOpen, setTestOpen] = useState(false);
  const [testVars, setTestVars] = useState("");
  const [rollbackVersion, setRollbackVersion] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", description: "", content: "", tags: "" });

  const { data: prompts, isLoading } = useQuery<Prompt[]>({
    queryKey: ["ai-prompts"],
    queryFn: async () => {
      const res = await fetch("/api/prompts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch prompts");
      return res.json();
    },
    enabled: !!token,
  });

  const { data: versions } = useQuery<PromptVersion[]>({
    queryKey: ["prompt-versions", selectedPrompt?.id],
    queryFn: async () => {
      const res = await fetch(`/api/prompts/${selectedPrompt!.id}/versions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch versions");
      return res.json();
    },
    enabled: !!selectedPrompt && versionsOpen,
  });

  const { data: approvals } = useQuery<ApprovalRecord[]>({
    queryKey: ["prompt-approvals", selectedPrompt?.id],
    queryFn: async () => {
      const res = await fetch(`/api/prompts/${selectedPrompt!.id}/approval-history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch approvals");
      return res.json();
    },
    enabled: !!selectedPrompt && versionsOpen,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/prompts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          content: form.content,
          tags: form.tags ? form.tags.split(",").map((t) => t.trim()) : [],
        }),
      });
      if (!res.ok) throw new Error("Failed to create prompt");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-prompts"] });
      setCreateOpen(false);
      setForm({ name: "", description: "", content: "", tags: "" });
      toast({ title: "Prompt created" });
    },
  });

  const submitForReviewMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/prompts/${id}/submit-for-review`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to submit");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-prompts"] });
      toast({ title: "Submitted for review" });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/prompts/${id}/publish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ comment: "Approved via governance UI" }),
      });
      if (!res.ok) throw new Error("Failed to approve");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-prompts"] });
      queryClient.invalidateQueries({ queryKey: ["prompt-versions"] });
      queryClient.invalidateQueries({ queryKey: ["prompt-approvals"] });
      toast({ title: "Prompt approved" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/prompts/${id}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ comment: "Rejected via governance UI" }),
      });
      if (!res.ok) throw new Error("Failed to reject");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-prompts"] });
      toast({ title: "Prompt rejected" });
    },
  });

  const rollbackMutation = useMutation({
    mutationFn: async ({ id, targetVersion }: { id: number; targetVersion: number }) => {
      const res = await fetch(`/api/prompts/${id}/rollback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ targetVersion }),
      });
      if (!res.ok) throw new Error("Failed to rollback");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-prompts"] });
      queryClient.invalidateQueries({ queryKey: ["prompt-versions"] });
      setVersionsOpen(false);
      toast({ title: "Rolled back successfully" });
    },
  });

  const testMutation = useMutation({
    mutationFn: async ({ id, variables }: { id: number; variables?: Record<string, string> }) => {
      const res = await fetch(`/api/prompts/${id}/test`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ variables }),
      });
      if (!res.ok) throw new Error("Failed to test");
      return res.json() as Promise<TestResult>;
    },
    onSuccess: (result) => {
      toast({
        title: "Test completed",
        description: `${result.provider}/${result.model} - ${result.latencyMs}ms - $${result.cost.toFixed(6)}`,
      });
    },
  });

  const handleTest = (id: number) => {
    let variables: Record<string, string> = {};
    if (testVars.trim()) {
      try {
        variables = JSON.parse(testVars);
      } catch {
        toast({ title: "Invalid JSON variables", variant: "destructive" });
        return;
      }
    }
    testMutation.mutate({ id, variables });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "success";
      case "review": return "warning";
      case "rejected": return "destructive";
      default: return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Prompt Governance</h1>
          <p className="text-sm text-muted-foreground">
            Version control, approval workflows, and testing for prompts
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-1 h-4 w-4" /> New Prompt
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Prompt</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g., Data Extraction"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Describe the prompt"
                />
              </div>
              <div>
                <Label>Content</Label>
                <Textarea
                  value={form.content}
                  onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                  placeholder="Use {{variable}} for template variables"
                  className="h-32 font-mono text-sm"
                />
              </div>
              <div>
                <Label>Tags (comma-separated)</Label>
                <Input
                  value={form.tags}
                  onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                  placeholder="extraction, json"
                />
              </div>
              <Button onClick={() => createMutation.mutate()} disabled={!form.name || !form.content}>
                Create
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))
        ) : prompts?.length === 0 ? (
          <div className="col-span-full text-center text-muted-foreground p-8">
            No prompts yet. Create one to get started.
          </div>
        ) : (
          prompts?.map((p) => (
            <Card key={p.id}>
              <CardHeader>
                <FileText className="h-5 w-5 text-primary" />
                <CardTitle className="mt-2 text-sm">{p.name}</CardTitle>
                <CardDescription className="text-xs line-clamp-2">
                  {p.description || "No description"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusColor(p.status) as any}>{p.status}</Badge>
                  <Badge variant="outline">v{p.version}</Badge>
                  {p.tags?.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                  ))}
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  {p.status === "draft" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => submitForReviewMutation.mutate(p.id)}
                    >
                      <Send className="h-3 w-3 mr-1" /> Submit
                    </Button>
                  )}
                  {p.status === "review" && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => approveMutation.mutate(p.id)}
                      >
                        <Check className="h-3 w-3 mr-1" /> Approve
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => rejectMutation.mutate(p.id)}
                      >
                        <X className="h-3 w-3 mr-1" /> Reject
                      </Button>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedPrompt(p);
                      setVersionsOpen(true);
                    }}
                  >
                    <History className="h-3 w-3 mr-1" /> History
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedPrompt(p);
                      setTestOpen(true);
                    }}
                  >
                    <FlaskConical className="h-3 w-3 mr-1" /> Test
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={versionsOpen} onOpenChange={setVersionsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Version History: {selectedPrompt?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4 max-h-[60vh] overflow-y-auto">
            <Tabs defaultValue="versions">
              <TabsList>
                <TabsTrigger value="versions">Versions</TabsTrigger>
                <TabsTrigger value="approvals">Approvals</TabsTrigger>
              </TabsList>
              <TabsContent value="versions" className="space-y-2">
                {versions?.map((v) => (
                  <div key={v.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">v{v.version}</Badge>
                        <Badge variant={getStatusColor(v.status) as any}>{v.status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">{v.content}</p>
                      {v.notes && <p className="text-xs italic text-muted-foreground">{v.notes}</p>}
                    </div>
                    {v.version !== selectedPrompt?.version && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          rollbackMutation.mutate({
                            id: selectedPrompt!.id,
                            targetVersion: v.version,
                          })
                        }
                      >
                        <RotateCcw className="h-3 w-3 mr-1" /> Rollback
                      </Button>
                    )}
                  </div>
                ))}
              </TabsContent>
              <TabsContent value="approvals" className="space-y-2">
                {approvals?.map((a) => (
                  <div key={a.id} className="rounded-lg border p-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">v{a.version}</Badge>
                      <Badge variant={getStatusColor(a.status) as any}>{a.status}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(a.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {a.comment && (
                      <p className="text-xs mt-1 text-muted-foreground">{a.comment}</p>
                    )}
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={testOpen} onOpenChange={setTestOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Test Prompt: {selectedPrompt?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-xs">Current Content</Label>
              <pre className="mt-1 p-3 rounded-lg bg-muted text-xs font-mono whitespace-pre-wrap">
                {selectedPrompt?.content}
              </pre>
            </div>
            <div>
              <Label className="text-xs">Variables (JSON)</Label>
              <Textarea
                value={testVars}
                onChange={(e) => setTestVars(e.target.value)}
                placeholder='{"input": "test data", "fields": "name, email"}'
                className="mt-1 h-20 font-mono text-sm"
              />
            </div>
            <Button
              onClick={() => selectedPrompt && handleTest(selectedPrompt.id)}
              disabled={testMutation.isPending}
            >
              {testMutation.isPending ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <FlaskConical className="mr-1 h-4 w-4" />
              )}
              Run Test
            </Button>
            {testMutation.data && (
              <Card>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="outline">
                      {testMutation.data.provider}/{testMutation.data.model}
                    </Badge>
                    <span className="text-muted-foreground">
                      {testMutation.data.latencyMs}ms
                    </span>
                    <span className="text-muted-foreground">
                      ${testMutation.data.cost.toFixed(6)}
                    </span>
                  </div>
                  <pre className="p-3 rounded-lg bg-muted text-xs font-mono whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {testMutation.data.response}
                  </pre>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
