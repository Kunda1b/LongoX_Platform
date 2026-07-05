"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Undo2, ArrowRight } from "lucide-react";

interface Promotion {
  id: string;
  workflowId: string;
  workflowName: string;
  fromEnvironment: string;
  toEnvironment: string;
  status: string;
  promotedBy: string;
  createdAt: string;
}

export function RollbackPanel() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [rollingBack, setRollingBack] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    fetch("/api/environments/promotions")
      .then((res) => res.json())
      .then((data) =>
        setPromotions(data.filter((p: Promotion) => p.status === "promoted")),
      )
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleRollback = async (promotionId: number) => {
    setRollingBack(String(promotionId));
    try {
      const res = await fetch("/api/environments/rollback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promotionId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Rollback failed");
      }
      toast({ title: "Rollback successful" });
      setPromotions((prev) => prev.filter((p) => p.id !== String(promotionId)));
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "Rollback failed",
        variant: "destructive",
      });
    } finally {
      setRollingBack(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (promotions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        No promotions available to roll back.
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Workflow</TableHead>
            <TableHead>From</TableHead>
            <TableHead>To</TableHead>
            <TableHead>Promoted By</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {promotions.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="font-medium">{p.workflowName}</TableCell>
              <TableCell>
                <Badge variant="outline">{p.fromEnvironment}</Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Badge variant="outline">{p.fromEnvironment}</Badge>
                  <ArrowRight className="h-3 w-3" />
                  <Badge variant="outline">{p.toEnvironment}</Badge>
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {p.promotedBy}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(p.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRollback(p.id as any)}
                  disabled={rollingBack === String(p.id)}
                >
                  <Undo2 className="h-3 w-3 mr-1" />
                  {rollingBack === String(p.id)
                    ? "Rolling back..."
                    : "Rollback"}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
