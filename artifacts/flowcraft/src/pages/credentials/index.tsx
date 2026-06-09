import { useState } from "react";
import { 
  useListCredentials, 
  useCreateCredential, 
  useDeleteCredential,
  useListConnectors,
  getListCredentialsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { KeyRound, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Credentials() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [connectorId, setConnectorId] = useState("");
  const [fieldsText, setFieldsText] = useState("");

  const { data: credentials = [], isLoading } = useListCredentials();
  const { data: connectors = [] } = useListConnectors({ installed: true });

  const createMutation = useCreateCredential({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCredentialsQueryKey() });
        setOpen(false);
        setName("");
        setConnectorId("");
        setFieldsText("");
        toast({ title: "Credential saved" });
      },
      onError: () => {
        toast({ title: "Failed to save credential", variant: "destructive" });
      }
    }
  });

  const deleteMutation = useDeleteCredential({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCredentialsQueryKey() });
        toast({ title: "Credential deleted" });
      }
    }
  });

  const handleCreate = () => {
    if (!name || !connectorId) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    const fields = fieldsText.split(",").map(s => s.trim()).filter(Boolean);
    const numericConnectorId = parseInt(connectorId, 10);
    const selectedConnector = connectors.find(c => c.id === numericConnectorId);
    createMutation.mutate({
      data: {
        name,
        connectorId: numericConnectorId,
        connectorName: selectedConnector?.name ?? "",
        fields
      }
    });
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Credentials</h1>
          <p className="text-muted-foreground mt-1">Store API keys and secrets for your connectors.</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Credential
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Credential</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Production Stripe Key" />
              </div>
              <div className="space-y-2">
                <Label>Connector</Label>
                <Select value={connectorId} onValueChange={setConnectorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a connector" />
                  </SelectTrigger>
                  <SelectContent>
                    {connectors.map(c => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fields (comma separated)</Label>
                <Input 
                  value={fieldsText} 
                  onChange={e => setFieldsText(e.target.value)} 
                  placeholder="API Key, Webhook Secret" 
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Loading credentials...</div>
      ) : credentials.length === 0 ? (
        <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-4 text-balance rounded-lg border border-dashed p-6 text-center md:p-12">
          <div className="bg-muted text-foreground flex size-12 shrink-0 items-center justify-center rounded-lg">
            <KeyRound className="size-6" />
          </div>
          <div className="flex max-w-sm flex-col items-center gap-1 text-center">
            <div className="text-lg font-medium tracking-tight text-foreground">No credentials saved</div>
            <p className="text-muted-foreground text-sm/relaxed">Add API keys and secrets for your installed connectors to use in workflows.</p>
          </div>
          <Button onClick={() => setOpen(true)} className="mt-2">Add credential</Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {credentials.map(cred => (
            <Card key={cred.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                    <KeyRound className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{cred.name}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-2 mt-0.5">
                      <span className="font-medium text-foreground">{cred.connectorName}</span>
                      <span>•</span>
                      <span>{cred.fields?.length || 0} fields</span>
                      <span>•</span>
                      <span>Added {format(new Date(cred.createdAt), "MMM d, yyyy")}</span>
                    </p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => {
                    if (confirm("Delete this credential?")) {
                      deleteMutation.mutate({ id: cred.id });
                    }
                  }}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}