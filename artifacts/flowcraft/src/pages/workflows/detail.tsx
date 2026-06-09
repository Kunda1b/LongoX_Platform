import { useParams, Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useGetWorkflow, 
  useRunWorkflow, 
  getGetWorkflowQueryKey,
  getListExecutionsQueryKey
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/badges";
import { ArrowLeft, Play, Settings2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function WorkflowDetail() {
  const { id } = useParams<{ id: string }>();
  const workflowId = parseInt(id || "0", 10);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: workflow, isLoading } = useGetWorkflow(workflowId, {
    query: { enabled: !!workflowId, queryKey: getGetWorkflowQueryKey(workflowId) }
  });

  const runMutation = useRunWorkflow({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetWorkflowQueryKey(workflowId) });
        queryClient.invalidateQueries({ queryKey: getListExecutionsQueryKey() });
        toast({ title: "Workflow started successfully" });
      },
      onError: () => {
        toast({ title: "Failed to start workflow", variant: "destructive" });
      }
    }
  });

  if (isLoading) return <div className="p-8">Loading...</div>;
  if (!workflow) return <div className="p-8">Workflow not found</div>;

  return (
    <div className="h-full flex flex-col">
      <header className="flex items-center justify-between pb-4 border-b">
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
          <Button variant="outline" size="sm" className="gap-2">
            <Settings2 className="h-4 w-4" />
            Settings
          </Button>
          <Button 
            size="sm" 
            className="gap-2"
            disabled={runMutation.isPending || workflow.status !== 'active'}
            onClick={() => runMutation.mutate({ id: workflow.id })}
          >
            <Play className="h-4 w-4" />
            {runMutation.isPending ? "Starting..." : "Run Now"}
          </Button>
        </div>
      </header>

      <div className="flex-1 bg-muted/30 relative overflow-hidden mt-6 rounded-lg border">
        {/* Canvas Area */}
        <div className="absolute inset-0 overflow-auto p-8">
          <div className="relative min-w-[800px] min-h-[600px]">
            {workflow.nodes?.map((node) => (
              <Card 
                key={node.id} 
                className="absolute w-64 shadow-md bg-card border-card-border p-4"
                style={{ left: node.position.x, top: node.position.y }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm">{node.name}</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">{node.type}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  ID: {node.id}
                </div>
              </Card>
            ))}
            {(!workflow.nodes || workflow.nodes.length === 0) && (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                No nodes configured
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}