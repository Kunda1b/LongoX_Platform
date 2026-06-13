"use client";

import { useListConnectors, useListTemplates } from "@longox/api-client-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ShoppingCart, Download } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useMemo } from "react";

export function MarketplaceList() {
  const [search, setSearch] = useState("");
  const { data: connectors, isLoading: loadingConnectors } = useListConnectors();
  const { data: templates, isLoading: loadingTemplates } = useListTemplates();

  const items = useMemo(() => {
    const arr = [];
    if (connectors) {
      arr.push(...connectors.map(c => ({
        id: `connector-${c.id}`,
        name: c.displayName || c.name,
        desc: c.description || "No description provided",
        type: "connector",
        price: "Free",
        downloads: c.actionCount + c.triggerCount * 10,
        installed: c.isInstalled,
      })));
    }
    if (templates) {
      arr.push(...templates.map(t => ({
        id: `template-${t.id}`,
        name: t.name,
        desc: t.description || "No description provided",
        type: "template",
        price: "Free",
        downloads: t.useCount || 0,
        installed: false,
      })));
    }
    return arr.filter(i => 
      i.name.toLowerCase().includes(search.toLowerCase()) || 
      i.desc.toLowerCase().includes(search.toLowerCase())
    );
  }, [connectors, templates, search]);

  const isLoading = loadingConnectors || loadingTemplates;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Marketplace</h1>
        <p className="text-sm text-muted-foreground">
          Discover connectors and plugins
        </p>
      </div>

      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input 
          placeholder="Search marketplace..." 
          className="pl-9" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full" />
          ))
        ) : items.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            No marketplace items found.
          </div>
        ) : (
          items.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                  <Badge variant="secondary" className="text-xs">
                    {item.type}
                  </Badge>
                </div>
                <CardTitle className="mt-2 text-sm">{item.name}</CardTitle>
                <CardDescription className="text-xs line-clamp-2 min-h-8">
                  {item.desc}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold">{item.price}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {item.downloads} downloads
                  </span>
                </div>
                <Button size="sm" variant={item.installed ? "secondary" : "default"}>
                  {item.installed ? (
                    "Installed"
                  ) : (
                    <><Download className="mr-1 h-4 w-4" /> Install</>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
