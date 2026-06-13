"use client";

import { useListDlqEntries, useRetryDlqEntry, getListDlqEntriesQueryKey } from "@longox/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HardDrive, RotateCcw, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function DLQPage() {
  const { data: entries, isLoading } = useListDlqEntries();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const retryMutation = useRetryDlqEntry({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDlqEntriesQueryKey() });
        toast({ title: "Entry requeued" });
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HardDrive className="h-5 w-5" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Dead Letter Queue
            </h1>
            <p className="text-sm text-muted-foreground">
              Failed messages that could not be processed
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <RotateCcw className="mr-1 h-4 w-4" /> Retry All
          </Button>
          <Button variant="destructive" size="sm">
            <Trash2 className="mr-1 h-4 w-4" /> Clear All
          </Button>
        </div>
      </div>

      <div className="rounded-lg border">
        <div className="grid grid-cols-12 gap-4 border-b bg-muted/50 px-4 py-3 text-xs font-medium text-muted-foreground">
          <div className="col-span-2">ID</div>
          <div className="col-span-2">Workflow</div>
          <div className="col-span-2">Node</div>
          <div className="col-span-3">Error</div>
          <div className="col-span-1">Attempts</div>
          <div className="col-span-2">Actions</div>
        </div>
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="grid grid-cols-12 gap-4 border-b px-4 py-3 last:border-0">
              <div className="col-span-12">
                <Skeleton className="h-5 w-full" />
              </div>
            </div>
          ))
        ) : entries?.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 p-12 text-center">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
              <HardDrive className="size-6" />
            </div>
            <div className="flex max-w-sm flex-col items-center gap-1">
              <div className="text-lg font-medium tracking-tight">
                No failed messages
              </div>
              <p className="text-sm text-muted-foreground">
                All messages are being processed successfully
              </p>
            </div>
          </div>
        ) : (
          entries?.map((entry) => (
            <div
              key={entry.id}
              className="grid grid-cols-12 gap-4 border-b px-4 py-3 text-sm last:border-0"
            >
              <div className="col-span-2 font-mono text-xs">{entry.id}</div>
              <div className="col-span-2">{entry.workflowName}</div>
              <div className="col-span-2 text-muted-foreground text-xs">
                {entry.nodeName}
              </div>
              <div className="col-span-3 text-destructive text-xs">
                {entry.errorMessage}
              </div>
              <div className="col-span-1 text-muted-foreground text-xs">
                {entry.attempts}
              </div>
              <div className="col-span-2 flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => retryMutation.mutate({ id: entry.id })}
                  disabled={retryMutation.isPending}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
