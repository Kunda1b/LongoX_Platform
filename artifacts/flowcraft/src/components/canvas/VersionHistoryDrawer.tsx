import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Clock,
  GitBranch,
  RotateCcw,
  CheckCircle2,
  XCircle,
} from "lucide-react";

interface WorkflowVersion {
  id: number;
  versionNumber: number;
  status: "draft" | "published" | "archived";
  checksum: string;
  createdAt: string;
  message?: string;
  isActive: boolean;
}

interface VersionHistoryDrawerProps {
  workflowId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectVersion?: (versionId: number) => void;
  activeVersionId?: number;
}

export function VersionHistoryDrawer({
  workflowId,
  open,
  onOpenChange,
  onSelectVersion,
  activeVersionId,
}: VersionHistoryDrawerProps) {
  const { data: versions = [], isLoading } = useQuery<WorkflowVersion[]>({
    queryKey: ["workflow-versions", workflowId],
    queryFn: () =>
      fetch(`/api/v1/workflows/${workflowId}/versions`).then((r) => r.json()),
    enabled: open,
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-80 sm:w-96">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            Version History
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 mt-4 -mx-6 px-6">
          {isLoading ? (
            <div className="space-y-3">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="animate-pulse h-20 rounded-lg bg-muted"
                />
              ))}
            </div>
          ) : versions.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-muted-foreground">
              <Clock className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-sm font-medium">No versions yet</p>
              <p className="text-xs mt-1">
                Publish this workflow to create a version
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {versions.map((version, idx) => {
                const isActive = version.id === activeVersionId;
                const isLatest = idx === 0;
                return (
                  <button
                    key={version.id}
                    onClick={() => onSelectVersion?.(version.id)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg border transition-colors",
                      isActive
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold">
                          v{version.versionNumber}
                        </span>
                        {isActive && (
                          <Badge className="text-[10px] bg-primary text-primary-foreground">
                            Active
                          </Badge>
                        )}
                        {isLatest && !isActive && (
                          <Badge variant="secondary" className="text-[10px]">
                            Latest
                          </Badge>
                        )}
                      </div>
                      <Badge
                        variant={
                          version.status === "published" ? "default" : "outline"
                        }
                        className="text-[10px] capitalize"
                      >
                        {version.status}
                      </Badge>
                    </div>

                    {version.message && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {version.message}
                      </p>
                    )}

                    <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
                      <span>
                        {new Date(version.createdAt).toLocaleString()}
                      </span>
                      <span className="font-mono opacity-50">
                        {version.checksum.slice(0, 8)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {versions.length > 0 && (
          <div className="border-t pt-4 px-6 -mx-6 mt-4">
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 text-xs"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Compare Versions
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
