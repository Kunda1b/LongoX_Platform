"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HardDrive, Check } from "lucide-react";

const models = [
  { name: "GPT-4o", provider: "OpenAI", status: "available", latency: "1.2s" },
  { name: "Claude 3.5 Sonnet", provider: "Anthropic", status: "available", latency: "1.8s" },
  { name: "Llama 3 70B", provider: "Meta", status: "maintenance", latency: "2.1s" },
  { name: "Mistral Large", provider: "Mistral", status: "available", latency: "1.5s" },
];

export default function AIModelsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AI Models</h1>
        <p className="text-sm text-muted-foreground">Manage and monitor AI models</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {models.map((m) => (
          <Card key={m.name}>
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div>
                <CardTitle className="text-sm">{m.name}</CardTitle>
                <CardDescription className="text-xs">{m.provider}</CardDescription>
              </div>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant={m.status === "available" ? "success" : "warning"}>{m.status}</Badge>
                <span className="text-xs text-muted-foreground">{m.latency}</span>
              </div>
              <Button variant="ghost" size="sm">{m.status === "available" ? <Check className="h-4 w-4 text-emerald-500" /> : "Enable"}</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
