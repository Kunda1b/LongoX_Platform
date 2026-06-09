import { useParams, Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useGetWorkflow, 
  useRunWorkflow, 
  useListNodeTypes,
  useDuplicateWorkflow,
  getGetWorkflowQueryKey,
  getListExecutionsQueryKey,
  getListWorkflowsQueryKey
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/badges";
import { ArrowLeft, Play, Settings2, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { WorkflowBuilder } from "@/components/workflow-builder";

export default function WorkflowDetail() {
  const { id } = useParams<{ id: string }>();
  const workflowId = parseInt(id || "0", 10);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data: workflow, isLoading: isLoadingWf } = useGetWorkflow(workflowId, {
    query: { enabled: !!workflowId, queryKey: getGetWorkflowQueryKey(workflowId) }
  });

  const { data: nodeTypes = [] } = useListNodeTypes();

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

  const duplicateMutation = useDuplicateWorkflow({
    mutation: {
      onSuccess: (newWf) => {
        queryClient.invalidateQueries({ queryKey: getListWorkflowsQueryKey() });
        toast({ title: "Workflow duplicated" });
        setLocation(`/workflows/${newWf.id}`);
      },
      onError: () => {
        toast({ title: "Failed to duplicate workflow", variant: "destructive" });
      }
    }
  });

  const handleSaved = () => {
    queryClient.invalidateQueries({ queryKey: getGetWorkflowQueryKey(workflowId) });
  };

  if (isLoadingWf) return <div className="p-8">Loading...</div>;
  if (!workflow) return <div className="p-8">Workflow not found</div>;

  return (
    <div className="h-full flex flex-col">
      <header className="flex items-center justify-between pb-4 border-b shrink-0">
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

      <div className="flex-1 mt-4 min-h-0">
        <WorkflowBuilder
          workflowId={workflow.id}
          initialNodes={workflow.nodes ?? []}
          nodeTypesList={nodeTypes}
          onSaved={handleSaved}
        />
      </div>
    </div>
  );
}
