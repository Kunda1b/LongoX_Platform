"use client";

import { useState } from "react";
import { useListTemplates, customFetch } from "@longox/api-client-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Star, LayoutTemplate, Upload, DollarSign, Share } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function TemplatesPage() {
  const [search, setSearch] = useState("");
  const { data: templates, isLoading } = useListTemplates({ search });

  const handlePublish = async (t: any) => {
    try {
      await customFetch('/api/marketplace/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: t.name,
          description: t.description,
          listingType: 'template',
          category: t.category,
          tags: t.tags,
          pricing: { free: true }
        })
      });
      alert(`Published ${t.name} to marketplace!`);
    } catch (e) {
      alert("Failed to publish");
    }
  };

  const handleSell = async (t: any) => {
    const priceStr = window.prompt("Enter price (in cents, e.g. 1000 for $10.00):");
    if (!priceStr) return;
    const price = parseInt(priceStr, 10);
    if (isNaN(price)) return alert("Invalid price");
    try {
      await customFetch('/api/marketplace/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: t.name,
          description: t.description,
          listingType: 'template',
          category: t.category,
          tags: t.tags,
          pricing: { free: false, price }
        })
      });
      alert(`Listed ${t.name} for sale at $${(price / 100).toFixed(2)}!`);
    } catch (e) {
      alert("Failed to list for sale");
    }
  };

  const handleShare = (t: any) => {
    const url = `${window.location.origin}/templates/shared/${t.id}`;
    navigator.clipboard.writeText(url);
    alert(`Copied share link to clipboard: ${url}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Templates</h1>
        <p className="text-sm text-muted-foreground">
          Pre-built workflow templates
        </p>
      </div>

      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search templates..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))
        ) : templates?.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-12 text-center">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
              <LayoutTemplate className="size-6" />
            </div>
            <div className="flex max-w-sm flex-col items-center gap-1">
              <div className="text-lg font-medium tracking-tight">
                No templates found
              </div>
              <p className="text-sm text-muted-foreground">
                {search
                  ? "Try a different search term"
                  : "Templates will appear here once created"}
              </p>
            </div>
          </div>
        ) : (
          templates?.map((t) => (
            <Card
              key={t.id}
              className="cursor-pointer transition-colors hover:border-primary/50"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <LayoutTemplate className="h-5 w-5 text-primary" />
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    {t.complexity}
                  </div>
                </div>
                <CardTitle className="mt-2 text-sm">{t.name}</CardTitle>
                <CardDescription className="text-xs">
                  {t.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <Badge variant="secondary" className="text-xs">
                  {t.category}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {t.uses} uses
                </span>
              </CardContent>
              <CardFooter className="flex gap-2 p-4 pt-0">
                <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={(e) => { e.stopPropagation(); handlePublish(t); }}>
                  <Upload className="mr-1 h-3 w-3" /> Publish
                </Button>
                <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={(e) => { e.stopPropagation(); handleSell(t); }}>
                  <DollarSign className="mr-1 h-3 w-3" /> Sell
                </Button>
                <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={(e) => { e.stopPropagation(); handleShare(t); }}>
                  <Share className="mr-1 h-3 w-3" /> Share
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
