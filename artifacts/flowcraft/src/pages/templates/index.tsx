import { useState } from "react";
import { useLocation } from "wouter";
import { useListTemplates, useUseTemplate } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Layers, Activity } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = ["All", "Sales", "Support", "Data", "Reporting", "Operations", "Developer", "Research"];

export default function Templates() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: templates = [], isLoading } = useListTemplates();

  const useMutation = useUseTemplate({
    mutation: {
      onSuccess: (newWorkflow) => {
        toast({ title: "Template applied successfully!" });
        setLocation(`/workflows/${newWorkflow.id}`);
      },
      onError: () => {
        toast({ title: "Failed to apply template", variant: "destructive" });
      }
    }
  });

  const filtered = templates.filter(t => {
    if (category !== "All" && t.category !== category) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase()) && !t.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const getComplexityColor = (c: string) => {
    if (c === "beginner") return "bg-green-500/10 text-green-600 hover:bg-green-500/20";
    if (c === "intermediate") return "bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20";
    if (c === "advanced") return "bg-red-500/10 text-red-600 hover:bg-red-500/20";
    return "bg-gray-500/10 text-gray-600";
  };

  const formatUses = (uses: number) => {
    if (uses >= 1000) return `${(uses / 1000).toFixed(1)}k uses`;
    return `${uses} uses`;
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Workflow Templates</h1>
        <p className="text-muted-foreground mt-2">Start quickly with pre-built workflows for common tasks.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <Tabs value={category} onValueChange={setCategory} className="w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
          <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
            {CATEGORIES.map(c => (
              <TabsTrigger key={c} value={c} className="px-3 py-1.5 text-sm">
                {c}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search templates..." 
            className="pl-8" 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Loading templates...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(template => (
            <Card key={template.id} className="flex flex-col h-full overflow-hidden hover:border-primary/50 transition-colors">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="secondary" className={getComplexityColor(template.complexity)}>
                    {template.complexity}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                    <Activity className="h-3 w-3" />
                    {formatUses(template.uses)}
                  </span>
                </div>
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1 min-h-[40px]">
                  {template.description}
                </p>
              </CardHeader>
              <CardContent className="pb-4 flex-1">
                <div className="flex flex-wrap gap-2 mb-4">
                  {template.tags?.map(tag => (
                    <Badge key={tag} variant="outline" className="text-[10px] uppercase font-semibold text-muted-foreground bg-muted/40">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Layers className="h-4 w-4" />
                    <span>{template.nodeCount} nodes</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
                    <span className="truncate max-w-[120px]">{template.triggerType}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-0 mt-auto border-t bg-muted/20 p-4">
                <Button 
                  className="w-full font-medium shadow-none hover:shadow-sm" 
                  onClick={() => useMutation.mutate({ id: template.id })}
                  disabled={useMutation.isPending}
                >
                  {useMutation.isPending ? "Applying..." : "Use Template"}
                </Button>
              </CardFooter>
            </Card>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground">
              No templates found matching your search.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
