"use client";

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

const items = [
  {
    name: "Slack Connector Pro",
    desc: "Advanced Slack integration with rich messaging",
    type: "connector",
    price: "Free",
    downloads: 1200,
  },
  {
    name: "AI Text Analyzer",
    desc: "Analyze text using GPT models",
    type: "plugin",
    price: "$9.99/mo",
    downloads: 340,
  },
  {
    name: "Data Transform Suite",
    desc: "Transform data between formats",
    type: "plugin",
    price: "$4.99/mo",
    downloads: 560,
  },
  {
    name: "PostgreSQL Monitor",
    desc: "Monitor and alert on DB health",
    type: "connector",
    price: "Free",
    downloads: 890,
  },
];

export default function MarketplacePage() {
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
        <Input placeholder="Search marketplace..." className="pl-9" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Card key={item.name}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <ShoppingCart className="h-5 w-5 text-primary" />
                <Badge variant="secondary" className="text-xs">
                  {item.type}
                </Badge>
              </div>
              <CardTitle className="mt-2 text-sm">{item.name}</CardTitle>
              <CardDescription className="text-xs">{item.desc}</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold">{item.price}</span>
                <span className="ml-2 text-xs text-muted-foreground">
                  {item.downloads} downloads
                </span>
              </div>
              <Button size="sm">
                <Download className="mr-1 h-4 w-4" /> Install
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
