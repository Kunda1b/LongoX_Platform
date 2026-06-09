import { useParams, Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useGetExecution, 
  useRetryExecution,
  useListNodeTypes,
  getGetExecutionQueryKey,
  getListExecutionsQueryKey
} from "@workspace/api-client-react";
import { StatusBadge } from "@/components/badges";
import { ArrowLeft, Clock, Calendar, RefreshCw, AlertCircle, Cpu, Blocks, Zap, Database, Activity } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function ExecutionDetail() {
  const { id } = useParams<{ id: string }>();
  const execId = parseInt(id || "0", 10);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: exec, isLoading } = useGetExecution(execId, {
    query: { enabled: !!execId, queryKey: getGetExecutionQueryKey(execId) }
  });
  
  const { data: nodeTypes = [] } = useListNodeTypes();

  const retryMutation = useRetryExecution({
    mutation: {
      onSuccess: (newExec) => {
        queryClient.invalidateQueries({ queryKey: getListExecutionsQueryKey() });
        toast({ title: "Execution retried" });
        setLocation(`/executions/${newExec.id}`);
      },
      onError: () => {
        toast({ title: "Failed to retry execution", variant: "destructive" });
      }
    }
  });

  const getNodeTypeInfo = (nodeTypeId: string) => {
    return nodeTypes.find(nt => nt.id === nodeTypeId);
  };

  if (isLoading) return <div className="p-8">Loading...</div>;
  if (!exec) return <div className="p-8">Execution not found</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <header className="flex items-center gap-4 border-b pb-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/executions"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Execution #{exec.id}</h1>
            <StatusBadge status={exec.status} />
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            Workflow: <Link href={`/workflows/${exec.workflowId}`} className="text-primary hover:underline">{exec.workflowName}</Link>
          </p>
        </div>
        {exec.status === "failed" && (
          <Button 
            onClick={() => retryMutation.mutate({ id: exec.id })}
            disabled={retryMutation.isPending}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${retryMutation.isPending ? 'animate-spin' : ''}`} />
            Retry Execution
          </Button>
        )}
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
          <CardContent className="p-4 flex gap-3">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-destructive mb-1">Execution Failed</p>
              <p className="text-sm text-destructive/90 font-mono bg-destructive/5 p-2 rounded border border-destructive/20">{exec.errorMessage}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="text-lg font-semibold mb-4">Steps Inspector</h2>
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <Accordion type="single" collapsible className="w-full">
              {exec.steps.map((step, index) => {
                const nodeTypeInfo = getNodeTypeInfo(step.nodeId);
                const categoryColor = step.status === 'failed' ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground';
                
                return (
                  <AccordionItem key={step.id} value={step.id.toString()} className="border-b last:border-0">
                    <AccordionTrigger className="hover:no-underline hover:bg-muted/30 px-6 py-4 transition-colors">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs font-medium">
                          {index + 1}
                        </div>
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{step.nodeName}</span>
                            <Badge variant="secondary" className={`text-[10px] uppercase font-bold tracking-wider ${categoryColor}`}>
                              {nodeTypeInfo?.name || step.nodeId.split('-')[0] || 'Node'}
                            </Badge>
                          </div>
                          {step.itemCount !== undefined && step.itemCount > 0 && (
                            <span className="text-xs text-muted-foreground mt-1 block">
                              Processed {step.itemCount} items
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground font-medium flex items-center gap-1.5 mr-4">
                          <Clock className="h-3 w-3" />
                          {step.durationMs}ms
                        </div>
                        <div className="w-24 text-right"><StatusBadge status={step.status} /></div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 py-4 bg-muted/10 border-t">
                      <div className="space-y-4">
                        {step.errorMessage && (
                          <div className="mb-4">
                            <span className="text-xs font-semibold uppercase text-destructive flex items-center gap-1 mb-2">
                              <AlertCircle className="h-3 w-3" /> Error Details
                            </span>
                            <p className="text-sm font-mono text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20 shadow-sm">{step.errorMessage}</p>
                          </div>
                        )}
                        
                        <Tabs defaultValue="output" className="w-full">
                          <TabsList className="mb-4">
                            <TabsTrigger value="output">Output Data</TabsTrigger>
                            <TabsTrigger value="input">Input Data</TabsTrigger>
                          </TabsList>
                          
                          <TabsContent value="output" className="mt-0">
                            <div className="rounded-md border border-border overflow-hidden shadow-sm">
                              <div className="bg-muted px-3 py-1.5 text-xs font-medium border-b flex justify-between items-center">
                                <span>JSON</span>
                                {step.itemCount !== undefined && <Badge variant="outline" className="text-[10px]">{step.itemCount} items</Badge>}
                              </div>
                              <pre className="p-4 bg-zinc-950 text-zinc-300 text-xs font-mono overflow-auto max-h-80 w-full">
                                {JSON.stringify(step.outputData, null, 2) || "{}"}
                              </pre>
                            </div>
                          </TabsContent>
                          
                          <TabsContent value="input" className="mt-0">
                            <div className="rounded-md border border-border overflow-hidden shadow-sm">
                              <div className="bg-muted px-3 py-1.5 text-xs font-medium border-b">
                                <span>JSON</span>
                              </div>
                              <pre className="p-4 bg-zinc-950 text-zinc-300 text-xs font-mono overflow-auto max-h-80 w-full">
                                {JSON.stringify(step.inputData, null, 2) || "{}"}
                              </pre>
                            </div>
                          </TabsContent>
                        </Tabs>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
              {exec.steps.length === 0 && (
                <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
                  <Activity className="h-8 w-8 opacity-20" />
                  <p>No steps recorded for this execution.</p>
                </div>
              )}
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}