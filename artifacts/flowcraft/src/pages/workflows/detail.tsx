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
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/badges";
import { ArrowLeft, Play, Settings2, Copy, AlertTriangle, Zap, LogIn, Cpu, Database, Blocks } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

  if (isLoadingWf) return <div className="p-8">Loading...</div>;
  if (!workflow) return <div className="p-8">Workflow not found</div>;

  const getNodeTypeInfo = (nodeTypeId: string) => {
    return nodeTypes.find(nt => nt.id === nodeTypeId);
  };

  const getCategoryColor = (category?: string) => {
    switch(category) {
      case 'trigger': return "text-cyan-500 bg-cyan-500/10 border-cyan-500/20";
      case 'action': return "text-indigo-500 bg-indigo-500/10 border-indigo-500/20";
      case 'logic': return "text-amber-500 bg-amber-500/10 border-amber-500/20";
      case 'ai': return "text-purple-500 bg-purple-500/10 border-purple-500/20";
      case 'data': return "text-blue-500 bg-blue-500/10 border-blue-500/20";
      default: return "text-slate-500 bg-slate-500/10 border-slate-500/20";
    }
  };

  const getCategoryIcon = (category?: string) => {
    switch(category) {
      case 'trigger': return <Zap className="h-4 w-4" />;
      case 'action': return <Blocks className="h-4 w-4" />;
      case 'logic': return <Cpu className="h-4 w-4" />;
      case 'ai': return <Zap className="h-4 w-4" />;
      case 'data': return <Database className="h-4 w-4" />;
      default: return <Blocks className="h-4 w-4" />;
    }
  };

  // Simple bounding box calculation for the SVG canvas
  const maxX = workflow.nodes?.reduce((max, node) => Math.max(max, node.position.x + 300), 800) || 800;
  const maxY = workflow.nodes?.reduce((max, node) => Math.max(max, node.position.y + 200), 600) || 600;

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

      <div className="flex-1 bg-zinc-50/50 dark:bg-zinc-900/50 relative overflow-hidden mt-6 rounded-lg border dot-pattern">
        {/* Canvas Area */}
        <div className="absolute inset-0 overflow-auto">
          <div className="relative" style={{ width: maxX, height: maxY }}>
            <svg className="absolute inset-0 pointer-events-none" width={maxX} height={maxY}>
              {/* Draw connections based on sequential order for now, assuming next node is connected */}
              {workflow.nodes?.map((node, i, arr) => {
                if (i === arr.length - 1) return null;
                const nextNode = arr[i + 1];
                const startX = node.position.x + 250; // card width roughly
                const startY = node.position.y + 50;  // half card height
                const endX = nextNode.position.x;
                const endY = nextNode.position.y + 50;
                
                // SVG path for a nice bezier curve
                const controlX = startX + (endX - startX) / 2;
                return (
                  <path 
                    key={`conn-${node.id}-${nextNode.id}`}
                    d={`M ${startX} ${startY} C ${controlX} ${startY}, ${controlX} ${endY}, ${endX} ${endY}`}
                    fill="none"
                    stroke="currentColor"
                    className="text-muted-foreground/30"
                    strokeWidth={2}
                  />
                );
              })}
            </svg>

            {workflow.nodes?.map((node) => {
              const nodeTypeInfo = getNodeTypeInfo((node as any).nodeTypeId ?? node.type);
              const resolvedCategory = nodeTypeInfo?.category ?? node.type;
              const categoryColor = getCategoryColor(resolvedCategory);
              const categoryIcon = getCategoryIcon(resolvedCategory);

              return (
                <Card 
                  key={node.id} 
                  className={`absolute w-[250px] shadow-sm bg-card border-l-4 ${categoryColor.split(' ')[0].replace('text', 'border')} p-4`}
                  style={{ left: node.position.x, top: node.position.y }}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 p-1.5 rounded-md ${categoryColor}`}>
                      {categoryIcon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm truncate">{node.name}</span>
                      </div>
                      <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex justify-between">
                        <span>{nodeTypeInfo?.name || node.type}</span>
                        <span className={`px-1.5 py-0.5 rounded ${categoryColor} bg-opacity-20`}>{nodeTypeInfo?.category || 'Custom'}</span>
                      </div>
                      {nodeTypeInfo?.description && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                          {nodeTypeInfo.description}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
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