import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Webhook, Plus, Copy, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { formatDistanceToNow } from "date-fns";

const API = "/api";

interface WebhookEndpoint {
  id: number;
  workflowId: number;
  name: string;
  description: string | null;
  isActive: boolean;
  lastTriggeredAt: string | null;
  triggerCount: number;
}

async function fetchWebhookEndpoints(): Promise<WebhookEndpoint[]> {
  const res = await fetch(`${API}/webhook-endpoints`);
  if (!res.ok) throw new Error("Failed to fetch webhook endpoints");
  return res.json();
}

export default function WebhookEndpointsPage() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: endpoints, isLoading } = useQuery({
    queryKey: ["webhook-endpoints"],
    queryFn: fetchWebhookEndpoints,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${API}/webhook-endpoints/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhook-endpoints"] });
      toast({ title: "Endpoint deleted" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const copyToClipboard = (id: number) => {
    const url = `${window.location.origin}/api/webhooks/${id}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Copied to clipboard" });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Webhook Endpoints</h1>
          <p className="text-muted-foreground mt-1">Manage incoming webhook URLs for your workflows.</p>
        </div>
        <Button onClick={() => navigate("/workflows")} className="gap-2">
          <Plus className="h-4 w-4" /> New Endpoint
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            All Endpoints
          </CardTitle>
          <CardDescription>
            Each endpoint provides a unique URL that triggers a workflow when called.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : !endpoints?.length ? (
            <div className="text-center py-12 text-muted-foreground">
              <Webhook className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No webhook endpoints yet</p>
              <p className="text-sm mt-1">Create a workflow with a webhook trigger to get started.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Triggered</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {endpoints.map((ep) => (
                    <TableRow key={ep.id}>
                      <TableCell>
                        <div className="font-medium">{ep.name}</div>
                        {ep.description && <div className="text-xs text-muted-foreground">{ep.description}</div>}
                      </TableCell>
                      <TableCell>
                        <Badge variant={ep.isActive ? "success" : "secondary"}>
                          {ep.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{ep.triggerCount} calls</div>
                        {ep.lastTriggeredAt && (
                          <div className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(ep.lastTriggeredAt), { addSuffix: true })}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => copyToClipboard(ep.id)} title="Copy webhook URL">
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(ep.id)} title="Delete">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
