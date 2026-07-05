"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bot,
  Send,
  Loader2,
  Clock,
  DollarSign,
  Zap,
  BarChart3,
  GitCompare,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

interface PlaygroundResult {
  id: string;
  provider: string;
  model: string;
  response: string;
  usage: { inputTokens: number; outputTokens: number; totalTokens: number };
  cost: number;
  latencyMs: number;
  createdAt: string;
}

interface CompareResult {
  provider: string;
  model: string;
  response: string | null;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  latencyMs: number;
  status: "success" | "failed";
  error?: string;
}

interface AIModel {
  id: string;
  provider: string;
  name: string;
  modelId: string;
  contextWindow: number;
  isEnabled: boolean;
}

export default function AIPlaygroundPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [systemPrompt, setSystemPrompt] = useState(
    "You are a helpful assistant.",
  );
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [temperature, setTemperature] = useState("0.7");
  const [maxTokens, setMaxTokens] = useState("1024");
  const [messages, setMessages] = useState<
    Array<{ role: string; content: string; meta?: any }>
  >([]);
  const [compareMode, setCompareMode] = useState(false);
  const [compareModels, setCompareModels] = useState<string[]>([]);

  const { data: models, isLoading: modelsLoading } = useQuery<AIModel[]>({
    queryKey: ["ai-models"],
    queryFn: async () => {
      const res = await fetch("/api/ai-models", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch models");
      return res.json();
    },
    enabled: !!token,
  });

  const runMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/ai/playground/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt,
          systemPrompt,
          modelId: selectedModel || undefined,
          provider: selectedProvider || undefined,
          temperature: parseFloat(temperature),
          maxTokens: parseInt(maxTokens),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to run");
      }
      return res.json() as Promise<PlaygroundResult>;
    },
    onSuccess: (result) => {
      setMessages((prev) => [
        ...prev,
        { role: "user", content: prompt },
        {
          role: "assistant",
          content: result.response,
          meta: {
            provider: result.provider,
            model: result.model,
            tokens: result.usage.totalTokens,
            cost: result.cost,
            latency: result.latencyMs,
          },
        },
      ]);
      setPrompt("");
    },
    onError: (err) => {
      toast({
        title: "Run failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const compareMutation = useMutation({
    mutationFn: async () => {
      const modelsToCompare = compareModels.map((m) => {
        const [provider, ...modelParts] = m.split("/");
        return { provider, modelId: modelParts.join("/") };
      });
      const res = await fetch("/api/ai/playground/compare", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt,
          systemPrompt,
          models: modelsToCompare,
          temperature: parseFloat(temperature),
          maxTokens: parseInt(maxTokens),
        }),
      });
      if (!res.ok) throw new Error("Failed to compare");
      return res.json() as Promise<{ results: CompareResult[] }>;
    },
    onSuccess: (result) => {
      setMessages((prev) => [
        ...prev,
        { role: "user", content: prompt },
        {
          role: "assistant",
          content: "Model comparison results",
          meta: { compare: true, results: result.results },
        },
      ]);
      setPrompt("");
    },
    onError: (err) => {
      toast({
        title: "Compare failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const handleSend = () => {
    if (!prompt.trim()) return;
    if (compareMode && compareModels.length > 0) {
      compareMutation.mutate();
    } else {
      runMutation.mutate();
    }
  };

  const isLoading = runMutation.isPending || compareMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Playground</h1>
          <p className="text-sm text-muted-foreground">
            Test prompts, compare models, and measure performance
          </p>
        </div>
        <Button
          variant={compareMode ? "default" : "outline"}
          onClick={() => setCompareMode(!compareMode)}
        >
          <GitCompare className="mr-1 h-4 w-4" />
          {compareMode ? "Compare Mode On" : "Compare Models"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs">System Prompt</Label>
                <Textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  className="mt-1 h-20 text-sm"
                />
              </div>
              {!compareMode ? (
                <div>
                  <Label className="text-xs">Model</Label>
                  <Select
                    value={selectedModel}
                    onValueChange={(v) => {
                      setSelectedModel(v);
                      const m = models?.find((m) => m.modelId === v);
                      if (m) setSelectedProvider(m.provider);
                    }}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      {models
                        ?.filter((m) => m.isEnabled)
                        .map((m) => (
                          <SelectItem key={m.modelId} value={m.modelId}>
                            {m.name} ({m.provider})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div>
                  <Label className="text-xs">Models to Compare</Label>
                  <div className="mt-1 space-y-2">
                    {models
                      ?.filter((m) => m.isEnabled)
                      .map((m) => (
                        <label
                          key={m.modelId}
                          className="flex items-center gap-2 text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={compareModels.includes(
                              `${m.provider}/${m.modelId}`,
                            )}
                            onChange={(e) => {
                              const key = `${m.provider}/${m.modelId}`;
                              if (e.target.checked) {
                                setCompareModels((prev) => [...prev, key]);
                              } else {
                                setCompareModels((prev) =>
                                  prev.filter((k) => k !== key),
                                );
                              }
                            }}
                            className="rounded"
                          />
                          {m.name} ({m.provider})
                        </label>
                      ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Temperature</Label>
                  <Input
                    type="number"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                    min="0"
                    max="2"
                    step="0.1"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Max Tokens</Label>
                  <Input
                    type="number"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(e.target.value)}
                    min="1"
                    max="4096"
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="flex flex-col h-[700px]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Bot className="h-4 w-4" /> Chat
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto space-y-4">
              {messages.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-12">
                  Send a message to test the AI model
                </p>
              )}
              {messages.map((m, i) => (
                <div key={i} className="space-y-2">
                  <div
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`rounded-lg px-4 py-2 max-w-[85%] text-sm ${
                        m.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                  {m.meta && !m.meta.compare && (
                    <div className="flex items-center gap-3 text-xs text-muted-foreground ml-2">
                      <span className="flex items-center gap-1">
                        <Bot className="h-3 w-3" /> {m.meta.provider}/
                        {m.meta.model}
                      </span>
                      <span className="flex items-center gap-1">
                        <Zap className="h-3 w-3" /> {m.meta.tokens} tokens
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" /> $
                        {m.meta.cost.toFixed(6)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {m.meta.latency}ms
                      </span>
                    </div>
                  )}
                  {m.meta?.compare && (
                    <div className="ml-2 space-y-2">
                      <div className="text-xs font-medium text-muted-foreground">
                        Model Comparison Results:
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {m.meta.results.map((r: CompareResult, j: number) => (
                          <Card key={j} className="text-xs">
                            <CardContent className="p-3 space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">
                                  {r.provider}/{r.model}
                                </span>
                                <Badge
                                  variant={
                                    r.status === "success"
                                      ? "success"
                                      : "destructive"
                                  }
                                >
                                  {r.status}
                                </Badge>
                              </div>
                              {r.response && (
                                <p className="text-muted-foreground line-clamp-3">
                                  {r.response}
                                </p>
                              )}
                              <div className="flex items-center gap-3 text-muted-foreground">
                                <span>{r.latencyMs}ms</span>
                                <span>${r.cost.toFixed(6)}</span>
                                <span>
                                  {r.inputTokens + r.outputTokens} tokens
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="rounded-lg px-4 py-2 bg-muted text-sm flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Thinking...
                  </div>
                </div>
              )}
            </CardContent>
            <div className="border-t p-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex gap-2"
              >
                <Input
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Type your prompt..."
                  className="flex-1"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={isLoading || !prompt.trim()}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
