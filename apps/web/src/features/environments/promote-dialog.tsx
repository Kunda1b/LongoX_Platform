"use client";

import { useState } from "react";
import {
  useListWorkflows,
  useListEnvironments,
} from "@longox/api-client-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export function PromoteDialog() {
  const [workflowId, setWorkflowId] = useState("");
  const [fromEnv, setFromEnv] = useState("");
  const [toEnv, setToEnv] = useState("");
  const [notes, setNotes] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { data: workflows } = useListWorkflows();
  const { data: environments } = useListEnvironments();
  const { toast } = useToast();

  const handlePromote = async () => {
    if (!workflowId || !fromEnv || !toEnv) {
      toast({
        title: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/environments/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflowId: String(workflowId),
          fromEnvironment: fromEnv,
          toEnvironment: toEnv,
          notes: notes || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Promotion failed");
      }
      toast({ title: "Workflow promoted successfully" });
      setOpen(false);
      setWorkflowId("");
      setFromEnv("");
      setToEnv("");
      setNotes("");
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "Promotion failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm">
          Promote Workflow
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Promote Workflow</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Workflow</label>
            <Select value={workflowId} onValueChange={setWorkflowId}>
              <SelectTrigger>
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">From</label>
              <Select value={fromEnv} onValueChange={setFromEnv}>
                <SelectTrigger>
                  <SelectValue placeholder="Source env" />
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
            <div className="space-y-2">
              <label className="text-sm font-medium">To</label>
              <Select value={toEnv} onValueChange={setToEnv}>
                <SelectTrigger>
                  <SelectValue placeholder="Target env" />
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
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Notes (optional)</label>
            <Textarea
              placeholder="Add notes about this promotion..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <Button onClick={handlePromote} disabled={loading} className="w-full">
            {loading ? "Promoting..." : "Promote"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
