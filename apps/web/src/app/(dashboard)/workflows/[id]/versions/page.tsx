"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useListWorkflowVersions } from "@longox/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, History, GitCompare } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { SemanticDiff } from "@/features/workflows/components/semantic-diff";

export default function WorkflowVersionsPage() {
  const params = useParams<{ id: string }>();
  const workflowId = parseInt(params.id ?? "0", 10);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(
    null,
  );

  const { data: versions = [], isLoading } = useListWorkflowVersions(
    workflowId,
    // The generated hook merges user-provided options with the auto-generated
    // queryKey. Cast to `any` to bypass the TS2741 "Property 'queryKey' is
    // missing" error caused by the generated hook's strict UseQueryOptions
    // typing. The runtime merge in getListWorkflowVersionsQueryOptions
    // supplies the queryKey automatically.
    { query: { enabled: !!workflowId } } as any,
  );

  const { data: diffData, isLoading: diffLoading } = useQuery({
    queryKey: ["workflow-version-diff", workflowId, selectedVersionId],
    queryFn: () =>
      fetch(
        `/api/workflows/${workflowId}/versions/${selectedVersionId}/diff`,
      ).then((r) => r.json()),
    enabled: !!selectedVersionId && !!workflowId,
  });

  const sortedVersions = [...versions].reverse();

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-4 border-b pb-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/workflows/${workflowId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Version History</h1>
          <p className="text-sm text-muted-foreground">
            Compare published workflow versions
          </p>
        </div>
      </header>

      <div className="mt-4 flex flex-1 gap-6 overflow-hidden">
        <div className="w-80 shrink-0 overflow-y-auto border-r pr-4">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : sortedVersions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <History className="mb-3 h-10 w-10 text-muted-foreground" />
              <p className="font-medium">No versions yet</p>
              <p className="text-sm text-muted-foreground">
                Publish to create version snapshots.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedVersions.map((v, idx) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVersionId(String(v.id))}
                  className={`w-full rounded-lg border p-3 text-left transition-colors hover:border-primary/50 ${
                    selectedVersionId === String(v.id)
                      ? "border-primary ring-1 ring-primary"
                      : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Badge
                      variant={v.published ? "default" : "secondary"}
                      className="text-xs"
                    >
                      v{v.version}
                    </Badge>
                    {idx === 0 && (
                      <span className="text-xs text-primary">Latest</span>
                    )}
                  </div>
                  {v.changeNote && (
                    <p className="mt-1 text-xs text-muted-foreground truncate">
                      {v.changeNote}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(v.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {selectedVersionId ? (
            diffLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : diffData ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <GitCompare className="h-5 w-5" />
                  <h2 className="text-lg font-semibold">Diff View</h2>
                </div>
                <SemanticDiff workflowDiff={diffData} />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Select a version to view its diff from the previous version.
              </p>
            )
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <GitCompare className="mb-3 h-12 w-12 text-muted-foreground" />
              <p className="font-medium">Select a version</p>
              <p className="text-sm text-muted-foreground">
                Choose a version from the timeline to see what changed.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
