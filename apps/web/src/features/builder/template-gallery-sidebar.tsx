"use client";

import { useState } from "react";
import { useListTemplates, useGetTemplate } from "@longox/api-client-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LayoutTemplate,
  Search,
  X,
  AlertTriangle,
  Check,
  Star,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Node } from "@xyflow/react";
import type { WorkflowNode } from "@longox/api-client-react";
import { generateNodeId } from "./workflow-builder";

function templateNodesToFlow(nodes: WorkflowNode[]): Node[] {
  return nodes.map((n, i) => ({
    id: generateNodeId(),
    type: "flowNode",
    position: { x: 100 + (i % 3) * 220, y: 80 + Math.floor(i / 3) * 160 },
    data: {
      label: n.label ?? n.nodeTypeName ?? "",
      nodeTypeId: n.nodeTypeId ?? "",
      category: n.category ?? "action",
      description: n.description ?? "",
      nodeTypeName: n.nodeTypeName ?? n.label ?? "",
      inputs: n.inputs ?? [],
      outputs: n.outputs ?? [],
      config: n.config ?? {},
    },
  }));
}

export function TemplateGallerySidebar({
  open,
  onClose,
  onApplyTemplate,
}: {
  open: boolean;
  onClose: () => void;
  onApplyTemplate: (nodes: Node[]) => void;
}) {
  const [search, setSearch] = useState("");
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const { data: templates = [], isLoading } = useListTemplates({ search });

  const { data: selectedTemplate, isFetching: templateLoading } =
    useGetTemplate(confirmId!, { query: { enabled: confirmId !== null } });

  if (!open) return null;

  return (
    <>
      <div className="w-72 shrink-0 border-l bg-card/50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-3 border-b">
          <div className="flex items-center gap-2">
            <LayoutTemplate className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Templates
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onClose}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Search */}
        <div className="px-3 py-2 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              className="h-8 pl-8 text-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Template list */}
        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="p-3 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : templates.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-6 text-center">
              <LayoutTemplate className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground">
                {search
                  ? "No templates match your search"
                  : "No templates available"}
              </p>
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {templates.map((t) => (
                <div
                  key={t.id}
                  className="rounded-lg border p-3 space-y-2 hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => setConfirmId(t.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold leading-tight line-clamp-2 flex-1">
                      {t.name}
                    </span>
                    <Badge variant="secondary" className="shrink-0 text-[10px] px-1.5 py-0">
                      {t.category}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground/70 line-clamp-2">
                    {t.description}
                  </p>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span>{t.nodeCount} nodes</span>
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      {t.complexity}
                    </span>
                    <span>{t.uses} uses</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Confirm apply dialog */}
      <Dialog open={confirmId !== null} onOpenChange={(o) => !o && setConfirmId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LayoutTemplate className="h-5 w-5 text-primary" />
              Apply Template
            </DialogTitle>
            <DialogDescription>
              This will replace your current workflow with the template&apos;s nodes.
            </DialogDescription>
          </DialogHeader>

          {templateLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : selectedTemplate ? (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold">{selectedTemplate.name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedTemplate.description}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="text-[10px]">
                  {selectedTemplate.category}
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  {selectedTemplate.nodeCount} nodes
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  {selectedTemplate.complexity}
                </Badge>
              </div>
              <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-600/90 dark:text-amber-400/90">
                  Applying this template will replace all existing nodes and edges
                  in your current workflow. This action cannot be undone.
                </p>
              </div>
            </div>
          ) : null}

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setConfirmId(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="gap-1.5"
              disabled={!selectedTemplate || templateLoading}
              onClick={() => {
                if (selectedTemplate?.nodes) {
                  const flowNodes = templateNodesToFlow(selectedTemplate.nodes);
                  onApplyTemplate(flowNodes);
                }
                setConfirmId(null);
                onClose();
              }}
            >
              <Check className="h-3.5 w-3.5" />
              Apply Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
