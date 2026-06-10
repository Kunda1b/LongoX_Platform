"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetExecution,
  useRetryExecution,
  useListNodeTypes,
  getGetExecutionQueryKey,
  getListExecutionsQueryKey,
} from "@autoflow/api-client-react";
import { StatusBadge } from "@/components/badges";
import {
  ArrowLeft,
  Clock,
  Calendar,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  SkipForward,
  Loader2,
  Zap,
  Blocks,
  Cpu,
  BrainCircuit,
  Database,
  ChevronRight,
  ChevronLeft,
  Activity,
  Timer,
  Hash,
  Copy,
  Check,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Step {
  id: number;
  nodeId: string;
  nodeName: string;
  nodeType?: string | null;
  status: "running" | "success" | "failed" | "skipped";
  startedAt: string;
  finishedAt?: string | null;
  durationMs?: number | null;
  inputData?: Record<string, unknown> | null;
  outputData?: Record<string, unknown> | null;
  errorMessage?: string | null;
  itemCount?: number | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CATEGORY_META: Record<string, { color: string; bg: string; border: string; icon: React.ReactNode }> = {
  trigger: { color: "text-cyan-400",   bg: "bg-cyan-500/10",   border: "border-cyan-500/30",   icon: <Zap className="h-3.5 w-3.5" /> },
  action:  { color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/30", icon: <Blocks className="h-3.5 w-3.5" /> },
  logic:   { color: "text-amber-400",  bg: "bg-amber-500/10",  border: "border-amber-500/30",  icon: <Cpu className="h-3.5 w-3.5" /> },
  ai:      { color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/30", icon: <BrainCircuit className="h-3.5 w-3.5" /> },
  data:    { color: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-500/30",   icon: <Database className="h-3.5 w-3.5" /> },
};

function getCategoryFromNodeType(nodeTypeId?: string | null) {
  if (!nodeTypeId) return "action";
  return nodeTypeId.split(".")[0] ?? "action";
}

function formatDuration(ms?: number | null) {
  if (ms == null) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function StatusIcon({ status, className }: { status: Step["status"] | "cancelled"; className?: string }) {
  const cls = cn("h-5 w-5 shrink-0", className);
  if (status === "success")  return <CheckCircle2 className={cn(cls, "text-emerald-500")} />;
  if (status === "failed")   return <XCircle className={cn(cls, "text-destructive")} />;
  if (status === "skipped")  return <SkipForward className={cn(cls, "text-muted-foreground")} />;
  if (status === "running")  return <Loader2 className={cn(cls, "text-primary animate-spin")} />;
  return <XCircle className={cn(cls, "text-muted-foreground")} />;
}

// ─── JSON viewer with copy ─────────────────────────────────────────────────────

function JsonViewer({ data, label }: { data: unknown; label: string }) {
  const [copied, setCopied] = useState(false);
  const json = data != null ? JSON.stringify(data, null, 2) : "null";

  const copy = () => {
    navigator.clipboard.writeText(json).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="rounded-lg border border-border overflow-hidden shadow-sm">
      <div className="flex items-center justify-between bg-muted/60 px-3 py-1.5 border-b">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
        <button
          onClick={copy}
          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="p-4 bg-zinc-950 text-zinc-300 text-[11px] font-mono overflow-auto max-h-60 leading-relaxed">
        {json}
      </pre>
    </div>
  );
}

// ─── Step detail panel ────────────────────────────────────────────────────────

function StepDetail({ step, nodeTypeName, onBack }: { step: Step; nodeTypeName?: string; onBack?: () => void }) {
  const category = getCategoryFromNodeType(step.nodeType);
  const meta = CATEGORY_META[category] ?? CATEGORY_META.action;

  return (
    <div className="flex flex-col h-full">
      <div className={cn("px-4 sm:px-5 py-3 sm:py-4 border-b", meta.bg)}>
        {/* Mobile back button */}
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-xs text-muted-foreground mb-2 md:hidden"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Back to steps
          </button>
        )}
        <div className="flex items-center gap-2 mb-1">
          <span className={cn(meta.color)}>{meta.icon}</span>
          <StatusIcon status={step.status} className="h-4 w-4" />
          <h3 className="font-semibold text-sm">{step.nodeName}</h3>
        </div>
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          {nodeTypeName && (
            <Badge variant="outline" className={cn("text-[10px] gap-1", meta.color, meta.border)}>
              {nodeTypeName}
            </Badge>
          )}
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Timer className="h-3 w-3" />
            {formatDuration(step.durationMs)}
          </span>
          {step.itemCount != null && step.itemCount > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Hash className="h-3 w-3" />
              {step.itemCount} item{step.itemCount !== 1 ? "s" : ""}
            </span>
          )}
          <span className="text-[11px] text-muted-foreground">
            {format(new Date(step.startedAt), "HH:mm:ss.SSS")}
          </span>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {step.errorMessage && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 flex gap-2.5">
              <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-destructive mb-1">Error</p>
                <p className="text-[11px] font-mono text-destructive/90 leading-relaxed break-all">{step.errorMessage}</p>
              </div>
            </div>
          )}

          <Tabs defaultValue={step.status === "failed" ? "error" : "output"}>
            <TabsList className="h-8 text-xs">
              <TabsTrigger value="output" className="text-xs h-6 px-3">Output</TabsTrigger>
              <TabsTrigger value="input" className="text-xs h-6 px-3">Input</TabsTrigger>
              {step.errorMessage && (
                <TabsTrigger value="error" className="text-xs h-6 px-3 data-[state=active]:text-destructive">Error</TabsTrigger>
              )}
            </TabsList>
            <TabsContent value="output" className="mt-3">
              <JsonViewer data={step.outputData} label="Output data" />
            </TabsContent>
            <TabsContent value="input" className="mt-3">
              <JsonViewer data={step.inputData} label="Input data" />
            </TabsContent>
            {step.errorMessage && (
              <TabsContent value="error" className="mt-3">
                <div className="rounded-lg border border-destructive/30 overflow-hidden">
                  <div className="bg-destructive/10 px-3 py-1.5 border-b border-destructive/20">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-destructive">Error details</span>
                  </div>
                  <pre className="p-4 bg-zinc-950 text-red-400 text-[11px] font-mono overflow-auto max-h-60 whitespace-pre-wrap leading-relaxed">
                    {step.errorMessage}
                  </pre>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  );
}

// ─── Timeline step row ────────────────────────────────────────────────────────

function TimelineStep({
  step, index, total, isSelected, nodeTypeName, totalDuration, onClick,
}: {
  step: Step; index: number; total: number; isSelected: boolean;
  nodeTypeName?: string; totalDuration: number; onClick: () => void;
}) {
  const category = getCategoryFromNodeType(step.nodeType);
  const meta = CATEGORY_META[category] ?? CATEGORY_META.action;
  const widthPct = totalDuration > 0 ? Math.max(((step.durationMs ?? 0) / totalDuration) * 100, 2) : 0;

  const statusBg: Record<string, string> = {
    success: "bg-emerald-500",
    failed:  "bg-destructive",
    running: "bg-primary",
    skipped: "bg-muted-foreground",
  };

  return (
    <div className="flex gap-0">
      <div className="flex flex-col items-center w-8 sm:w-10 shrink-0">
        <div className={cn(
          "h-7 w-7 sm:h-8 sm:w-8 rounded-full border-2 flex items-center justify-center z-10 bg-card transition-colors",
          isSelected ? "border-primary shadow-[0_0_0_3px_hsl(var(--primary)/0.2)]" : "border-border",
          step.status === "failed"  ? "border-destructive/60"  : "",
          step.status === "success" ? "border-emerald-500/60"  : "",
        )}>
          <span className="text-[10px] font-bold text-muted-foreground">{index + 1}</span>
        </div>
        {index < total - 1 && (
          <div className={cn("w-px flex-1 min-h-[20px]",
            step.status === "success" ? "bg-emerald-500/30" : step.status === "failed" ? "bg-destructive/30" : "bg-border"
          )} />
        )}
      </div>

      <button
        className={cn(
          "flex-1 text-left mb-3 rounded-lg border transition-all cursor-pointer",
          "hover:border-primary/40 hover:bg-muted/30",
          isSelected
            ? "border-primary/50 bg-primary/5 shadow-sm"
            : step.status === "failed"
            ? "border-destructive/30 bg-destructive/5"
            : "border-border bg-card/50",
        )}
        onClick={onClick}
      >
        <div className="px-3 py-2.5">
          <div className="flex items-center gap-2 mb-1.5">
            <StatusIcon status={step.status} className="h-3.5 w-3.5" />
            <span className="font-medium text-xs flex-1 truncate">{step.nodeName}</span>
            <span className={cn("text-[10px] font-mono shrink-0", step.status === "failed" ? "text-destructive" : "text-muted-foreground")}>
              {formatDuration(step.durationMs)}
            </span>
            <ChevronRight className={cn("h-3 w-3 text-muted-foreground/40 transition-transform shrink-0", isSelected ? "rotate-90" : "")} />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {nodeTypeName && (
              <span className={cn("text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded", meta.bg, meta.color)}>
                {nodeTypeName}
              </span>
            )}
            {step.itemCount != null && step.itemCount > 0 && (
              <span className="text-[10px] text-muted-foreground/60">{step.itemCount} item{step.itemCount !== 1 ? "s" : ""}</span>
            )}
          </div>

          <div className="mt-2 h-1 rounded-full bg-muted overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", statusBg[step.status] ?? "bg-muted-foreground")}
              style={{ width: `${widthPct}%`, opacity: 0.7 }}
            />
          </div>
        </div>
      </button>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function ExecutionDetail() {
  const params = useParams<{ id: string }>();
  const execId = parseInt(params.id || "0", 10);
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedStepId, setSelectedStepId] = useState<number | null>(null);
  // Mobile: "timeline" | "detail"
  const [mobileView, setMobileView] = useState<"timeline" | "detail">("timeline");

  const { data: exec, isLoading } = useGetExecution(execId, {
    query: {
      enabled: !!execId,
      queryKey: getGetExecutionQueryKey(execId),
      onSuccess: (data: never) => {
        const d = data as { steps?: Step[] };
        if (!selectedStepId && d.steps && d.steps.length > 0) {
          const failed = d.steps.find((s: Step) => s.status === "failed");
          setSelectedStepId(failed?.id ?? d.steps[d.steps.length - 1].id);
        }
      },
    } as never,
  });

  const { data: nodeTypes = [] } = useListNodeTypes();

  const retryMutation = useRetryExecution({
    mutation: {
      onSuccess: (newExec: never) => {
        const e = newExec as { id: number };
        queryClient.invalidateQueries({ queryKey: getListExecutionsQueryKey() });
        toast({ title: "Execution retried" });
        router.push(`/executions/${e.id}`);
      },
      onError: () => {
        toast({ title: "Failed to retry execution", variant: "destructive" });
      },
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading execution…
      </div>
    );
  }
  if (!exec) return <div className="p-8">Execution not found</div>;

  const steps: Step[] = (exec as never as { steps?: Step[] }).steps ?? [];
  const totalDuration = steps.reduce((s, step) => s + (step.durationMs ?? 0), 0);
  const selectedStep = steps.find((s) => s.id === selectedStepId) ?? (steps.length > 0 ? steps[steps.length - 1] : null);

  const getNodeTypeName = (nodeTypeId?: string | null) => {
    if (!nodeTypeId) return undefined;
    return (nodeTypes as never as { id: string; name: string }[]).find((nt) => nt.id === nodeTypeId)?.name;
  };

  const successCount = steps.filter((s) => s.status === "success").length;
  const failedCount  = steps.filter((s) => s.status === "failed").length;

  function handleStepClick(stepId: number) {
    setSelectedStepId(stepId);
    setMobileView("detail");
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header className="flex items-start sm:items-center gap-3 border-b pb-4 shrink-0">
        <Button variant="ghost" size="icon" className="shrink-0 mt-0.5 sm:mt-0" asChild>
          <Link href="/executions"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg sm:text-xl font-bold">Execution #{exec.id}</h1>
            <StatusBadge status={exec.status} />
            <span className="text-sm text-muted-foreground hidden sm:inline">
              in{" "}
              <Link href={`/workflows/${exec.workflowId}`} className="text-primary hover:underline font-medium">
                {exec.workflowName}
              </Link>
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span className="hidden sm:inline">{format(new Date(exec.startedAt), "PPp")}</span>
              <span className="sm:hidden">{formatDistanceToNow(new Date(exec.startedAt), { addSuffix: true })}</span>
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDuration(exec.durationMs)}
            </span>
            <span className="flex items-center gap-1">
              <Activity className="h-3 w-3" />
              {steps.length} steps
            </span>
            {successCount > 0 && (
              <span className="flex items-center gap-1 text-emerald-500">
                <CheckCircle2 className="h-3 w-3" />{successCount}
              </span>
            )}
            {failedCount > 0 && (
              <span className="flex items-center gap-1 text-destructive">
                <XCircle className="h-3 w-3" />{failedCount}
              </span>
            )}
          </div>
        </div>
        {exec.status === "failed" && (
          <Button
            size="sm"
            onClick={() => retryMutation.mutate({ id: exec.id })}
            disabled={retryMutation.isPending}
            className="gap-2 shrink-0"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", retryMutation.isPending && "animate-spin")} />
            <span className="hidden sm:inline">{retryMutation.isPending ? "Retrying…" : "Retry"}</span>
          </Button>
        )}
      </header>

      {/* Progress bar */}
      {steps.length > 0 && (
        <div className="mt-3 mb-1 shrink-0">
          <div className="flex h-2 rounded-full overflow-hidden gap-px bg-muted">
            {steps.map((step) => {
              const pct = totalDuration > 0 ? ((step.durationMs ?? 0) / totalDuration) * 100 : 100 / steps.length;
              const color = step.status === "success" ? "bg-emerald-500" : step.status === "failed" ? "bg-destructive" : step.status === "running" ? "bg-primary" : "bg-muted-foreground/40";
              return (
                <button
                  key={step.id}
                  className={cn("h-full rounded-sm transition-opacity cursor-pointer hover:opacity-90", color, selectedStepId === step.id ? "opacity-100" : "opacity-60")}
                  style={{ width: `${pct}%`, minWidth: 4 }}
                  onClick={() => handleStepClick(step.id)}
                  title={`${step.nodeName} — ${formatDuration(step.durationMs)}`}
                />
              );
            })}
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground/50 mt-1 px-0.5">
            <span>{format(new Date(exec.startedAt), "HH:mm:ss")}</span>
            <span>{formatDuration(exec.durationMs)}</span>
          </div>
        </div>
      )}

      {/* Error banner */}
      {exec.errorMessage && (
        <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 flex gap-2.5 shrink-0">
          <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <p className="text-xs font-mono text-destructive/90 break-all">{exec.errorMessage}</p>
        </div>
      )}

      {/* Main body */}
      <div className="flex-1 min-h-0 mt-4 overflow-hidden">
        {steps.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3 text-center p-6">
            <Activity className="h-10 w-10 opacity-15" />
            <p className="text-sm">No step data recorded for this execution.</p>
            <p className="text-xs opacity-60">Steps are generated when a workflow with nodes is run.</p>
          </div>
        ) : (
          <>
            {/* ── Desktop: side-by-side ── */}
            <div className="hidden md:flex gap-4 h-full">
              <div className="w-72 shrink-0 flex flex-col">
                <p className="text-[11px] uppercase font-semibold tracking-widest text-muted-foreground mb-3 px-1">
                  Steps · {steps.length}
                </p>
                <ScrollArea className="flex-1">
                  <div className="pr-3 pl-1">
                    {steps.map((step, i) => (
                      <TimelineStep
                        key={step.id}
                        step={step}
                        index={i}
                        total={steps.length}
                        isSelected={selectedStepId === step.id}
                        nodeTypeName={getNodeTypeName(step.nodeType)}
                        totalDuration={totalDuration}
                        onClick={() => setSelectedStepId(step.id)}
                      />
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <div className="flex-1 min-w-0 rounded-lg border bg-card overflow-hidden">
                {selectedStep ? (
                  <StepDetail step={selectedStep} nodeTypeName={getNodeTypeName(selectedStep.nodeType)} />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground gap-2 text-sm">
                    <ChevronRight className="h-4 w-4" />
                    Select a step to inspect its data
                  </div>
                )}
              </div>
            </div>

            {/* ── Mobile: toggle between timeline and detail ── */}
            <div className="md:hidden h-full flex flex-col">
              {mobileView === "timeline" ? (
                <>
                  <p className="text-[11px] uppercase font-semibold tracking-widest text-muted-foreground mb-3 px-1">
                    Steps · {steps.length} — tap to inspect
                  </p>
                  <ScrollArea className="flex-1">
                    <div className="pr-2 pl-1">
                      {steps.map((step, i) => (
                        <TimelineStep
                          key={step.id}
                          step={step}
                          index={i}
                          total={steps.length}
                          isSelected={selectedStepId === step.id}
                          nodeTypeName={getNodeTypeName(step.nodeType)}
                          totalDuration={totalDuration}
                          onClick={() => handleStepClick(step.id)}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                </>
              ) : (
                <div className="flex-1 rounded-lg border bg-card overflow-hidden">
                  {selectedStep ? (
                    <StepDetail
                      step={selectedStep}
                      nodeTypeName={getNodeTypeName(selectedStep.nodeType)}
                      onBack={() => setMobileView("timeline")}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2 p-6">
                      <p className="text-sm">No step selected</p>
                      <Button variant="ghost" size="sm" onClick={() => setMobileView("timeline")}>
                        Back to steps
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
