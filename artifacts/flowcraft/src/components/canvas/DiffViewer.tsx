import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  computeDiff,
  type DiffResult,
  type GraphChange,
  getChangeDescription,
} from "@autoflow/workflow-canvas";
import type { WorkflowGraph } from "@autoflow/workflow-canvas";
import {
  PlusCircle,
  MinusCircle,
  Edit3,
  ArrowRightCircle,
  XCircle,
} from "lucide-react";

interface DiffViewerProps {
  fromGraph: WorkflowGraph;
  toGraph: WorkflowGraph;
  fromVersion: number;
  toVersion: number;
}

const CHANGE_ICONS: Record<string, typeof PlusCircle> = {
  node_added: PlusCircle,
  node_removed: MinusCircle,
  node_modified: Edit3,
  edge_added: ArrowRightCircle,
  edge_removed: XCircle,
};

const CHANGE_COLORS: Record<string, string> = {
  node_added: "text-green-500 border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900",
  node_removed: "text-red-500 border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900",
  node_modified: "text-amber-500 border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900",
  edge_added: "text-blue-500 border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900",
  edge_removed: "text-red-500 border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900",
};

export function DiffViewer({ fromGraph, toGraph, fromVersion, toVersion }: DiffViewerProps) {
  const diff = useMemo(
    () => computeDiff(fromGraph, toGraph, fromVersion, toVersion),
    [fromGraph, toGraph, fromVersion, toVersion],
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            Changes from v{fromVersion} → v{toVersion}
          </CardTitle>
          <div className="flex items-center gap-2">
            <DiffBadge count={diff.summary.nodesAdded} label="added" variant="success" />
            <DiffBadge count={diff.summary.nodesRemoved} label="removed" variant="destructive" />
            <DiffBadge count={diff.summary.nodesModified} label="modified" variant="warning" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="max-h-96">
          {diff.changes.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-muted-foreground">
              <p className="text-sm font-medium">No changes detected</p>
              <p className="text-xs mt-1">These versions are identical</p>
            </div>
          ) : (
            <div className="divide-y">
              {diff.changes.map((change, i) => {
                const Icon = CHANGE_ICONS[change.type] ?? PlusCircle;
                const colorClass = CHANGE_COLORS[change.type] ?? "";
                return (
                  <div
                    key={i}
                    className={cn(
                      "flex items-start gap-3 px-4 py-3 text-xs",
                      colorClass.split(" ").slice(2).join(" ")
                    )}
                  >
                    <Icon className="h-4 w-4 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{getChangeDescription(change)}</p>
                      {change.type === "node_modified" && "detail" in change && (
                        <p className="text-muted-foreground mt-0.5 text-[10px]">
                          {change.detail}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function DiffBadge({
  count,
  label,
  variant,
}: {
  count: number;
  label: string;
  variant: "success" | "destructive" | "warning";
}) {
  if (count === 0) return null;
  const colors = {
    success: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    destructive: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    warning: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  };
  return (
    <Badge variant="outline" className={cn("text-[10px] px-1.5", colors[variant])}>
      {count} {label}
    </Badge>
  );
}
