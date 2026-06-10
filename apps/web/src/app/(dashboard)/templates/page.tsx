"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Star, LayoutTemplate } from "lucide-react";

const templates = [
  { name: "Order Processing Pipeline", desc: "Process orders from API to database with notifications", category: "ecommerce", uses: 42, rating: 4.5 },
  { name: "Data Sync Every 15min", desc: "Sync data between Postgres and external APIs on a schedule", category: "data", uses: 28, rating: 4.2 },
  { name: "Slack Alerting", desc: "Send alerts to Slack channels based on conditions", category: "notifications", uses: 35, rating: 4.8 },
  { name: "Email Digest", desc: "Collect and send periodic email digests", category: "email", uses: 19, rating: 4.0 },
];

export default function TemplatesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Templates</h1>
        <p className="text-sm text-muted-foreground">Pre-built workflow templates</p>
      </div>

      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search templates..." className="pl-9" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((t) => (
          <Card key={t.name} className="cursor-pointer transition-colors hover:border-primary/50">
            <CardHeader>
              <div className="flex items-start justify-between">
                <LayoutTemplate className="h-5 w-5 text-primary" />
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  {t.rating}
                </div>
              </div>
              <CardTitle className="mt-2 text-sm">{t.name}</CardTitle>
              <CardDescription className="text-xs">{t.desc}</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <Badge variant="secondary" className="text-xs">{t.category}</Badge>
              <span className="text-xs text-muted-foreground">{t.uses} uses</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
