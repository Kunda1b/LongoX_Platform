import { type NodeRunStatus, getStatusColor } from "@longox/workflow-canvas";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react";

interface AnnotationData {
  status: NodeRunStatus;
  executionCount: number;
  lastRunAt?: string;
  lastDurationMs?: number;
  warning?: string;
  error?: string;
}

interface RuntimeAnnotationsProps {
  annotations: Map<string, AnnotationData>;
  nodeId: string;
}

const STATUS_ICONS: Record<string, typeof Loader2> = {
  running: Loader2,
  success: CheckCircle2,
  failed: XCircle,
  skipped: AlertTriangle,
  pending: Clock,
};

export function RuntimeAnnotationBadge({
  annotations,
  nodeId,
}: RuntimeAnnotationsProps) {
  const ann = annotations.get(nodeId);
  if (!ann || ann.executionCount === 0) return null;

  const Icon = STATUS_ICONS[ann.status] ?? Clock;
  const color = getStatusColor(ann.status);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("flex items-center gap-1", color)}>
            <Icon
              className={cn(
                "h-3 w-3",
                ann.status === "running" && "animate-spin",
              )}
            />
            {ann.executionCount > 1 && (
              <span className="text-[9px] font-mono">{ann.executionCount}</span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs space-y-1">
          <div className="flex items-center gap-2">
            <Badge
              variant={
                ann.status === "success"
                  ? "secondary"
                  : ann.status === "failed"
                    ? "destructive"
                    : "outline"
              }
              className="text-[10px]"
            >
              {ann.status}
            </Badge>
            <span className="text-muted-foreground">
              {ann.executionCount} execution(s)
            </span>
          </div>
          {ann.lastRunAt && (
            <p className="text-muted-foreground">
              Last: {new Date(ann.lastRunAt).toLocaleString()}
            </p>
          )}
          {ann.lastDurationMs !== undefined && (
            <p className="text-muted-foreground">
              Duration: {ann.lastDurationMs}ms
            </p>
          )}
          {ann.warning && (
            <p className="text-amber-500">Warning: {ann.warning}</p>
          )}
          {ann.error && <p className="text-red-500">Error: {ann.error}</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
