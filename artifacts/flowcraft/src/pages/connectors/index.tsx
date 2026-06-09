import { useState } from "react";
import { 
  useListConnectors, 
  useListConnectorCategories, 
  useInstallConnector,
  getListConnectorsQueryKey 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Download, Check, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function Connectors() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories } = useListConnectorCategories();
  const { data: connectors, isLoading } = useListConnectors({ search, category });

  const installMutation = useInstallConnector({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListConnectorsQueryKey() });
        toast({ title: "Connector installed successfully" });
      }
    }
  });

  return (
    <div className="flex h-full gap-8 max-w-7xl mx-auto">
      <div className="w-64 flex-shrink-0 space-y-6 hidden md:block">
        <div>
          <h2 className="font-semibold text-lg mb-4">Categories</h2>
          <div className="space-y-1">
            <button 
              onClick={() => setCategory(undefined)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${!category ? 'bg-primary text-primary-foreground font-medium' : 'hover:bg-muted text-muted-foreground'}`}
            >
              All Connectors
            </button>
            {categories?.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setCategory(cat.name)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${category === cat.name ? 'bg-primary text-primary-foreground font-medium' : 'hover:bg-muted text-muted-foreground'}`}
              >
                <span>{cat.name}</span>
                <span className={`text-xs ${category === cat.name ? 'text-primary-foreground/80' : 'opacity-50'}`}>{cat.count}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-6 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Connectors</h1>
            <p className="text-muted-foreground mt-1">Integrate with your favorite services.</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search integrations..." 
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))
          ) : connectors?.length === 0 ? (
            <div className="col-span-full py-12 text-center text-muted-foreground">
              No connectors found matching your criteria.
            </div>
          ) : (
            connectors?.map((conn) => (
              <Card key={conn.id} className="flex flex-col">
                <CardContent className="p-6 flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: `${conn.color}20`, color: conn.color || 'var(--primary)' }}>
                      {/* Placeholder for icon, API just provides a string so we use the first letter if it doesn't map to a lucide icon */}
                      {conn.name.charAt(0)}
                    </div>
                    {conn.isInstalled ? (
                      <div className="bg-emerald-500/10 text-emerald-600 text-xs font-semibold px-2 py-1 rounded-md flex items-center gap-1">
                        <Check className="h-3 w-3" /> Installed
                      </div>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="secondary"
                        onClick={() => installMutation.mutate({ id: conn.id })}
                        disabled={installMutation.isPending}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Install
                      </Button>
                    )}
                  </div>
                  <div className="mt-4">
                    <h3 className="font-semibold text-lg">{conn.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{conn.description}</p>
                  </div>
                  <div className="mt-auto pt-4 flex items-center justify-between text-xs text-muted-foreground border-t">
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      {conn.rating?.toFixed(1) || 'New'}
                    </div>
                    <span>{conn.author || 'FlowCraft'}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}