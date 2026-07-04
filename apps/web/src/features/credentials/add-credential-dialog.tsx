"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useListConnectors, customFetch, getListCredentialsQueryKey } from "@longox/api-client-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function AddCredentialDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [connectorId, setConnectorId] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: connectors } = useListConnectors();

  const selectedConnector = connectors?.find(c => String(c.id) === connectorId);

  const reset = () => {
    setName("");
    setConnectorId("");
    setFields({});
  };

  const handleSubmit = async () => {
    if (!name || !connectorId) {
      toast({ title: "Name and connector are required", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await customFetch("/api/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          connectorId: connectorId,
          fields,
        }),
      });
      queryClient.invalidateQueries({ queryKey: getListCredentialsQueryKey() });
      toast({ title: "Credential added" });
      setOpen(false);
      reset();
    } catch {
      toast({ title: "Failed to create credential", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-1 h-4 w-4" /> Add Credential
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Credential</DialogTitle>
          <DialogDescription>
            Store sensitive connection details securely.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Production DB" />
          </div>
          <div className="space-y-1.5">
            <Label>Connector Type</Label>
            <Select value={connectorId} onValueChange={setConnectorId}>
              <SelectTrigger>
                <SelectValue placeholder="Select connector" />
              </SelectTrigger>
              <SelectContent>
                {connectors?.map(c => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.displayName || c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedConnector && (selectedConnector as any).authFields?.map((field: string) => (
            <div key={field} className="space-y-1.5">
              <Label>{field}</Label>
              <Input
                type="password"
                value={fields[field] ?? ""}
                onChange={e => setFields(prev => ({ ...prev, [field]: e.target.value }))}
                placeholder={`Enter ${field}`}
              />
            </div>
          ))}
          {selectedConnector && !(selectedConnector as any).authFields && (
            <>
              <div className="space-y-1.5">
                <Label>API Key</Label>
                <Input
                  type="password"
                  value={fields.apiKey ?? ""}
                  onChange={e => setFields(prev => ({ ...prev, apiKey: e.target.value }))}
                  placeholder="Enter API key"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Secret (optional)</Label>
                <Input
                  type="password"
                  value={fields.secret ?? ""}
                  onChange={e => setFields(prev => ({ ...prev, secret: e.target.value }))}
                  placeholder="Enter secret"
                />
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { setOpen(false); reset(); }}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Saving..." : "Save Credential"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
