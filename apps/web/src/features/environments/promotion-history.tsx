"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { ArrowRight, CheckCircle2, XCircle, RotateCcw } from "lucide-react";

interface Promotion {
  id: number;
  workflowId: number;
  workflowName: string;
  fromEnvironment: string;
  toEnvironment: string;
  status: string;
  promotedBy: string;
  approvedBy: string | null;
  notes: string | null;
  createdAt: string;
}

export function PromotionHistory() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/environments/promotions")
      .then((res) => res.json())
      .then((data) => setPromotions(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "promoted":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "rolled_back":
        return <RotateCcw className="h-4 w-4 text-orange-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <CheckCircle2 className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "promoted":
        return "success" as const;
      case "rolled_back":
        return "warning" as const;
      case "failed":
        return "destructive" as const;
      default:
        return "secondary" as const;
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (promotions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        No promotions yet. Promote a workflow to get started.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {promotions.map((p) => (
        <Card key={p.id}>
          <CardContent className="flex items-center gap-4 p-4">
            {getStatusIcon(p.status)}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate">
                  {p.workflowName}
                </span>
                <Badge variant={getStatusColor(p.status)} className="text-xs capitalize">
                  {p.status.replace("_", " ")}
                </Badge>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                <Badge variant="outline" className="text-xs">{p.fromEnvironment}</Badge>
                <ArrowRight className="h-3 w-3" />
                <Badge variant="outline" className="text-xs">{p.toEnvironment}</Badge>
                <span className="mx-1">&middot;</span>
                <span>by {p.promotedBy}</span>
                <span className="mx-1">&middot;</span>
                <span>{formatDistanceToNow(new Date(p.createdAt), { addSuffix: true })}</span>
              </div>
              {p.notes && (
                <p className="text-xs text-muted-foreground mt-1 italic">
                  {p.notes}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
