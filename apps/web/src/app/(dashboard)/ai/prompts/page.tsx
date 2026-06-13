"use client";

import { useListPrompts } from "@longox/api-client-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Plus, Copy } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function PromptsPage() {
  const { data: prompts, isLoading } = useListPrompts();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Prompts</h1>
          <p className="text-sm text-muted-foreground">
            Manage AI prompt templates
          </p>
        </div>
        <Button>
          <Plus className="mr-1 h-4 w-4" /> New Prompt
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))
        ) : prompts?.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-12 text-center">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
              <FileText className="size-6" />
            </div>
            <div className="flex max-w-sm flex-col items-center gap-1">
              <div className="text-lg font-medium tracking-tight">
                No prompts yet
              </div>
              <p className="text-sm text-muted-foreground">
                Create prompt templates for your AI workflows
              </p>
            </div>
            <Button className="mt-2">
              <Plus className="mr-1 h-4 w-4" /> Create your first prompt
            </Button>
          </div>
        ) : (
          prompts?.map((p) => (
            <Card key={p.id}>
              <CardHeader>
                <FileText className="h-5 w-5 text-primary" />
                <CardTitle className="mt-2 text-sm">{p.name}</CardTitle>
                <CardDescription className="text-xs">
                  {p.description || "No description"}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">v{p.version}</Badge>
                  <Badge
                    variant={
                      p.status === "approved"
                        ? "success"
                        : p.status === "review"
                          ? "warning"
                          : "secondary"
                    }
                  >
                    {p.status}
                  </Badge>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Copy className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
