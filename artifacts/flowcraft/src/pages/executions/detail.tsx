import { useParams, Link } from "wouter";
import { useGetExecution, getGetExecutionQueryKey } from "@workspace/api-client-react";
import { StatusBadge } from "@/components/badges";
import { ArrowLeft, Clock, Calendar } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function ExecutionDetail() {
  const { id } = useParams<{ id: string }>();
  const execId = parseInt(id || "0", 10);

  const { data: exec, isLoading } = useGetExecution(execId, {
    query: { enabled: !!execId, queryKey: getGetExecutionQueryKey(execId) }
  });

  if (isLoading) return <div className="p-8">Loading...</div>;
  if (!exec) return <div className="p-8">Execution not found</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <header className="flex items-center gap-4 border-b pb-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/executions"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Execution #{exec.id}</h1>
            <StatusBadge status={exec.status} />
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            Workflow: <Link href={`/workflows/${exec.workflowId}`} className="text-primary hover:underline">{exec.workflowName}</Link>
          </p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Started At</p>
              <p className="text-sm text-muted-foreground">{format(new Date(exec.startedAt), "PPpp")}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Duration</p>
              <p className="text-sm text-muted-foreground">{exec.durationMs ? `${exec.durationMs}ms` : 'Running...'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {exec.errorMessage && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="p-4">
            <p className="font-semibold text-destructive mb-1">Error</p>
            <p className="text-sm text-destructive/80 font-mono bg-destructive/5 p-2 rounded">{exec.errorMessage}</p>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="text-lg font-semibold mb-4">Steps Timeline</h2>
        <Card>
          <CardContent className="p-0">
            <Accordion type="single" collapsible className="w-full">
              {exec.steps.map((step, index) => (
                <AccordionItem key={step.id} value={step.id.toString()} className="border-b last:border-0">
                  <AccordionTrigger className="hover:no-underline hover:bg-muted/50 px-4 py-3">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="text-muted-foreground font-mono text-sm w-8">{index + 1}</div>
                      <div className="flex-1 text-left font-medium">{step.nodeName}</div>
                      <div className="text-sm text-muted-foreground font-normal">{step.durationMs}ms</div>
                      <div className="w-24 text-right pr-4"><StatusBadge status={step.status} /></div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-12 py-4 bg-muted/20 border-t">
                    <div className="space-y-4">
                      <div>
                        <span className="text-xs font-semibold uppercase text-muted-foreground">Node ID</span>
                        <p className="text-sm font-mono mt-1">{step.nodeId}</p>
                      </div>
                      {step.errorMessage && (
                        <div>
                          <span className="text-xs font-semibold uppercase text-destructive">Error</span>
                          <p className="text-sm font-mono mt-1 text-destructive bg-destructive/10 p-2 rounded">{step.errorMessage}</p>
                        </div>
                      )}
                      <div>
                        <span className="text-xs font-semibold uppercase text-muted-foreground">Output Data</span>
                        <pre className="mt-2 p-4 rounded-md bg-zinc-950 text-zinc-50 text-xs overflow-auto max-h-64">
                          {JSON.stringify(step.outputData, null, 2) || "{}"}
                        </pre>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
              {exec.steps.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">No steps recorded.</div>
              )}
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}