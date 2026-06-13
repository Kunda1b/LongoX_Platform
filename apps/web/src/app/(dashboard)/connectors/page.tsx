"use client";

import { useListConnectors, customFetch } from "@longox/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plug, Plus, Settings, ArrowUpCircle, Trash2, Download } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ConnectorsPage() {
  const { data: connectors, isLoading } = useListConnectors();

  const handleAction = async (id: number, action: string) => {
    try {
      await customFetch(`/api/connectors/${id}/${action}`, { method: "POST" });
      window.location.reload();
    } catch (e) {
      console.error(e);
      alert(`Failed to ${action} connector`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Connectors</h1>
          <p className="text-sm text-muted-foreground">
            Manage external service connections
          </p>
        </div>
        <Button>
          <Plus className="mr-1 h-4 w-4" /> Add Connector
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))
        ) : connectors?.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-12 text-center">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
              <Plug className="size-6" />
            </div>
            <div className="flex max-w-sm flex-col items-center gap-1">
              <div className="text-lg font-medium tracking-tight">
                No connectors found
              </div>
              <p className="text-sm text-muted-foreground">
                Connect to external services to power your workflows
              </p>
            </div>
            <Button className="mt-2">
              <Plus className="mr-1 h-4 w-4" /> Browse connectors
            </Button>
          </div>
        ) : (
          connectors?.map((c) => (
            <Card key={c.id}>
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="flex items-center gap-2">
                  {c.icon && (
                    <img
                      src={c.icon}
                      alt={c.name}
                      className="h-8 w-8 rounded"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  )}
                  <div>
                    <CardTitle className="text-sm">
                      {c.displayName || c.name}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground capitalize">
                      {c.category}
                    </p>
                  </div>
                </div>
                <Plug
                  className={`h-4 w-4 ${
                    c.healthStatus === "healthy"
                      ? "text-emerald-500"
                      : c.healthStatus === "error"
                        ? "text-destructive"
                        : "text-muted-foreground"
                  }`}
                />
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  {c.isInstalled ? (
                    <Badge variant="success">Installed</Badge>
                  ) : (
                    <Badge variant="secondary">Available</Badge>
                  )}
                  {c.isFeatured && (
                    <Badge variant="outline">Featured</Badge>
                  )}
                </div>
                {c.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {c.description}
                  </p>
                )}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {c.actionCount > 0 && <span>{c.actionCount} actions</span>}
                  {c.triggerCount > 0 && <span>{c.triggerCount} triggers</span>}
                  {c.rating && <span>★ {c.rating}</span>}
                </div>
              </CardContent>
              <CardFooter className="flex gap-2 pt-2 pb-4 px-6 border-t mt-4 bg-muted/50 rounded-b-xl">
                {!c.isInstalled && (
                  <Button size="sm" className="w-full" onClick={() => handleAction(c.id, "install")}>
                    <Download className="mr-2 h-4 w-4" /> Install
                  </Button>
                )}
                {c.isInstalled && (
                  <>
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => handleAction(c.id, "configure")}>
                      <Settings className="mr-2 h-4 w-4" /> Configure
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => handleAction(c.id, "upgrade")}>
                      <ArrowUpCircle className="mr-2 h-4 w-4" /> Upgrade
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleAction(c.id, "remove")}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
