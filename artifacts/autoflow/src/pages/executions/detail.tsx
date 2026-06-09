import { useRoute, Link } from "wouter";
import { useGetExecution, getGetExecutionQueryKey, useRetryExecution } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, CheckCircle2, AlertCircle, Clock, XCircle, RotateCcw, Timer } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

function statusIcon(status: string) {
  if (status === "success") return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
  if (status === "failed") return <AlertCircle className="w-4 h-4 text-red-500" />;
  if (status === "running") return <Clock className="w-4 h-4 text-blue-500 animate-pulse" />;
  return <XCircle className="w-4 h-4 text-gray-400" />;
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    success: "bg-emerald-100 text-emerald-700 border-emerald-200",
    failed: "bg-red-100 text-red-700 border-red-200",
    running: "bg-blue-100 text-blue-700 border-blue-200",
    cancelled: "bg-gray-100 text-gray-600 border-gray-200",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${map[status] ?? map.cancelled}`}>
      {status}
    </span>
  );
}

function fmtDuration(ms: number | null | undefined) {
  if (!ms) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

type Step = {
  nodeId: string; nodeName: string; nodeType: string; status: string;
  startedAt: string; finishedAt: string | null; durationMs: number | null;
  inputData: Record<string, unknown>; outputData: Record<string, unknown>; errorMessage: string | null;
};

export default function ExecutionDetailPage() {
  const [, params] = useRoute("/executions/:id");
  const id = Number(params?.id);
  const qc = useQueryClient();

  const execution = useGetExecution(id, { query: { enabled: !!id, queryKey: getGetExecutionQueryKey(id) } });
  const retryMut = useRetryExecution();

  if (execution.isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-40" />
        <div className="space-y-2 mt-6">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
        </div>
      </div>
    );
  }

  const ex = execution.data;
  if (!ex) return <div className="p-6 text-sm text-muted-foreground">Execution not found.</div>;

  const steps: Step[] = (ex.steps as Step[]) ?? [];

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/executions">
          <a className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Executions
          </a>
        </Link>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-semibold">{ex.workflowName}</h1>
            {statusBadge(ex.status)}
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Execution #{ex.id}</span>
            <span>Started {formatDistanceToNow(new Date(ex.startedAt), { addSuffix: true })}</span>
            <span className="flex items-center gap-1"><Timer className="w-3.5 h-3.5" />{fmtDuration(ex.durationMs)}</span>
          </div>
        </div>
        {ex.status === "failed" && (
          <Button size="sm" variant="outline" onClick={() => retryMut.mutate({ id: ex.id }, { onSuccess: () => qc.invalidateQueries({ queryKey: getGetExecutionQueryKey(id) }) })}>
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Retry
          </Button>
        )}
      </div>

      {ex.errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-sm text-red-700">
          <span className="font-medium">Error: </span>{ex.errorMessage}
        </div>
      )}

      <div className="mb-4">
        <h2 className="text-sm font-medium mb-3">Execution Steps</h2>
        {steps.length === 0 ? (
          <div className="border rounded-lg p-8 text-center text-sm text-muted-foreground">
            No step data recorded for this execution.
          </div>
        ) : (
          <div className="space-y-1">
            {steps.map((step, i) => (
              <div key={step.nodeId ?? i} className="border rounded-lg overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3 bg-card">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium text-muted-foreground shrink-0">{i + 1}</div>
                  {statusIcon(step.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{step.nodeName}</span>
                      <Badge variant="secondary" className="text-xs">{step.nodeType}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="tabular-nums">{fmtDuration(step.durationMs)}</span>
                    {statusBadge(step.status)}
                  </div>
                </div>

                {(step.errorMessage || Object.keys(step.inputData ?? {}).length > 0 || Object.keys(step.outputData ?? {}).length > 0) && (
                  <Accordion type="single" collapsible>
                    {step.errorMessage && (
                      <div className="px-4 py-2.5 bg-red-50 border-t border-red-100 text-xs text-red-700">
                        <span className="font-medium">Error: </span>{step.errorMessage}
                      </div>
                    )}
                    {Object.keys(step.inputData ?? {}).length > 0 && (
                      <AccordionItem value="input" className="border-t">
                        <AccordionTrigger className="px-4 py-2 text-xs font-medium text-muted-foreground hover:no-underline">
                          Input Data
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-3">
                          <pre className="text-xs bg-muted/60 rounded p-3 overflow-x-auto">{JSON.stringify(step.inputData, null, 2)}</pre>
                        </AccordionContent>
                      </AccordionItem>
                    )}
                    {Object.keys(step.outputData ?? {}).length > 0 && (
                      <AccordionItem value="output" className="border-t">
                        <AccordionTrigger className="px-4 py-2 text-xs font-medium text-muted-foreground hover:no-underline">
                          Output Data
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-3">
                          <pre className="text-xs bg-muted/60 rounded p-3 overflow-x-auto">{JSON.stringify(step.outputData, null, 2)}</pre>
                        </AccordionContent>
                      </AccordionItem>
                    )}
                  </Accordion>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border rounded-lg p-4 text-xs text-muted-foreground space-y-1">
        <div className="flex gap-4">
          <span>Started: <span className="text-foreground">{format(new Date(ex.startedAt), "PPpp")}</span></span>
          {ex.finishedAt && <span>Finished: <span className="text-foreground">{format(new Date(ex.finishedAt), "PPpp")}</span></span>}
        </div>
        <div>Workflow ID: <span className="text-foreground">#{ex.workflowId}</span></div>
      </div>
    </div>
  );
}
