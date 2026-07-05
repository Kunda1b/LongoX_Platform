"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  customFetch,
  getListEnvironmentsQueryKey,
} from "@longox/api-client-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ENV_TYPES = [
  { value: "dev", label: "Development" },
  { value: "staging", label: "Staging" },
  { value: "prod", label: "Production" },
];

export function AddEnvironmentDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("dev");
  const [description, setDescription] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const reset = () => {
    setName("");
    setType("dev");
    setDescription("");
    setIsDefault(false);
  };

  const handleSubmit = async () => {
    if (!name) {
      toast({ title: "Environment name is required", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await customFetch("/api/environments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, type, description, isDefault }),
      });
      queryClient.invalidateQueries({
        queryKey: getListEnvironmentsQueryKey(),
      });
      toast({ title: `Environment "${name}" created` });
      setOpen(false);
      reset();
    } catch {
      toast({ title: "Failed to create environment", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-1 h-4 w-4" /> Add Environment
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Environment</DialogTitle>
          <DialogDescription>
            Create a new deployment environment for your workflows.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Production"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ENV_TYPES.map((et) => (
                  <SelectItem key={et.value} value={et.value}>
                    {et.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={isDefault}
              onCheckedChange={setIsDefault}
              id="default-env"
            />
            <Label htmlFor="default-env">Set as default environment</Label>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setOpen(false);
              reset();
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Creating..." : "Create Environment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
