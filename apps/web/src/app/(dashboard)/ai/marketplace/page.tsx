"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Brain,
  Download,
  Search,
  Star,
  Plus,
  Bot,
  Upload,
  DollarSign,
  Globe,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

export default function AIMarketplacePage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishForm, setPublishForm] = useState({
    title: "",
    description: "",
    category: "general",
    pricing: "free",
    price: "",
    platformSharePercent: 20,
    isPublic: true,
    communityTemplate: false,
  });

  const {
    data: listings,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["ai-marketplace-listings"],
    queryFn: async () => {
      const res = await fetch(
        "/api/marketplace/listings?type=agent&isPublic=true",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok) throw new Error("Failed to fetch AI agent listings");
      return res.json();
    },
    enabled: !!token,
  });

  const installMutation = useMutation({
    mutationFn: async (listingId: string) => {
      const res = await fetch(
        `/api/marketplace/listings/${listingId}/install`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({}),
        },
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Install failed");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Agent installed successfully" });
      refetch();
    },
    onError: (err) => {
      toast({
        title: "Install failed",
        description: (err as Error).message,
        variant: "destructive",
      });
    },
  });

  const deployMutation = useMutation({
    mutationFn: async ({
      listingId,
      config,
    }: {
      listingId: string;
      config?: Record<string, unknown>;
    }) => {
      const res = await fetch(`/api/marketplace/listings/${listingId}/deploy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ targetEnvironment: "sandbox", config }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Deploy failed");
      }
      return res.json();
    },
    onSuccess: (result) => {
      toast({
        title: "Agent deployed",
        description: `Deployment ID: ${result.deploymentId}`,
      });
    },
    onError: (err) => {
      toast({
        title: "Deploy failed",
        description: (err as Error).message,
        variant: "destructive",
      });
    },
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      const body: Record<string, unknown> = {
        title: publishForm.title,
        description: publishForm.description,
        listingType: "agent",
        category: publishForm.category,
        isPublic: publishForm.isPublic,
        communityTemplate: publishForm.communityTemplate,
        platformSharePercent: publishForm.platformSharePercent,
        pricing: {
          free: publishForm.pricing === "free",
          ...(publishForm.pricing === "paid"
            ? { price: parseInt(publishForm.price) * 100 }
            : {}),
        },
        metadata: {
          source: "ai-marketplace",
          agentRuntime: true,
        },
      };

      const res = await fetch("/api/marketplace/listings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Publish failed");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Agent published to marketplace" });
      setPublishOpen(false);
      refetch();
    },
    onError: (err) => {
      toast({
        title: "Publish failed",
        description: (err as Error).message,
        variant: "destructive",
      });
    },
  });

  const filtered = Array.isArray(listings)
    ? listings.filter(
        (l: any) =>
          l.title.toLowerCase().includes(search.toLowerCase()) ||
          l.description.toLowerCase().includes(search.toLowerCase()),
      )
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            AI Agent Marketplace
          </h1>
          <p className="text-sm text-muted-foreground">
            Discover, install, and deploy AI agents built by the community
          </p>
        </div>
        <Dialog open={publishOpen} onOpenChange={setPublishOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="mr-1 h-4 w-4" /> Publish Agent
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Publish AI Agent to Marketplace</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={publishForm.title}
                  onChange={(e) =>
                    setPublishForm((f) => ({ ...f, title: e.target.value }))
                  }
                  placeholder="My AI Agent"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Input
                  value={publishForm.description}
                  onChange={(e) =>
                    setPublishForm((f) => ({
                      ...f,
                      description: e.target.value,
                    }))
                  }
                  placeholder="What does this agent do?"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Select
                    value={publishForm.category}
                    onValueChange={(v) =>
                      setPublishForm((f) => ({ ...f, category: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="data">Data Processing</SelectItem>
                      <SelectItem value="coding">Coding</SelectItem>
                      <SelectItem value="writing">Writing</SelectItem>
                      <SelectItem value="research">Research</SelectItem>
                      <SelectItem value="automation">Automation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Pricing</label>
                  <Select
                    value={publishForm.pricing}
                    onValueChange={(v) =>
                      setPublishForm((f) => ({ ...f, pricing: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {publishForm.pricing === "paid" && (
                <div>
                  <label className="text-sm font-medium">Price (USD)</label>
                  <Input
                    type="number"
                    value={publishForm.price}
                    onChange={(e) =>
                      setPublishForm((f) => ({ ...f, price: e.target.value }))
                    }
                    placeholder="9.99"
                  />
                </div>
              )}
              <div>
                <label className="text-sm font-medium">
                  Platform Share (%)
                </label>
                <Input
                  type="number"
                  value={publishForm.platformSharePercent}
                  onChange={(e) =>
                    setPublishForm((f) => ({
                      ...f,
                      platformSharePercent: parseInt(e.target.value),
                    }))
                  }
                  min={0}
                  max={100}
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={publishForm.isPublic}
                    onChange={(e) =>
                      setPublishForm((f) => ({
                        ...f,
                        isPublic: e.target.checked,
                      }))
                    }
                  />
                  Public listing
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={publishForm.communityTemplate}
                    onChange={(e) =>
                      setPublishForm((f) => ({
                        ...f,
                        communityTemplate: e.target.checked,
                      }))
                    }
                  />
                  Community template
                </label>
              </div>
              <Button
                className="w-full"
                onClick={() => publishMutation.mutate()}
                disabled={publishMutation.isPending || !publishForm.title}
              >
                {publishMutation.isPending
                  ? "Publishing..."
                  : "Publish to Marketplace"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search AI agents..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Agents</TabsTrigger>
          <TabsTrigger value="free">Free</TabsTrigger>
          <TabsTrigger value="paid">Paid</TabsTrigger>
          <TabsTrigger value="community">Community</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-44 w-full" />
              ))
            ) : filtered.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-12 text-center">
                <Brain className="size-8 text-muted-foreground" />
                <p className="text-lg font-medium">No AI agents found</p>
                <p className="text-sm text-muted-foreground">
                  {search
                    ? "Try a different search term"
                    : "Be the first to publish an AI agent"}
                </p>
              </div>
            ) : (
              filtered.map((listing: any) => (
                <Card key={listing.id} className="flex flex-col">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <Bot className="h-5 w-5 text-primary" />
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        <span className="text-xs">
                          {listing.rating?.toFixed(1) ?? "0.0"}
                        </span>
                      </div>
                    </div>
                    <CardTitle className="mt-2 text-sm">
                      {listing.title}
                    </CardTitle>
                    <CardDescription className="text-xs line-clamp-2 min-h-8">
                      {listing.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="flex flex-wrap gap-1 mb-2">
                      <Badge variant="secondary" className="text-xs">
                        {listing.category}
                      </Badge>
                      {listing.communityTemplate && (
                        <Badge
                          variant="outline"
                          className="text-xs flex items-center gap-1"
                        >
                          <Globe className="h-3 w-3" /> Community
                        </Badge>
                      )}
                      <Badge
                        variant={listing.pricing?.free ? "success" : "default"}
                        className="text-xs"
                      >
                        {listing.pricing?.free
                          ? "Free"
                          : `$${((listing.pricing?.price ?? 0) / 100).toFixed(2)}`}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {listing.installCount ?? 0} installs | v
                      {listing.version ?? "1.0"}
                    </div>
                  </CardContent>
                  <CardFooter className="gap-2 pt-0">
                    <Button
                      size="sm"
                      variant="default"
                      className="flex-1 text-xs"
                      onClick={() => installMutation.mutate(listing.id)}
                      disabled={installMutation.isPending}
                    >
                      <Download className="mr-1 h-3 w-3" /> Install
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs"
                      onClick={() =>
                        deployMutation.mutate({ listingId: listing.id })
                      }
                      disabled={deployMutation.isPending}
                    >
                      <Bot className="mr-1 h-3 w-3" /> Deploy
                    </Button>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="free">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered
              .filter((l: any) => l.pricing?.free)
              .map((listing: any) => (
                <Card key={listing.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{listing.title}</CardTitle>
                    <CardDescription className="text-xs line-clamp-2">
                      {listing.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="success" className="text-xs">
                      Free
                    </Badge>
                  </CardContent>
                  <CardFooter>
                    <Button
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => installMutation.mutate(listing.id)}
                    >
                      <Download className="mr-1 h-3 w-3" /> Install
                    </Button>
                  </CardFooter>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="paid">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered
              .filter((l: any) => !l.pricing?.free)
              .map((listing: any) => (
                <Card key={listing.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{listing.title}</CardTitle>
                    <CardDescription className="text-xs line-clamp-2">
                      {listing.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-500" />
                      <span className="text-lg font-bold">
                        ${((listing.pricing?.price ?? 0) / 100).toFixed(2)}
                      </span>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => installMutation.mutate(listing.id)}
                    >
                      <Download className="mr-1 h-3 w-3" /> Purchase & Install
                    </Button>
                  </CardFooter>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="community">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered
              .filter((l: any) => l.communityTemplate)
              .map((listing: any) => (
                <Card key={listing.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-1 mb-1">
                      <Globe className="h-4 w-4 text-blue-500" />
                      <span className="text-xs font-medium text-blue-500">
                        Community
                      </span>
                    </div>
                    <CardTitle className="text-sm">{listing.title}</CardTitle>
                    <CardDescription className="text-xs line-clamp-2">
                      {listing.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <span className="text-xs text-muted-foreground">
                      By {listing.author}
                    </span>
                  </CardContent>
                  <CardFooter>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs"
                      onClick={() => installMutation.mutate(listing.id)}
                    >
                      <Plus className="mr-1 h-3 w-3" /> Add to workspace
                    </Button>
                  </CardFooter>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
