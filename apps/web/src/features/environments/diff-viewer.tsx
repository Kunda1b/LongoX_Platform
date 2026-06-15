"use client";

import { useState } from "react";
import { useListWorkflows, useListEnvironments } from "@longox/api-client-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileDiff, ArrowRight } from "lucide-react";

export function DiffViewer() {
  const [workflowId, setWorkflowId] = useState("");
  const [fromEnv, setFromEnv] = useState("");
  const [toEnv, setToEnv] = useState("");
  const [diff, setDiff] = useState<{ from: unknown; to: unknown } | null>(null);
  const [loading, setLoading] = useState(false);
  const { data: workflows } = useListWorkflows();
  const { data: environments } = useListEnvironments();

  const handleDiff = async () => {
    if (!workflowId || !fromEnv || !toEnv) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/environments/diff/${workflowId}?from=${fromEnv}&to=${toEnv}`,
      );
      if (res.ok) {
        setDiff(await res.json());
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Workflow</label>
          <Select value={workflowId} onValueChange={setWorkflowId}>
            <SelectTrigger className="w-60">
              <SelectValue placeholder="Select workflow" />
            </SelectTrigger>
            <SelectContent>
              {workflows?.map((w) => (
                <SelectItem key={w.id} value={String(w.id)}>
                  {w.name ?? `Workflow #${w.id}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">From</label>
          <Select value={fromEnv} onValueChange={setFromEnv}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              {environments?.map((e) => (
                <SelectItem key={e.id} value={e.name}>
                  {e.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <ArrowRight className="h-4 w-4 mb-3 text-muted-foreground" />
        <div className="space-y-2">
          <label className="text-sm font-medium">To</label>
          <Select value={toEnv} onValueChange={setToEnv}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Target" />
            </SelectTrigger>
            <SelectContent>
              {environments?.map((e) => (
                <SelectItem key={e.id} value={e.name}>
                  {e.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleDiff} disabled={!workflowId || !fromEnv || !toEnv || loading}>
          <FileDiff className="h-4 w-4 mr-1" />
          {loading ? "Loading..." : "Compare"}
        </Button>
      </div>

      {diff && (
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline">{fromEnv}</Badge>
                <span className="text-xs text-muted-foreground">
                  v{String((diff.from as Record<string, unknown>)?.version ?? "-")}
                </span>
              </div>
              <pre className="text-xs bg-muted rounded p-3 overflow-auto max-h-96 font-mono">
                {String(JSON.stringify((diff.from as Record<string, unknown>)?.nodes ?? null, null, 2) ?? "")}
              </pre>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline">{toEnv}</Badge>
                <span className="text-xs text-muted-foreground">
                  v{String((diff.to as Record<string, unknown>)?.version ?? "-")}
                </span>
              </div>
              <pre className="text-xs bg-muted rounded p-3 overflow-auto max-h-96 font-mono">
                {String(JSON.stringify((diff.to as Record<string, unknown>)?.nodes ?? null, null, 2) ?? "")}
              </pre>
            </CardContent>
          </Card>
        </div>
      )}

      {!diff && !loading && (
        <div className="rounded-lg border border-dashed p-12 text-center text-sm text-muted-foreground">
          Select a workflow and two environments to compare versions.
        </div>
      )}
    </div>
  );
}
