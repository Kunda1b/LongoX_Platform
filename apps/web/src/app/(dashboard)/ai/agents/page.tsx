"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Bot,
  Play,
  Loader2,
  Brain,
  Wrench,
  Route,
  Database,
  Plus,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

interface AgentRunResult {
  id: string;
  name: string;
  role: string;
  status: string;
  config: {
    model: string;
    provider: string;
    maxIterations: number;
    temperature: number;
    memoryEnabled: boolean;
    planningEnabled: boolean;
    tools: string[];
  };
  context: {
    workflowId: string;
    executionId: string;
    variables: Record<string, unknown>;
  };
  startedAt: string;
}

interface AgentMemory {
  id: string;
  agentId: string;
  memoryType: string;
  key: string;
  content: string;
  createdAt: string;
}

const AGENT_ROLES = ["orchestrator", "executor", "observer", "planner", "reviewer"];

const PROVIDERS = ["openai", "anthropic", "google", "mistral", "groq", "deepseek"];

const BUILT_IN_TOOLS = [
  { name: "web_search", description: "Search the web for information" },
  { name: "code_execute", description: "Execute code snippets" },
  { name: "file_read", description: "Read file contents" },
  { name: "file_write", description: "Write to files" },
  { name: "http_request", description: "Make HTTP requests" },
  { name: "database_query", description: "Query databases" },
  { name: "email_send", description: "Send emails" },
];

export default function AgentsPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    systemPrompt: "",
    role: "executor",
    model: "gpt-4o-mini",
    provider: "openai",
    maxIterations: 10,
    temperature: 0.7,
    memoryEnabled: true,
    memoryType: "short_term",
    planningEnabled: false,
    tools: [] as string[],
    goal: "",
    variables: "",
  });
  const [runs, setRuns] = useState<AgentRunResult[]>([]);

  const { data: memory } = useQuery<AgentMemory[]>({
    queryKey: ["agent-memory"],
    queryFn: async () => {
      const res = await fetch("/api/agents/memory", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch memory");
      return res.json();
    },
    enabled: !!token,
  });

  const runMutation = useMutation({
    mutationFn: async () => {
      let variables: Record<string, unknown> = {};
      if (form.variables.trim()) {
        try {
          variables = JSON.parse(form.variables);
        } catch {
          throw new Error("Invalid JSON in variables");
        }
      }

      const res = await fetch("/api/agents/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name || "Agent",
          systemPrompt: form.systemPrompt,
          role: form.role,
          model: form.model,
          provider: form.provider,
          maxIterations: form.maxIterations,
          temperature: form.temperature,
          memoryEnabled: form.memoryEnabled,
          planningEnabled: form.planningEnabled,
          tools: form.tools,
          variables,
          goal: form.goal,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to run agent");
      }
      return res.json() as Promise<AgentRunResult>;
    },
    onSuccess: (result) => {
      setRuns((prev) => [result, ...prev]);
      toast({ title: "Agent run started", description: `Agent ${result.name} is running` });
    },
    onError: (err) => {
      toast({ title: "Agent run failed", description: err.message, variant: "destructive" });
    },
  });

  const deleteMemoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/agents/memory/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      toast({ title: "Memory entry deleted" });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agent Runtime</h1>
          <p className="text-sm text-muted-foreground">
            AI agents with memory, tool calling, and multi-step planning
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-1 h-4 w-4" /> New Agent
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Configure Agent</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g., Data Analyst"
                  />
                </div>
                <div>
                  <Label>Role</Label>
                  <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AGENT_ROLES.map((r) => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>System Prompt</Label>
                <Textarea
                  value={form.systemPrompt}
                  onChange={(e) => setForm((f) => ({ ...f, systemPrompt: e.target.value }))}
                  placeholder="You are a helpful AI agent that..."
                  className="h-24"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Model</Label>
                  <Select value={form.model} onValueChange={(v) => setForm((f) => ({ ...f, model: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                      <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                      <SelectItem value="claude-sonnet-4-20250514">Claude Sonnet 4</SelectItem>
                      <SelectItem value="claude-3-haiku-20240307">Claude 3 Haiku</SelectItem>
                      <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash</SelectItem>
                      <SelectItem value="mistral-large-latest">Mistral Large</SelectItem>
                      <SelectItem value="llama-3.3-70b-versatile">Llama 3.3 70B</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Provider</Label>
                  <Select value={form.provider} onValueChange={(v) => setForm((f) => ({ ...f, provider: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROVIDERS.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Max Iterations</Label>
                  <Input
                    type="number"
                    value={form.maxIterations}
                    onChange={(e) => setForm((f) => ({ ...f, maxIterations: parseInt(e.target.value) }))}
                    min="1"
                    max="50"
                  />
                </div>
                <div>
                  <Label>Temperature</Label>
                  <Input
                    type="number"
                    value={form.temperature}
                    onChange={(e) => setForm((f) => ({ ...f, temperature: parseFloat(e.target.value) }))}
                    min="0"
                    max="2"
                    step="0.1"
                  />
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={form.memoryEnabled}
                    onCheckedChange={(v) => setForm((f) => ({ ...f, memoryEnabled: v }))}
                  />
                  <Label className="text-sm">Memory</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={form.planningEnabled}
                    onCheckedChange={(v) => setForm((f) => ({ ...f, planningEnabled: v }))}
                  />
                  <Label className="text-sm">Planning</Label>
                </div>
              </div>
              {form.memoryEnabled && (
                <div>
                  <Label>Memory Type</Label>
                  <Select
                    value={form.memoryType}
                    onValueChange={(v) => setForm((f) => ({ ...f, memoryType: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short_term">Short-term</SelectItem>
                      <SelectItem value="long_term">Long-term</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label>Tools</Label>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  {BUILT_IN_TOOLS.map((t) => (
                    <label key={t.name} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={form.tools.includes(t.name)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setForm((f) => ({ ...f, tools: [...f.tools, t.name] }));
                          } else {
                            setForm((f) => ({ ...f, tools: f.tools.filter((x) => x !== t.name) }));
                          }
                        }}
                      />
                      <span>{t.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <Label>Goal</Label>
                <Input
                  value={form.goal}
                  onChange={(e) => setForm((f) => ({ ...f, goal: e.target.value }))}
                  placeholder="What should the agent accomplish?"
                />
              </div>
              <div>
                <Label>Variables (JSON)</Label>
                <Textarea
                  value={form.variables}
                  onChange={(e) => setForm((f) => ({ ...f, variables: e.target.value }))}
                  placeholder='{"input": "data to process"}'
                  className="h-20 font-mono text-sm"
                />
              </div>
              <Button
                onClick={() => runMutation.mutate()}
                disabled={runMutation.isPending || !form.systemPrompt}
              >
                {runMutation.isPending ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : (
                  <Play className="mr-1 h-4 w-4" />
                )}
                Run Agent
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Agent Runs</h2>
          {runs.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No agent runs yet. Create and run an agent to get started.</p>
              </CardContent>
            </Card>
          ) : (
            runs.map((run) => (
              <Card key={run.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Bot className="h-4 w-4" />
                      {run.name}
                    </CardTitle>
                    <Badge variant={run.status === "running" ? "success" : "secondary"}>
                      {run.status}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    {run.config.provider}/{run.config.model}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Badge variant="outline">{run.role}</Badge>
                    {run.config.planningEnabled && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Route className="h-3 w-3" /> planning
                      </Badge>
                    )}
                    {run.config.memoryEnabled && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Database className="h-3 w-3" /> memory
                      </Badge>
                    )}
                    {run.config.tools.length > 0 && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Wrench className="h-3 w-3" /> {run.config.tools.length} tools
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Started: {new Date(run.startedAt).toLocaleTimeString()}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Agent Memory</h2>
          {memory && memory.length > 0 ? (
            <div className="space-y-2">
              {memory.map((m) => (
                <Card key={m.id}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{m.memoryType}</Badge>
                          <span className="text-xs font-medium">{m.key}</span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{m.content}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMemoryMutation.mutate(m.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No memory entries yet.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
