import { useState, useRef } from "react";
import { useListAiModels } from "@longox/api-client-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  BrainCircuit,
  Play,
  Loader2,
  Copy,
  Check,
  Clock,
  Coins,
  Hash,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  RotateCcw,
  Braces,
  AlignLeft,
} from "lucide-react";

const BASE = "/api";

interface RunResult {
  id: string;
  model: string;
  output: unknown;
  usage: { inputTokens: number; outputTokens: number; totalTokens: number };
  cost: number;
  durationMs: number;
  finishReason: string;
  createdAt: string;
  error?: string;
  systemPrompt: string;
  userMessage: string;
}

function fmtCost(c: number) {
  if (c === 0) return "$0.000000";
  if (c < 0.000001) return `$${(c * 1e9).toFixed(3)}n`;
  if (c < 0.001) return `$${(c * 1e6).toFixed(4)}μ`;
  return `$${c.toFixed(6)}`;
}

function fmtMs(ms: number) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function prettyOutput(
  output: unknown,
  responseFormat: "text" | "json",
): string {
  if (responseFormat === "json") {
    try {
      return JSON.stringify(output, null, 2);
    } catch {
      return String(output);
    }
  }
  return String(output ?? "");
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={handleCopy}
          className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent>{copied ? "Copied!" : "Copy"}</TooltipContent>
    </Tooltip>
  );
}

function RunCard({ run, index }: { run: RunResult; index: number }) {
  const [expanded, setExpanded] = useState(index === 0);
  const outputText = run.error
    ? run.error
    : prettyOutput(
        run.output,
        typeof run.output === "string" ? "text" : "json",
      );
  const isError = !!run.error;

  return (
    <Card
      className={`border ${isError ? "border-destructive/40" : "border-border"}`}
    >
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
        onClick={() => setExpanded((v) => !v)}
      >
        <div
          className={`h-2 w-2 rounded-full shrink-0 ${isError ? "bg-destructive" : "bg-green-500"}`}
        />
        <span className="font-mono text-xs text-muted-foreground shrink-0">
          #{index + 1}
        </span>
        <Badge variant="outline" className="text-xs font-mono shrink-0">
          {run.model}
        </Badge>
        <span className="text-sm truncate flex-1 text-muted-foreground">
          {run.userMessage.length > 80
            ? run.userMessage.slice(0, 80) + "…"
            : run.userMessage}
        </span>
        <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {fmtMs(run.durationMs)}
          </span>
          <span className="flex items-center gap-1">
            <Hash className="h-3 w-3" />
            {run.usage?.totalTokens ?? "—"}
          </span>
          <span className="flex items-center gap-1">
            <Coins className="h-3 w-3" />
            {fmtCost(run.cost ?? 0)}
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </div>

      {expanded && (
        <div className="border-t">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border">
            {[
              {
                label: "Input tokens",
                value: String(run.usage?.inputTokens ?? "—"),
              },
              {
                label: "Output tokens",
                value: String(run.usage?.outputTokens ?? "—"),
              },
              { label: "Duration", value: fmtMs(run.durationMs) },
              { label: "Cost", value: fmtCost(run.cost ?? 0) },
            ].map(({ label, value }) => (
              <div key={label} className="bg-card px-4 py-3">
                <div className="text-xs text-muted-foreground">{label}</div>
                <div className="font-mono text-sm font-semibold mt-0.5">
                  {value}
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {isError ? "Error" : "Output"}
                </span>
                {!isError && <CopyButton text={outputText} />}
              </div>
              <pre
                className={`text-sm rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-words font-mono leading-relaxed max-h-96 overflow-y-auto ${
                  isError
                    ? "bg-destructive/10 text-destructive border border-destructive/20"
                    : "bg-muted/50 border border-border"
                }`}
              >
                {outputText || "(empty response)"}
              </pre>
            </div>

            {run.finishReason && !isError && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Finish reason:</span>
                <Badge variant="outline" className="text-xs">
                  {run.finishReason}
                </Badge>
                <span className="ml-auto">
                  {new Date(run.createdAt).toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

export default function AiPlaygroundPage() {
  const { data: models = [] } = useListAiModels();
  const enabledModels = models.filter((m) => m.isEnabled);

  const [selectedModel, setSelectedModel] = useState("gpt-4o-mini");
  const [systemPrompt, setSystemPrompt] = useState(
    "You are a helpful assistant.",
  );
  const [userMessage, setUserMessage] = useState("");
  const [responseFormat, setResponseFormat] = useState<"text" | "json">("text");
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1024);
  const [isRunning, setIsRunning] = useState(false);
  const [runs, setRuns] = useState<RunResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  async function handleRun() {
    if (!userMessage.trim() || isRunning) return;
    setIsRunning(true);
    setError(null);

    try {
      const res = await fetch(`${BASE}/ai/runs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: selectedModel,
          systemPrompt,
          userMessage,
          temperature,
          maxTokens,
          responseFormat,
        }),
      });

      const data = await res.json();

      const run: RunResult = {
        id: data.id ?? `local-${Date.now()}`,
        model: data.model ?? selectedModel,
        output: data.output ?? data.error ?? null,
        usage: data.usage ?? {
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
        },
        cost: data.cost ?? 0,
        durationMs: data.durationMs ?? 0,
        finishReason: data.finishReason ?? "stop",
        createdAt: data.createdAt ?? new Date().toISOString(),
        systemPrompt,
        userMessage,
        ...(res.ok ? {} : { error: data.error ?? "Unknown error" }),
      };

      setRuns((prev) => [run, ...prev]);

      setTimeout(() => {
        outputRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setIsRunning(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleRun();
    }
  }

  const totalTokens = runs.reduce((s, r) => s + (r.usage?.totalTokens ?? 0), 0);
  const totalCost = runs.reduce((s, r) => s + (r.cost ?? 0), 0);

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Playground</h1>
          <p className="text-muted-foreground mt-2">
            Test prompts against any configured model. All runs are recorded and
            tracked for billing.
          </p>
        </div>
        {runs.length > 0 && (
          <div className="flex items-center gap-4 text-sm text-muted-foreground shrink-0">
            <span className="flex items-center gap-1.5">
              <Hash className="h-3.5 w-3.5" />
              {totalTokens.toLocaleString()} tokens
            </span>
            <span className="flex items-center gap-1.5">
              <Coins className="h-3.5 w-3.5" />
              {fmtCost(totalCost)} session
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left: Controls ── */}
        <div className="lg:col-span-1 space-y-5">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BrainCircuit className="h-4 w-4 text-primary" />
                Model
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select model…" />
                </SelectTrigger>
                <SelectContent>
                  {enabledModels.length === 0 ? (
                    <SelectItem value="gpt-4o-mini">
                      GPT-4o Mini (default)
                    </SelectItem>
                  ) : (
                    enabledModels.map((m) => (
                      <SelectItem key={m.id} value={m.modelId}>
                        <span className="font-medium">{m.name}</span>
                        <span className="text-muted-foreground ml-1.5 text-xs">
                          {m.provider}
                        </span>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Response format</Label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setResponseFormat("text")}
                    className={`flex items-center justify-center gap-1.5 text-sm py-2 rounded-md border transition-colors ${
                      responseFormat === "text"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    <AlignLeft className="h-3.5 w-3.5" />
                    Text
                  </button>
                  <button
                    onClick={() => setResponseFormat("json")}
                    className={`flex items-center justify-center gap-1.5 text-sm py-2 rounded-md border transition-colors ${
                      responseFormat === "json"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    <Braces className="h-3.5 w-3.5" />
                    JSON
                  </button>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Temperature</Label>
                    <span className="text-xs font-mono text-muted-foreground">
                      {temperature.toFixed(1)}
                    </span>
                  </div>
                  <Slider
                    min={0}
                    max={2}
                    step={0.1}
                    value={[temperature]}
                    onValueChange={([v]) => setTemperature(v)}
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Precise</span>
                    <span>Balanced</span>
                    <span>Creative</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Max tokens</Label>
                    <span className="text-xs font-mono text-muted-foreground">
                      {maxTokens.toLocaleString()}
                    </span>
                  </div>
                  <Slider
                    min={64}
                    max={4096}
                    step={64}
                    value={[maxTokens]}
                    onValueChange={([v]) => setMaxTokens(v)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {runs.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">
                  Session Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { label: "Runs", value: String(runs.length) },
                  {
                    label: "Total tokens",
                    value: totalTokens.toLocaleString(),
                  },
                  { label: "Session cost", value: fmtCost(totalCost) },
                  {
                    label: "Errors",
                    value: String(runs.filter((r) => r.error).length),
                  },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex justify-between items-center text-sm"
                  >
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-mono font-medium">{value}</span>
                  </div>
                ))}
                <Separator className="my-1" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full gap-2 text-muted-foreground"
                  onClick={() => setRuns([])}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Clear history
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── Right: Prompt + Results ── */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardContent className="pt-5 space-y-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="system-prompt"
                  className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
                >
                  System prompt
                </Label>
                <Textarea
                  id="system-prompt"
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  rows={3}
                  placeholder="You are a helpful assistant."
                  className="resize-none font-mono text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="user-message"
                  className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
                >
                  User message
                </Label>
                <Textarea
                  id="user-message"
                  value={userMessage}
                  onChange={(e) => setUserMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={6}
                  placeholder="Enter your message… (⌘Enter to run)"
                  className="resize-none text-sm"
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2 border border-destructive/20">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {responseFormat === "json"
                    ? "Response will be parsed as JSON"
                    : "Free-text response"}
                </span>
                <Button
                  onClick={handleRun}
                  disabled={!userMessage.trim() || isRunning}
                  className="gap-2"
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Running…
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Run
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          {runs.length > 0 && (
            <div className="space-y-3" ref={outputRef}>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold">Results</h2>
                <Badge variant="secondary" className="text-xs">
                  {runs.length}
                </Badge>
              </div>
              {runs.map((run, i) => (
                <RunCard key={run.id + i} run={run} index={i} />
              ))}
            </div>
          )}

          {runs.length === 0 && !isRunning && (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground border-2 border-dashed rounded-xl">
              <BrainCircuit className="h-10 w-10 mb-3 opacity-30" />
              <p className="font-medium">No runs yet</p>
              <p className="text-sm mt-1">
                Write a prompt above and click Run to get started.
              </p>
              <p className="text-xs mt-3 opacity-60">
                ⌘Enter / Ctrl+Enter to run from keyboard
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
