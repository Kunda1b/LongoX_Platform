"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Plus, Copy } from "lucide-react";

const promptTemplates = [
  { name: "Summarize Text", model: "GPT-4o", usage: 234, version: "v2" },
  { name: "Extract Data", model: "Claude 3.5", usage: 156, version: "v1" },
  { name: "Generate Report", model: "GPT-4o", usage: 89, version: "v3" },
];

export default function PromptsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Prompts</h1>
          <p className="text-sm text-muted-foreground">Manage AI prompt templates</p>
        </div>
        <Button><Plus className="mr-1 h-4 w-4" /> New Prompt</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {promptTemplates.map((p) => (
          <Card key={p.name}>
            <CardHeader>
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle className="mt-2 text-sm">{p.name}</CardTitle>
              <CardDescription className="text-xs">Model: {p.model}</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{p.usage} uses</span>
                <Badge variant="secondary">{p.version}</Badge>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8"><Copy className="h-4 w-4" /></Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
